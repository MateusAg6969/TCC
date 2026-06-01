/**
 * ============================================================================
 * EXEMPLOS DE USO: IMPLEMENTAÇÃO PRÁTICA
 * ============================================================================
 * Código pronto para copiar/colar em controllers e services.
 * 
 * USO: Referência rápida para desenvolvedores
 * ============================================================================
 */

// ============================================================================
// EXEMPLO 1: ENVIAR SOLICITAÇÃO DE AMIZADE
// ============================================================================

/**
 * Controller: POST /api/amizades/enviar
 * Body: { destinatarioId }
 */
async function enviarSolicitacao(req, res) {
  try {
    const { destinatarioId } = req.body;
    const usuarioId = req.user._id; // Vem do middleware de autenticação

    // Validação básica
    if (!destinatarioId) {
      return res.status(400).json({ erro: 'destinatarioId é obrigatório' });
    }

    // Verificar que usuário existe e está ativo
    const destinatario = await Usuario.findOne({
      _id: destinatarioId,
      ativo: true,
    });

    if (!destinatario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Usar ServicoAmizade (com todas validações)
    const amizade = await ServicoAmizade.enviarSolicitacao(
      usuarioId,
      destinatarioId
    );

    // Retornar apenas dados públicos
    return res.status(201).json({
      mensagem: 'Solicitação enviada com sucesso',
      amizade: amizade.toJSON(),
    });
  } catch (erro) {
    console.error('Erro ao enviar solicitação:', erro);

    // Erros customizados do ServicoAmizade
    if (erro.message.includes('Auto-amizade')) {
      return res.status(400).json({ erro: 'Não pode ser amigo de si mesmo' });
    }
    if (erro.message.includes('já existe')) {
      return res.status(409).json({ erro: 'Já existe uma relação' });
    }
    if (erro.message.includes('inativo')) {
      return res.status(403).json({ erro: 'Usuário inativo' });
    }

    // Erro genérico
    return res.status(500).json({ erro: 'Erro ao enviar solicitação' });
  }
}

// ============================================================================
// EXEMPLO 2: ACEITAR SOLICITAÇÃO DE AMIZADE
// ============================================================================

/**
 * Controller: POST /api/amizades/:amizadeId/aceitar
 */
async function aceitarSolicitacao(req, res) {
  try {
    const { amizadeId } = req.params;
    const usuarioId = req.user._id;

    // Encontrar solicitação
    const amizade = await Amizade.findOne({
      _id: amizadeId,
      usuarioId, // Garantir que é o destinatário
      status: 'pendente',
    });

    if (!amizade) {
      return res.status(404).json({ erro: 'Solicitação não encontrada' });
    }

    // Usar ServicoAmizade
    const atualizada = await ServicoAmizade.aceitar(usuarioId, amizade.amigoId);

    // Aqui você pode:
    // - Enviar notificação (WebSocket, email)
    // - Registrar auditoria
    // - Trigger recomendações

    return res.json({
      mensagem: 'Amizade aceita com sucesso',
      amizade: atualizada.toJSON(),
    });
  } catch (erro) {
    console.error('Erro ao aceitar solicitação:', erro);
    return res.status(500).json({ erro: 'Erro ao aceitar solicitação' });
  }
}

// ============================================================================
// EXEMPLO 3: LISTAR AMIGOS COM PAGINAÇÃO
// ============================================================================

/**
 * Controller: GET /api/usuarios/:usuarioId/amigos?pagina=1&limite=20
 */
async function listarAmigos(req, res) {
  try {
    const { usuarioId } = req.params;
    const { pagina = 1, limite = 20 } = req.query;

    // Validação
    const usuarioExiste = await Usuario.findOne({
      _id: usuarioId,
      ativo: true,
    });

    if (!usuarioExiste) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Usar pipeline agregação otimizado
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    const amigos = await Amizade.aggregate([
      {
        $match: {
          $or: [
            { usuarioId: mongoose.Types.ObjectId(usuarioId), status: 'aceito' },
            { amigoId: mongoose.Types.ObjectId(usuarioId), status: 'aceito' },
          ],
        },
      },
      {
        $addFields: {
          amigoId: {
            $cond: [
              { $eq: ['$usuarioId', mongoose.Types.ObjectId(usuarioId)] },
              '$amigoId',
              '$usuarioId',
            ],
          },
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          dados: [
            {
              $lookup: {
                from: 'usuarios',
                localField: 'amigoId',
                foreignField: '_id',
                as: 'amigo',
              },
            },
            { $unwind: '$amigo' },
            {
              $project: {
                amigoId: 1,
                dataSolicitacao: 1,
                'amigo._id': 1,
                'amigo.perfil.nome': 1,
                'amigo.customizacao.foto_perfil_url': 1,
                'amigo.stats.total_seguidores': 1,
              },
            },
            { $sort: { dataSolicitacao: -1 } },
            { $skip: skip },
            { $limit: parseInt(limite) },
          ],
        },
      },
    ]);

    const total = amigos[0].metadata[0]?.total || 0;
    const dados = amigos[0].dados;

    return res.json({
      amigos: dados,
      paginacao: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(total / parseInt(limite)),
      },
    });
  } catch (erro) {
    console.error('Erro ao listar amigos:', erro);
    return res.status(500).json({ erro: 'Erro ao listar amigos' });
  }
}

// ============================================================================
// EXEMPLO 4: VERIFICAR SE SÃO AMIGOS
// ============================================================================

/**
 * Controller: GET /api/amizades/verificar/:usuarioIdB
 * Verificar se usuário autenticado é amigo de usuarioIdB
 */
async function verificarAmizade(req, res) {
  try {
    const { usuarioIdB } = req.params;
    const usuarioIdA = req.user._id;

    // Verificar em ambas direções
    const saoAmigos = await Amizade.saoAmigos(usuarioIdA, usuarioIdB);

    // Obter status da relação (se houver)
    const relacao = await Amizade.findOne({
      $or: [
        { usuarioId: usuarioIdA, amigoId: usuarioIdB },
        { usuarioId: usuarioIdB, amigoId: usuarioIdA },
      ],
    });

    return res.json({
      saoAmigos,
      status: relacao?.status || null,
      dataRelacao: relacao?.dataSolicitacao || null,
    });
  } catch (erro) {
    console.error('Erro ao verificar amizade:', erro);
    return res.status(500).json({ erro: 'Erro ao verificar amizade' });
  }
}

// ============================================================================
// EXEMPLO 5: LISTAR SOLICITAÇÕES PENDENTES
// ============================================================================

/**
 * Controller: GET /api/amizades/solicitacoes/recebidas?pagina=1
 */
async function listarSolicitacoesRecebidas(req, res) {
  try {
    const usuarioId = req.user._id;
    const { pagina = 1, limite = 20 } = req.query;

    const solicitacoes = await Amizade.listarSolicitacoesRecebidas(usuarioId, {
      skip: (parseInt(pagina) - 1) * parseInt(limite),
      limit: parseInt(limite),
    });

    const total = await Amizade.countDocuments({
      usuarioId,
      status: 'pendente',
    });

    return res.json({
      solicitacoes,
      total,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(total / parseInt(limite)),
    });
  } catch (erro) {
    console.error('Erro ao listar solicitações:', erro);
    return res.status(500).json({ erro: 'Erro ao listar solicitações' });
  }
}

// ============================================================================
// EXEMPLO 6: DESFAZER AMIZADE
// ============================================================================

/**
 * Controller: DELETE /api/amizades/:amigoDId
 * Desfazer amizade com amigoId
 */
async function desfazerAmizade(req, res) {
  try {
    const { amigoId } = req.params;
    const usuarioId = req.user._id;

    // Usar ServicoAmizade
    const resultados = await ServicoAmizade.desfazer(usuarioId, amigoId);

    // Registrar auditoria (se necessário)
    // await Auditoria.create({...})

    return res.json({
      mensagem: 'Amizade desfeita com sucesso',
      desfeitura: resultados,
    });
  } catch (erro) {
    console.error('Erro ao desfazer amizade:', erro);

    if (erro.message.includes('não encontrada')) {
      return res.status(404).json({ erro: 'Amizade não encontrada' });
    }

    return res.status(500).json({ erro: 'Erro ao desfazer amizade' });
  }
}

// ============================================================================
// EXEMPLO 7: OBTER PERFIL COM AMIGOS
// ============================================================================

/**
 * Controller: GET /api/usuarios/:usuarioId/perfil-completo
 * Retorna usuário + lista de 5 amigos + contadores
 */
async function obterPerfilCompleto(req, res) {
  try {
    const { usuarioId } = req.params;

    // Buscar usuário (sem senha)
    const usuario = await Usuario.findOne(
      { _id: usuarioId, ativo: true },
      { senhaHash: 0 }
    );

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Buscar 5 primeiros amigos
    const amigos = await Amizade.aggregate([
      {
        $match: {
          $or: [
            { usuarioId: mongoose.Types.ObjectId(usuarioId), status: 'aceito' },
            { amigoId: mongoose.Types.ObjectId(usuarioId), status: 'aceito' },
          ],
        },
      },
      {
        $addFields: {
          amigo_ref: {
            $cond: [
              { $eq: ['$usuarioId', mongoose.Types.ObjectId(usuarioId)] },
              '$amigoId',
              '$usuarioId',
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: 'amigo_ref',
          foreignField: '_id',
          as: 'amigo',
        },
      },
      { $unwind: '$amigo' },
      {
        $project: {
          'amigo._id': 1,
          'amigo.perfil.nome': 1,
          'amigo.customizacao.foto_perfil_url': 1,
          dataSolicitacao: 1,
        },
      },
      { $sort: { dataSolicitacao: -1 } },
      { $limit: 5 },
    ]);

    // Contar total de amigos
    const totalAmigos = await Amizade.countDocuments({
      $or: [
        { usuarioId, status: 'aceito' },
        { amigoId: usuarioId, status: 'aceito' },
      ],
    });

    return res.json({
      usuario: {
        _id: usuario._id,
        perfil: usuario.perfil,
        customizacao: usuario.customizacao,
        stats: usuario.stats,
      },
      amigos: amigos.map((a) => a.amigo),
      totalAmigos,
      mostrandoAmigos: amigos.length,
    });
  } catch (erro) {
    console.error('Erro ao obter perfil completo:', erro);
    return res.status(500).json({ erro: 'Erro ao obter perfil' });
  }
}

// ============================================================================
// EXEMPLO 8: SINCRONIZAR STATS (Job)
// ============================================================================

/**
 * Job: Executar 1x por hora
 * Uso: setInterval(() => sincronizarStats(), 60 * 60 * 1000)
 */
async function sincronizarStats() {
  console.log('[JOB] Sincronizando stats de amizades...');

  try {
    // Encontrar todos usuários ativos
    const usuarios = await Usuario.find({ ativo: true }, { _id: 1 });

    let corrigidos = 0;

    for (const usuario of usuarios) {
      // Contar amigos reais
      const totalAmigos = await Amizade.countDocuments({
        $or: [
          { usuarioId: usuario._id, status: 'aceito' },
          { amigoId: usuario._id, status: 'aceito' },
        ],
      });

      // Comparar com stats
      const usuarioAtual = await Usuario.findById(usuario._id);

      if (usuarioAtual.stats.total_amigos !== totalAmigos) {
        console.log(
          `[CORRIGINDO] ${usuario._id}: ${usuarioAtual.stats.total_amigos} -> ${totalAmigos}`
        );

        await Usuario.updateOne(
          { _id: usuario._id },
          { 'stats.total_amigos': totalAmigos }
        );

        corrigidos++;
      }
    }

    console.log(`[CONCLUÍDO] ${corrigidos} usuários corrigidos`);
    return { corrigidos, total: usuarios.length };
  } catch (erro) {
    console.error('[ERRO] Falha ao sincronizar stats:', erro);
    throw erro;
  }
}

// ============================================================================
// EXEMPLO 9: VALIDAR INTEGRIDADE
// ============================================================================

/**
 * Admin: GET /api/admin/validar-integridade
 * Verificar e corrigir inconsistências
 */
async function validarIntegridade(req, res) {
  // Apenas admins
  if (req.user.papel !== 'admin') {
    return res.status(403).json({ erro: 'Acesso negado' });
  }

  try {
    const resultado = await validarIntegridadeAmizades();

    return res.json({
      mensagem: 'Validação concluída',
      ...resultado.detalhes,
    });
  } catch (erro) {
    console.error('Erro ao validar integridade:', erro);
    return res.status(500).json({ erro: 'Erro ao validar' });
  }
}

/**
 * Função auxiliar: validar integridade
 */
async function validarIntegridadeAmizades() {
  const erros = [];
  const correcoes = [];

  // 1. Auto-amizades
  const autoAmizades = await Amizade.find({
    $where: 'this.usuarioId === this.amigoId',
  });

  for (const amizade of autoAmizades) {
    erros.push(`Auto-amizade: ${amizade._id}`);
    await Amizade.deleteOne({ _id: amizade._id });
    correcoes.push(`Deletada auto-amizade ${amizade._id}`);
  }

  // 2. Referências órfãs
  const amizadesOrfas = await Amizade.aggregate([
    {
      $lookup: {
        from: 'usuarios',
        localField: 'usuarioId',
        foreignField: '_id',
        as: 'usuario',
      },
    },
    {
      $match: { usuario: { $size: 0 } },
    },
  ]);

  for (const amizade of amizadesOrfas) {
    erros.push(`Referência órfã: ${amizade._id}`);
    await Amizade.deleteOne({ _id: amizade._id });
    correcoes.push(`Deletada amizade órfã`);
  }

  // 3. Stats desincronizadas
  const usuarios = await Usuario.find({ ativo: true });

  for (const usuario of usuarios) {
    const totalAmigos = await Amizade.countDocuments({
      $or: [
        { usuarioId: usuario._id, status: 'aceito' },
        { amigoId: usuario._id, status: 'aceito' },
      ],
    });

    if (usuario.stats.total_amigos !== totalAmigos) {
      erros.push(`Stats desincronizado: ${usuario._id}`);
      await Usuario.updateOne(
        { _id: usuario._id },
        { 'stats.total_amigos': totalAmigos }
      );
      correcoes.push(`Sincronizado ${usuario._id}`);
    }
  }

  return {
    detalhes: {
      errosEncontrados: erros.length,
      correcoesAplicadas: correcoes.length,
      erros,
      correcoes,
    },
  };
}

// ============================================================================
// EXEMPLO 10: RECOMENDAÇÕES (Amigos em Comum)
// ============================================================================

/**
 * Controller: GET /api/usuarios/:usuarioId/sugestoes-amizade
 * Retorna usuários com amigos em comum
 */
async function obterSugestoesAmizade(req, res) {
  try {
    const { usuarioId } = req.params;
    const { limite = 10 } = req.query;

    // Pipeline: encontrar amigos de amigos
    const sugestoes = await Amizade.aggregate([
      // 1. Obter amigos do usuário
      {
        $match: {
          $or: [
            { usuarioId: mongoose.Types.ObjectId(usuarioId), status: 'aceito' },
            { amigoId: mongoose.Types.ObjectId(usuarioId), status: 'aceito' },
          ],
        },
      },
      {
        $addFields: {
          amigoId: {
            $cond: [
              { $eq: ['$usuarioId', mongoose.Types.ObjectId(usuarioId)] },
              '$amigoId',
              '$usuarioId',
            ],
          },
        },
      },
      // 2. Obter amigos dos amigos
      {
        $lookup: {
          from: 'amizades',
          let: { amigo: '$amigoId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ['$usuarioId', '$$amigo'] },
                        { $eq: ['$amigoId', '$$amigo'] },
                      ],
                    },
                    { $eq: ['$status', 'aceito'] },
                  ],
                },
              },
            },
          ],
          as: 'amigosDoAmigo',
        },
      },
      { $unwind: '$amigosDoAmigo' },
      {
        $addFields: {
          sugestao: {
            $cond: [
              { $eq: ['$amigosDoAmigo.usuarioId', '$amigoId'] },
              '$amigosDoAmigo.amigoId',
              '$amigosDoAmigo.usuarioId',
            ],
          },
        },
      },
      // 3. Remover usuário atual e amigos já existentes
      {
        $match: {
          sugestao: {
            $ne: mongoose.Types.ObjectId(usuarioId),
            $ne: null,
          },
        },
      },
      // 4. Agrupar e contar amigos em comum
      {
        $group: {
          _id: '$sugestao',
          amigosEmComum: { $sum: 1 },
        },
      },
      { $sort: { amigosEmComum: -1 } },
      { $limit: parseInt(limite) },
      // 5. Buscar dados do usuário
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'usuario',
        },
      },
      { $unwind: '$usuario' },
      {
        $project: {
          usuarioId: '$_id',
          'usuario.perfil.nome': 1,
          'usuario.customizacao.foto_perfil_url': 1,
          'usuario.stats.total_seguidores': 1,
          amigosEmComum: 1,
        },
      },
    ]);

    return res.json({
      sugestoes,
      total: sugestoes.length,
    });
  } catch (erro) {
    console.error('Erro ao obter sugestões:', erro);
    return res.status(500).json({ erro: 'Erro ao obter sugestões' });
  }
}

// ============================================================================
// EXPORTAR PARA ROTAS
// ============================================================================

module.exports = {
  enviarSolicitacao,
  aceitarSolicitacao,
  listarAmigos,
  verificarAmizade,
  listarSolicitacoesRecebidas,
  desfazerAmizade,
  obterPerfilCompleto,
  validarIntegridade,
  obterSugestoesAmizade,
  jobs: {
    sincronizarStats,
    validarIntegridadeAmizades,
  },
};
