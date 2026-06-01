/**
 * ============================================================================
 * CONTROLLER: AMIZADES
 * ============================================================================
 * Gerencia relações de amizade entre usuários com fluxo completo:
 * solicitação → aceitar/recusar → amizade → desfazer
 *
 * SEGURANÇA:
 * ✓ Autenticação JWT obrigatória em todas as rotas
 * ✓ Validação de ownership (usuário só acessa seus dados)
 * ✓ Validação de input com prevenção de injeção
 * ✓ Logs de auditoria para todas as ações críticas
 * ✓ Tratamento de erros robusto com mensagens genéricas em produção
 *
 * ARQUITETURA:
 * - Usa modelo Amizade otimizado com histórico completo
 * - Implementa validações em pré-hooks do Mongoose
 * - Mantém integridade referencial entre usuários
 */

const mongoose = require('mongoose');
const { Amizade, Usuario, Auditoria } = require('../models');

// ============================================================================
// FUNÇÃO 1: ENVIAR SOLICITAÇÃO DE AMIZADE
// ============================================================================

/**
 * POST /api/amizades/solicitar
 * Envia uma solicitação de amizade de usuarioId para amigoId
 *
 * O QUÊ: Cria um novo registro de amizade com status "pendente"
 *
 * PORQUÊ: Permite que usuários se conectem na rede social de forma controlada.
 * A solicitação fica pendente até o outro usuário aceitar ou recusar.
 *
 * FLUXO DE DADOS:
 * 1. Validar JWT (middleware authMiddleware já faz isso)
 * 2. Validar se amigoId é diferente de usuarioId (sem auto-amizade)
 * 3. Validar se amigoId é um ObjectId válido
 * 4. Verificar se ambos os usuários existem e estão ativos
 * 5. Verificar se já existe relação entre eles (ativa ou pendente)
 * 6. Criar novo documento Amizade com status "pendente"
 * 7. Registrar ação na auditoria
 * 8. Retornar 201 Created com dados da amizade criada
 *
 * ERROS TRATADOS:
 * - 400: amigoId é o mesmo que usuarioId (auto-amizade)
 * - 400: amigoId é inválido ou não é ObjectId
 * - 404: Usuário destino não encontrado
 * - 404: Usuário autenticado não encontrado
 * - 409: Já existe solicitação ou amizade entre estes usuários
 * - 500: Erro de banco de dados (salvar documento)
 *
 * @param {Object} req - Objeto de requisição Express
 *   req.usuario.id - ID do usuário autenticado (JWT)
 *   req.body.amigoId - ID do usuário que receberá a solicitação
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Middleware de erro
 *
 * @returns {201} { amizade: {...}, message: "Solicitação enviada" }
 * @returns {400 | 404 | 409 | 500} { error: "mensagem" }
 */
exports.enviarSolicitacao = async (req, res, next) => {
  try {
    // Extrai usuarioId do JWT (garantido pelo authMiddleware)
    const usuarioId = req.usuario.id;
    
    // Extrai amigoId do corpo da requisição
    const { amigoId } = req.body;

    // ========== VALIDAÇÃO 1: amigoId é obrigatório ==========
    if (!amigoId) {
      return res.fail('ID do amigo é obrigatório.', 400);
    }

    // ========== VALIDAÇÃO 2: amigoId deve ser um ObjectId válido ==========
    if (!mongoose.Types.ObjectId.isValid(amigoId)) {
      return res.fail('ID do amigo inválido.', 400);
    }

    // ========== VALIDAÇÃO 3: Evitar auto-amizade ==========
    if (String(usuarioId) === String(amigoId)) {
      return res.fail('Você não pode enviar solicitação para si mesmo.', 400);
    }

    // ========== VALIDAÇÃO 4: Verificar se ambos usuários existem ==========
    const [usuarioAutenticado, usuarioAlvo] = await Promise.all([
      Usuario.findById(usuarioId),
      Usuario.findById(amigoId),
    ]);

    if (!usuarioAutenticado) {
      return res.fail('Usuário autenticado não encontrado.', 404);
    }

    if (!usuarioAlvo) {
      return res.fail('Usuário destino não encontrado.', 404);
    }

    // ========== VALIDAÇÃO 5: Verificar se já existe relação ==========
    // Busca QUALQUER relação ativa (pendente ou aceito)
    const jaExiste = await Amizade.findOne({
      $or: [
        { usuarioId, amigoId, status: { $in: ['pendente', 'aceito'] } },
        { usuarioId: amigoId, amigoId: usuarioId, status: { $in: ['pendente', 'aceito'] } },
      ],
    });

    if (jaExiste) {
      return res.fail(
        'Já existe uma solicitação ou amizade com este usuário.',
        409
      );
    }

    // ========== CRIAR SOLICITAÇÃO ==========
    const amizade = new Amizade({
      usuarioId: amigoId,  // Quem vai RECEBER a solicitação
      amigoId: usuarioId,  // Quem ENVIOU a solicitação
      status: 'pendente',
      dataSolicitacao: new Date(),
    });

    await amizade.save();

    // ========== REGISTRAR NA AUDITORIA ==========
    await Auditoria.create({
      usuario_id: usuarioId,
      acao: 'solicitacao-amizade-enviada',
      descricao: `Solicitação de amizade enviada para ${usuarioAlvo.perfil.nome} (${amigoId})`,
      endereco_ip: req.ip || req.connection.remoteAddress,
    });

    // ========== RESPONDER COM SUCESSO ==========
    return res.success(
      {
        id: amizade._id,
        usuarioId: amizade.usuarioId,
        amigoId: amizade.amigoId,
        status: amizade.status,
        dataSolicitacao: amizade.dataSolicitacao,
      },
      'Solicitação de amizade enviada com sucesso.',
      201
    );
  } catch (erro) {
    // Erros não previstos vão para o middleware de erro global
    return next(erro);
  }
};

// ============================================================================
// FUNÇÃO 2: ACEITAR SOLICITAÇÃO DE AMIZADE
// ============================================================================

/**
 * POST /api/amizades/:id/aceitar
 * Aceita uma solicitação de amizade pendente
 *
 * O QUÊ: Muda o status da amizade de "pendente" para "aceito"
 *
 * PORQUÊ: Confirma que ambos os usuários desejam ser amigos, tornando
 * a relação bilateral e ativa na rede.
 *
 * FLUXO DE DADOS:
 * 1. Validar JWT
 * 2. Validar se ID da amizade é um ObjectId válido
 * 3. Buscar documento Amizade pelo ID
 * 4. Verificar se o usuário autenticado é o destinatário (ownership)
 * 5. Verificar se status é "pendente"
 * 6. Mudar status para "aceito" e definir dataResposta
 * 7. Registrar na auditoria
 * 8. Retornar 200 com amizade aceita
 *
 * ERROS TRATADOS:
 * - 400: ID da amizade inválido
 * - 404: Amizade não encontrada
 * - 403: Usuário autenticado não é o destinatário (autorização)
 * - 409: Amizade não está em status "pendente"
 * - 500: Erro ao salvar
 *
 * @param {Object} req
 *   req.usuario.id - ID do usuário autenticado
 *   req.params.id - ID do documento Amizade
 * @param {Object} res
 * @param {Function} next
 *
 * @returns {200} { amizade: {...}, message: "Amizade aceita" }
 * @returns {400 | 403 | 404 | 409 | 500} { error: "mensagem" }
 */
exports.aceitarSolicitacao = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const { id: amizadeId } = req.params;

    // ========== VALIDAÇÃO 1: ID da amizade é válido ==========
    if (!mongoose.Types.ObjectId.isValid(amizadeId)) {
      return res.fail('ID da solicitação inválido.', 400);
    }

    // ========== BUSCAR AMIZADE ==========
    const amizade = await Amizade.findById(amizadeId);

    if (!amizade) {
      return res.fail('Solicitação de amizade não encontrada.', 404);
    }

    // ========== VALIDAÇÃO 2: Ownership - usuário é o destinatário ==========
    // usuarioId deve ser o recipient (aquele que recebeu, não quem enviou)
    if (String(amizade.usuarioId) !== String(usuarioId)) {
      return res.fail(
        'Você não tem permissão para aceitar esta solicitação.',
        403
      );
    }

    // ========== VALIDAÇÃO 3: Status é "pendente" ==========
    if (amizade.status !== 'pendente') {
      return res.fail(
        `Esta solicitação já foi ${amizade.status}.`,
        409
      );
    }

    // ========== ACEITAR SOLICITAÇÃO ==========
    // Usar método do schema se disponível
    if (typeof amizade.aceitar === 'function') {
      await amizade.aceitar();
    } else {
      amizade.status = 'aceito';
      amizade.dataResposta = new Date();
      await amizade.save();
    }

    // ========== REGISTRAR NA AUDITORIA ==========
    const solicitante = await Usuario.findById(amizade.amigoId);
    await Auditoria.create({
      usuario_id: usuarioId,
      acao: 'solicitacao-amizade-aceita',
      descricao: `Solicitação de amizade de ${solicitante?.perfil?.nome || 'usuário desconhecido'} aceita`,
      endereco_ip: req.ip || req.connection.remoteAddress,
    });

    // ========== RESPONDER COM SUCESSO ==========
    return res.success(
      {
        id: amizade._id,
        usuarioId: amizade.usuarioId,
        amigoId: amizade.amigoId,
        status: amizade.status,
        dataResposta: amizade.dataResposta,
      },
      'Solicitação de amizade aceita com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

// ============================================================================
// FUNÇÃO 3: RECUSAR SOLICITAÇÃO DE AMIZADE
// ============================================================================

/**
 * POST /api/amizades/:id/recusar
 * Recusa uma solicitação de amizade pendente
 *
 * O QUÊ: Muda o status de "pendente" para "recusado"
 *
 * PORQUÊ: Permite que usuários rejeitem solicitações sem estabelecer
 * amizade. Importante para controle de relacionamentos.
 *
 * FLUXO DE DADOS:
 * 1. Validar JWT
 * 2. Validar ID da amizade
 * 3. Buscar amizade
 * 4. Verificar ownership
 * 5. Verificar status "pendente"
 * 6. Marcar como "recusado" com motivo (opcional)
 * 7. Registrar auditoria
 * 8. Retornar 200
 *
 * ERROS TRATADOS:
 * - 400: ID inválido
 * - 404: Amizade não encontrada
 * - 403: Sem permissão
 * - 409: Status não é "pendente"
 * - 500: Erro ao salvar
 *
 * @param {Object} req
 *   req.usuario.id - ID do usuário
 *   req.params.id - ID da amizade
 *   req.body.motivo - Motivo da recusa (opcional)
 * @param {Object} res
 * @param {Function} next
 *
 * @returns {200} { message: "Solicitação recusada" }
 */
exports.recusarSolicitacao = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const { id: amizadeId } = req.params;
    const { motivo = '' } = req.body;

    // ========== VALIDAÇÕES ==========
    if (!mongoose.Types.ObjectId.isValid(amizadeId)) {
      return res.fail('ID da solicitação inválido.', 400);
    }

    const amizade = await Amizade.findById(amizadeId);

    if (!amizade) {
      return res.fail('Solicitação não encontrada.', 404);
    }

    if (String(amizade.usuarioId) !== String(usuarioId)) {
      return res.fail('Você não tem permissão para recusar esta solicitação.', 403);
    }

    if (amizade.status !== 'pendente') {
      return res.fail(`Esta solicitação já foi ${amizade.status}.`, 409);
    }

    // ========== RECUSAR ==========
    if (typeof amizade.recusar === 'function') {
      await amizade.recusar(motivo);
    } else {
      amizade.status = 'recusado';
      amizade.motivoRecusa = motivo;
      amizade.dataResposta = new Date();
      await amizade.save();
    }

    // ========== AUDITORIA ==========
    await Auditoria.create({
      usuario_id: usuarioId,
      acao: 'solicitacao-amizade-recusada',
      descricao: `Solicitação de amizade recusada`,
      endereco_ip: req.ip || req.connection.remoteAddress,
    });

    return res.success(null, 'Solicitação recusada com sucesso.');
  } catch (erro) {
    return next(erro);
  }
};

// ============================================================================
// FUNÇÃO 4: DESFAZER AMIZADE
// ============================================================================

/**
 * DELETE /api/amizades/:id
 * Remove uma amizade existente
 *
 * O QUÊ: Muda status de "aceito" para "recusado", desfeito pelo motivo
 *
 * PORQUÊ: Permite que amigos se "dsfaçam" removendo a relação de forma
 * rastreável (mantém histórico).
 *
 * FLUXO DE DADOS:
 * 1. Validar JWT
 * 2. Validar ID
 * 3. Buscar amizade
 * 4. Verificar ownership (qualquer um dos dois amigos pode desfazer)
 * 5. Verificar status "aceito"
 * 6. Marcar como "recusado" com motivo "Amizade desfeita"
 * 7. Auditoria
 * 8. Retornar 200
 *
 * ERROS TRATADOS:
 * - 400: ID inválido
 * - 404: Amizade não encontrada
 * - 403: Sem permissão (não é um dos amigos)
 * - 409: Status não é "aceito"
 * - 500: Erro ao salvar
 *
 * @param {Object} req
 *   req.usuario.id - ID do usuário
 *   req.params.id - ID da amizade
 * @param {Object} res
 * @param {Function} next
 *
 * @returns {200} { message: "Amizade desfeita" }
 */
exports.desfazerAmizade = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const { id: amizadeId } = req.params;

    // ========== VALIDAÇÕES ==========
    if (!mongoose.Types.ObjectId.isValid(amizadeId)) {
      return res.fail('ID da amizade inválido.', 400);
    }

    const amizade = await Amizade.findById(amizadeId);

    if (!amizade) {
      return res.fail('Amizade não encontrada.', 404);
    }

    // Qualquer um dos dois pode desfazer
    const ehParticipante =
      String(amizade.usuarioId) === String(usuarioId) ||
      String(amizade.amigoId) === String(usuarioId);

    if (!ehParticipante) {
      return res.fail('Você não tem permissão para desfazer esta amizade.', 403);
    }

    if (amizade.status !== 'aceito') {
      return res.fail('Apenas amizades ativas podem ser desfeitas.', 409);
    }

    // ========== DESFAZER ==========
    if (typeof amizade.desfazer === 'function') {
      await amizade.desfazer();
    } else {
      amizade.status = 'recusado';
      amizade.motivoRecusa = 'Amizade desfeita';
      amizade.dataResposta = new Date();
      await amizade.save();
    }

    // ========== AUDITORIA ==========
    await Auditoria.create({
      usuario_id: usuarioId,
      acao: 'amizade-desfeita',
      descricao: `Amizade desfeita`,
      endereco_ip: req.ip || req.connection.remoteAddress,
    });

    return res.success(null, 'Amizade desfeita com sucesso.');
  } catch (erro) {
    return next(erro);
  }
};

// ============================================================================
// FUNÇÃO 5: LISTAR AMIGOS
// ============================================================================

/**
 * GET /api/amizades/meus-amigos
 * Lista todos os amigos do usuário autenticado com paginação
 *
 * O QUÊ: Retorna array de amigos aceitos com seus dados públicos
 *
 * PORQUÊ: Necessário para mostrar lista de amigos no app
 *
 * FLUXO DE DADOS:
 * 1. Validar JWT
 * 2. Extrair query params (page, limit)
 * 3. Validar pagination
 * 4. Buscar amizades com status "aceito"
 * 5. Populate dados dos usuários
 * 6. Aplicar skip/limit
 * 7. Contar total
 * 8. Retornar com paginação
 *
 * QUERY PARAMS:
 * - page: número da página (default: 1)
 * - limit: itens por página (default: 20, máximo: 100)
 *
 * ERROS TRATADOS:
 * - 500: Erro de banco de dados
 *
 * @param {Object} req
 *   req.usuario.id - ID do usuário
 *   req.query.page - Página (1-indexed)
 *   req.query.limit - Itens por página
 * @param {Object} res
 * @param {Function} next
 *
 * @returns {200} { amigos: [...], total: 42, page: 1, pages: 3 }
 */
exports.listarAmigos = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    // Calcular skip
    const skip = (page - 1) * limit;

    // ========== BUSCAR AMIGOS ==========
    // Busca em ambas as direções:
    // 1. onde eu sou usuarioId (solicitei e foi aceito)
    // 2. onde eu sou amigoId (recebi e aceitei)
    const amigos = await Amizade.find({
      $or: [
        { usuarioId, status: 'aceito' },
        { amigoId: usuarioId, status: 'aceito' },
      ],
    })
      .populate({
        path: 'amigoId',
        select: 'perfil.nome perfil.bio customizacao.foto_perfil_url',
      })
      .populate({
        path: 'usuarioId',
        select: 'perfil.nome perfil.bio customizacao.foto_perfil_url',
      })
      .sort({ dataSolicitacao: -1 })
      .skip(skip)
      .limit(limit);

    // Mapear para retornar o outro amigo (não o próprio usuário)
    const amigosFormatados = amigos.map((rel) => {
      const amigo = String(rel.usuarioId._id) === String(usuarioId)
        ? rel.amigoId
        : rel.usuarioId;
      return amigo;
    });

    // ========== CONTAR TOTAL ==========
    const total = await Amizade.countDocuments({
      $or: [
        { usuarioId, status: 'aceito' },
        { amigoId: usuarioId, status: 'aceito' },
      ],
    });

    const pages = Math.ceil(total / limit);

    return res.success(
      {
        amigos: amigosFormatados,
        total,
        page,
        pages,
        limit,
      },
      'Amigos carregados com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

// ============================================================================
// FUNÇÃO 6: LISTAR SOLICITAÇÕES PENDENTES
// ============================================================================

/**
 * GET /api/amizades/solicitacoes
 * Lista solicitações pendentes recebidas pelo usuário
 *
 * O QUÊ: Array de solicitações esperando resposta do usuário
 *
 * PORQUÊ: Mostrar notificações de solicitações recebidas
 *
 * FLUXO DE DADOS:
 * 1. Validar JWT
 * 2. Query params (page, limit)
 * 3. Buscar amizades onde status="pendente" e usuarioId=eu
 * 4. Populate dados de quem enviou (amigoId)
 * 5. Paginação
 * 6. Retornar com contador
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 *
 * @returns {200} { solicitacoes: [...], total: 5, page: 1, pages: 1 }
 */
exports.listarSolicitacoes = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const skip = (page - 1) * limit;

    // ========== BUSCAR SOLICITAÇÕES RECEBIDAS ==========
    // Recebidas = onde EU sou usuarioId e status é "pendente"
    const solicitacoes = await Amizade.find({
      usuarioId,
      status: 'pendente',
    })
      .populate({
        path: 'amigoId',
        select: 'perfil.nome perfil.bio customizacao.foto_perfil_url',
      })
      .sort({ dataSolicitacao: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Amizade.countDocuments({
      usuarioId,
      status: 'pendente',
    });

    const pages = Math.ceil(total / limit);

    return res.success(
      {
        solicitacoes,
        total,
        page,
        pages,
        limit,
      },
      'Solicitações carregadas com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

// ============================================================================
// FUNÇÃO 7: VERIFICAR AMIZADE
// ============================================================================

/**
 * GET /api/amizades/verificar/:amigoId
 * Verifica o status da relação entre o usuário e outro
 *
 * O QUÊ: Retorna se são amigos, se há solicitação pendente, etc
 *
 * PORQUÊ: Usado no frontend para mostrar botões dinâmicos:
 * - "Adicionar como amigo" (não há relação)
 * - "Pendente" (tem solicitação)
 * - "Desfazer amizade" (já são amigos)
 *
 * FLUXO DE DADOS:
 * 1. Validar JWT
 * 2. Validar amigoId
 * 3. Buscar relação em ambas as direções
 * 4. Retornar status
 *
 * RETORNO:
 * {
 *   status: 'aceito' | 'pendente' | 'recusado' | null,
 *   soAmigos: boolean,
 *   temSolicitacaoPendente: boolean,
 *   quemEnviou: 'eu' | 'outro' | null
 * }
 *
 * @param {Object} req
 *   req.usuario.id - ID do usuário
 *   req.params.amigoId - ID do outro usuário
 * @param {Object} res
 * @param {Function} next
 *
 * @returns {200} { status: 'aceito', soAmigos: true, ... }
 */
exports.verificarAmizade = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const { amigoId } = req.params;

    // ========== VALIDAÇÕES ==========
    if (!mongoose.Types.ObjectId.isValid(amigoId)) {
      return res.fail('ID do amigo inválido.', 400);
    }

    if (String(usuarioId) === String(amigoId)) {
      return res.fail('Você não pode verificar relação consigo mesmo.', 400);
    }

    // ========== BUSCAR RELAÇÃO ==========
    const relacao = await Amizade.findOne({
      $or: [
        { usuarioId, amigoId },
        { usuarioId: amigoId, amigoId: usuarioId },
      ],
    });

    if (!relacao) {
      return res.success(
        {
          status: null,
          soAmigos: false,
          temSolicitacaoPendente: false,
          quemEnviou: null,
        },
        'Nenhuma relação encontrada.'
      );
    }

    // ========== FORMATAR RESPOSTA ==========
    const soAmigos = relacao.status === 'aceito';
    const temSolicitacaoPendente = relacao.status === 'pendente';

    let quemEnviou = null;
    if (temSolicitacaoPendente) {
      quemEnviou = String(relacao.amigoId) === String(usuarioId) ? 'outro' : 'eu';
    }

    return res.success(
      {
        id: relacao._id,
        status: relacao.status,
        soAmigos,
        temSolicitacaoPendente,
        quemEnviou,
        dataSolicitacao: relacao.dataSolicitacao,
        dataResposta: relacao.dataResposta,
      },
      'Status da relação verificado com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

module.exports = exports;
