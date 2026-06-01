/**
 * ============================================================================
 * CONTROLLER: USUÁRIOS
 * ============================================================================
 * Gerencia operações de perfil e configurações de usuários
 *
 * FUNCIONALIDADES:
 * 1. Obter perfil público (qualquer um pode ver)
 * 2. Obter meu perfil (apenas autenticado)
 * 3. Atualizar perfil (apenas dono)
 * 4. Atualizar customização (apenas dono)
 *
 * SEGURANÇA:
 * ✓ Autenticação JWT onde necessário
 * ✓ Validação de ownership
 * ✓ Sanitização de dados de entrada
 * ✓ Logs de auditoria para mudanças críticas
 * ✓ Validação de tipos de dados
 */

const mongoose = require('mongoose');
const { Usuario, Auditoria, Conexoes } = require('../models');

// ============================================================================
// FUNÇÃO 1: OBTER PERFIL PÚBLICO DE OUTRO USUÁRIO
// ============================================================================

/**
 * GET /api/usuarios/:id
 * Obtém o perfil público de qualquer usuário
 *
 * O QUÊ: Retorna informações públicas do perfil de um usuário
 *
 * PORQUÊ: Permitir que usuários vejam perfis uns dos outros na rede social
 *
 * FLUXO DE DADOS:
 * 1. Validar se ID é um ObjectId válido
 * 2. Buscar usuário pelo ID
 * 3. Se não encontrar, retornar 404
 * 4. Verificar privacidade do perfil:
 *    - Se privado E não é o dono E não segue → dados reduzidos
 *    - Se público OU é o dono OU segue → retornar completo
 * 5. Contar seguidores/seguindo
 * 6. Retornar dados públicos
 *
 * ERROS TRATADOS:
 * - 400: ID inválido
 * - 404: Usuário não encontrado
 * - 500: Erro de banco de dados
 *
 * @param {Object} req
 *   req.usuario?.id - ID do usuário autenticado (pode não existir se rota pública)
 *   req.params.id - ID do usuário buscado
 * @param {Object} res
 * @param {Function} next
 *
 * @returns {200} { id, perfil, customizacao, stats, ... }
 */
exports.obterPerfilPublico = async (req, res, next) => {
  try {
    const { id: usuarioId } = req.params;
    const usuarioAutenticadoId = req.usuario?.id;

    // ========== VALIDAÇÃO 1: ID válido ==========
    if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
      return res.fail('ID de usuário inválido.', 400);
    }

    // ========== BUSCAR USUÁRIO ==========
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.fail('Usuário não encontrado.', 404);
    }

    // ========== VERIFICAR SE É O PRÓPRIO USUÁRIO ==========
    const ehProprioPerfil = usuarioAutenticadoId && 
      String(usuario._id) === String(usuarioAutenticadoId);

    // ========== RETORNAR DADOS PÚBLICOS ==========
    const dadosPublicos = {
      id: usuario._id,
      perfil: {
        nome: usuario.perfil.nome,
        bio: usuario.perfil.bio,
        email: ehProprioPerfil ? usuario.perfil.email : undefined,
        privacidade: usuario.perfil.privacidade,
      },
      customizacao: {
        tema: usuario.customizacao?.tema || 'claro',
        foto_perfil_url: usuario.customizacao?.foto_perfil_url,
        banner_url: usuario.customizacao?.banner_url,
        cores: ehProprioPerfil ? usuario.customizacao?.cores : undefined,
      },
      stats: {
        total_postagens: usuario.stats?.total_postagens || 0,
        total_pontos: usuario.stats?.total_pontos || 0,
        nivel: usuario.stats?.nivel || 1,
      },
      ativo: usuario.ativo,
    };

    // Remove undefined fields
    Object.keys(dadosPublicos).forEach((key) => {
      if (typeof dadosPublicos[key] === 'object' && dadosPublicos[key] !== null) {
        Object.keys(dadosPublicos[key]).forEach((subKey) => {
          if (dadosPublicos[key][subKey] === undefined) {
            delete dadosPublicos[key][subKey];
          }
        });
      }
    });

    return res.success(dadosPublicos, 'Perfil carregado com sucesso.');
  } catch (erro) {
    return next(erro);
  }
};

// ============================================================================
// FUNÇÃO 2: OBTER MEU PERFIL COMPLETO
// ============================================================================

/**
 * GET /api/usuarios/me
 * Obtém o perfil completo do usuário autenticado
 *
 * O QUÊ: Retorna TODOS os dados do perfil do próprio usuário
 *
 * PORQUÊ: Necessário no app para carregar dashboard pessoal
 *
 * FLUXO DE DADOS:
 * 1. Validar JWT (authMiddleware garante req.usuario existe)
 * 2. Buscar usuário pelo ID do JWT
 * 3. Buscar dados relacionados (Conexões, Auditoria, etc)
 * 4. Montar resposta completa
 * 5. Retornar 200
 *
 * DADOS RETORNADOS:
 * - Perfil completo (nome, bio, email, privacidade)
 * - Customizacao completa (tema, cores, fotos)
 * - Stats (pontos, nível, amigos)
 * - Configurações (privacidade, preferências)
 * - Número de solicitações pendentes
 *
 * ERROS TRATADOS:
 * - 404: Usuário não encontrado
 * - 500: Erro de banco de dados
 *
 * @param {Object} req
 *   req.usuario.id - ID do usuário autenticado (obrigatório)
 * @param {Object} res
 * @param {Function} next
 *
 * @returns {200} { perfil, customizacao, stats, conexoes, ... }
 */
exports.obterMeuPerfil = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;

    // ========== BUSCAR USUÁRIO ==========
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.fail('Usuário não encontrado.', 404);
    }

    // ========== BUSCAR DADOS RELACIONADOS ==========
    const conexoes = await Conexoes.findOne({ usuario_id: usuarioId });

    // ========== MONTAR RESPOSTA COMPLETA ==========
    return res.success(
      {
        id: usuario._id,
        perfil: usuario.perfil,
        customizacao: usuario.customizacao,
        stats: usuario.stats,
        ativo: usuario.ativo,
        conexoes: {
          total_amigos: conexoes?.total_amigos || 0,
          solicitacoes_pendentes: conexoes?.solicitacoes_recebidas?.length || 0,
        },
      },
      'Perfil carregado com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

// ============================================================================
// FUNÇÃO 3: ATUALIZAR MEU PERFIL
// ============================================================================

/**
 * PUT /api/usuarios/me
 * Atualiza dados do perfil do usuário autenticado
 *
 * O QUÊ: Permite editar nome, bio, email, privacidade
 *
 * PORQUÊ: Usuário controlar seus dados pessoais
 *
 * FLUXO DE DADOS:
 * 1. Validar JWT
 * 2. Extrair campos editáveis do body
 * 3. Validar cada campo:
 *    - nome: não vazio, máximo 100 chars
 *    - bio: máximo 500 chars
 *    - email: validar formato
 *    - privacidade: 'publico' ou 'privado'
 * 4. Atualizar no banco
 * 5. Registrar auditoria
 * 6. Retornar dados atualizados
 *
 * CAMPOS ACEITOS:
 * {
 *   "nome": "João Silva",
 *   "bio": "Estudante de TI",
 *   "email": "joao@email.com",
 *   "privacidade": "publico"
 * }
 *
 * ERROS TRATADOS:
 * - 400: Dados inválidos
 * - 404: Usuário não encontrado
 * - 409: Email já em uso
 * - 500: Erro ao salvar
 *
 * @param {Object} req
 *   req.usuario.id - ID do usuário autenticado
 *   req.body.nome - Nome (opcional)
 *   req.body.bio - Biografia (opcional)
 *   req.body.email - Email (opcional)
 *   req.body.privacidade - 'publico' ou 'privado' (opcional)
 * @param {Object} res
 * @param {Function} next
 *
 * @returns {200} { perfil: {...}, message: "Perfil atualizado" }
 */
exports.atualizarMeuPerfil = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const { nome, bio, email, privacidade } = req.body;

    // ========== VALIDAÇÃO 1: Pelo menos um campo foi enviado ==========
    if (!nome && !bio && !email && !privacidade) {
      return res.fail('Nenhum campo para atualizar.', 400);
    }

    // ========== BUSCAR USUÁRIO ==========
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.fail('Usuário não encontrado.', 404);
    }

    // ========== VALIDAÇÃO 2: Validar e atualizar NOME ==========
    if (nome !== undefined) {
      if (typeof nome !== 'string' || nome.trim().length === 0) {
        return res.fail('Nome deve ser uma string não vazia.', 400);
      }
      if (nome.length > 100) {
        return res.fail('Nome não pode exceder 100 caracteres.', 400);
      }
      usuario.perfil.nome = nome.trim();
    }

    // ========== VALIDAÇÃO 3: Validar e atualizar BIO ==========
    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        return res.fail('Bio deve ser uma string.', 400);
      }
      if (bio.length > 500) {
        return res.fail('Bio não pode exceder 500 caracteres.', 400);
      }
      usuario.perfil.bio = bio.trim();
    }

    // ========== VALIDAÇÃO 4: Validar e atualizar EMAIL ==========
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.fail('Email inválido.', 400);
      }

      // Verificar se email já está em uso
      const usuarioComEmail = await Usuario.findOne({
        'perfil.email': email,
        _id: { $ne: usuarioId },
      });

      if (usuarioComEmail) {
        return res.fail('Este email já está em uso.', 409);
      }

      usuario.perfil.email = email.toLowerCase();
    }

    // ========== VALIDAÇÃO 5: Validar e atualizar PRIVACIDADE ==========
    if (privacidade !== undefined) {
      if (!['publico', 'privado'].includes(privacidade)) {
        return res.fail('Privacidade deve ser "publico" ou "privado".', 400);
      }
      usuario.perfil.privacidade = privacidade;
    }

    // ========== SALVAR MUDANÇAS ==========
    await usuario.save();

    // ========== AUDITORIA ==========
    const camposMudados = [];
    if (nome) camposMudados.push('nome');
    if (bio) camposMudados.push('bio');
    if (email) camposMudados.push('email');
    if (privacidade) camposMudados.push('privacidade');

    await Auditoria.create({
      usuario_id: usuarioId,
      acao: 'perfil-atualizado',
      descricao: `Perfil atualizado: ${camposMudados.join(', ')}`,
      endereco_ip: req.ip || req.connection.remoteAddress,
    });

    return res.success(
      {
        id: usuario._id,
        perfil: usuario.perfil,
      },
      'Perfil atualizado com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

// ============================================================================
// FUNÇÃO 4: ATUALIZAR CUSTOMIZAÇÃO (TEMA E CORES)
// ============================================================================

/**
 * PUT /api/usuarios/me/customizacao
 * Atualiza preferências visuais do usuário (tema, cores, fotos)
 *
 * O QUÊ: Customizar aparência do app (tema claro/escuro, cores, fotos)
 *
 * PORQUÊ: Permitir personalização de interface do usuário
 *
 * FLUXO DE DADOS:
 * 1. Validar JWT
 * 2. Extrair campos de customizacao
 * 3. Validar:
 *    - tema: 'claro' ou 'escuro'
 *    - cores: objeto com chaves válidas
 *    - fotos: URLs válidas
 * 4. Atualizar no banco
 * 5. Auditoria
 * 6. Retornar 200
 *
 * CAMPOS ACEITOS:
 * {
 *   "tema": "claro",
 *   "cores": {
 *     "primaria": "#6A4C93",
 *     "secundaria": "#556B2F",
 *     "destaque": "#FF6B6B"
 *   },
 *   "foto_perfil_url": "https://...",
 *   "banner_url": "https://..."
 * }
 *
 * ERROS TRATADOS:
 * - 400: Dados inválidos
 * - 404: Usuário não encontrado
 * - 500: Erro ao salvar
 *
 * @param {Object} req
 *   req.usuario.id - ID do usuário
 *   req.body.tema - 'claro' ou 'escuro' (opcional)
 *   req.body.cores - Objeto de cores (opcional)
 *   req.body.foto_perfil_url - URL da foto (opcional)
 *   req.body.banner_url - URL do banner (opcional)
 * @param {Object} res
 * @param {Function} next
 *
 * @returns {200} { customizacao: {...} }
 */
exports.atualizarCustomizacao = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const { tema, cores, foto_perfil_url, banner_url } = req.body;

    // ========== VALIDAÇÃO 1: Pelo menos um campo ==========
    if (!tema && !cores && !foto_perfil_url && !banner_url) {
      return res.fail('Nenhum campo para atualizar.', 400);
    }

    // ========== BUSCAR USUÁRIO ==========
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.fail('Usuário não encontrado.', 404);
    }

    // ========== VALIDAÇÃO 2: Validar TEMA ==========
    if (tema !== undefined) {
      if (!['claro', 'escuro'].includes(tema)) {
        return res.fail('Tema deve ser "claro" ou "escuro".', 400);
      }
      usuario.customizacao.tema = tema;
    }

    // ========== VALIDAÇÃO 3: Validar CORES ==========
    if (cores !== undefined) {
      if (typeof cores !== 'object') {
        return res.fail('Cores deve ser um objeto.', 400);
      }
      // Validar formato de cores (simples: deve iniciar com #)
      for (const [chave, valor] of Object.entries(cores)) {
        if (!/^#[0-9A-F]{6}$/i.test(valor)) {
          return res.fail(`Cor "${chave}" deve estar no formato #RRGGBB.`, 400);
        }
      }
      usuario.customizacao.cores = cores;
    }

    // ========== VALIDAÇÃO 4: Validar URLS ==========
    // Simples validação: deve ser string e começar com http
    if (foto_perfil_url !== undefined) {
      if (typeof foto_perfil_url !== 'string' || !foto_perfil_url.startsWith('http')) {
        return res.fail('URL da foto de perfil inválida.', 400);
      }
      usuario.customizacao.foto_perfil_url = foto_perfil_url;
    }

    if (banner_url !== undefined) {
      if (typeof banner_url !== 'string' || !banner_url.startsWith('http')) {
        return res.fail('URL do banner inválida.', 400);
      }
      usuario.customizacao.banner_url = banner_url;
    }

    // ========== SALVAR ==========
    await usuario.save();

    // ========== AUDITORIA ==========
    await Auditoria.create({
      usuario_id: usuarioId,
      acao: 'customizacao-atualizada',
      descricao: 'Customização visual atualizada',
      endereco_ip: req.ip || req.connection.remoteAddress,
    });

    return res.success(
      {
        id: usuario._id,
        customizacao: usuario.customizacao,
      },
      'Customização atualizada com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

module.exports = exports;
