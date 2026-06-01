/**
 * ============================================================================
 * CONTROLLER: PERFIL
 * ============================================================================
 * Controla todas as operações de perfil de usuário (visualização e edição).
 */

const mongoose = require('mongoose');
const {
  Usuario,
  Privacidade,
  Preferencias,
  Conexoes,
  Badges,
  Auditoria,
} = require('../models');

/**
 * GET /perfil/meu-perfil
 * Retorna o perfil completo do usuário autenticado
 */
exports.obterMeuPerfil = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.fail('Usuário não encontrado.', 404);
    }

    const [privacidade, preferencias, conexoes, badges] = await Promise.all([
      Privacidade.findOne({ usuario_id: usuarioId }),
      Preferencias.findOne({ usuario_id: usuarioId }),
      Conexoes.findOne({ usuario_id: usuarioId }),
      Badges.findOne({ usuario_id: usuarioId }),
    ]);

    return res.success(
      {
        usuario: {
          _id: usuario._id,
          perfil: usuario.perfil,
          customizacao: usuario.customizacao,
          stats: usuario.stats,
          ativo: usuario.ativo,
        },
        privacidade,
        preferencias,
        conexoes,
        badges,
      },
      'Perfil carregado com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

/**
 * GET /perfil/:id
 * Retorna o perfil público de um usuário (respeitando privacidade)
 */
exports.obterPerfilPublico = async (req, res, next) => {
  try {
    const usuarioId = req.params.id;
    const usuarioLogadoId = req.usuario?.id || null;

    if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
      return res.fail('ID de usuário inválido.', 400);
    }

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.fail('Usuário não encontrado.', 404);
    }

    // Verificar se o perfil é privado
    const privacidade = await Privacidade.findOne({ usuario_id: usuarioId });
    const ehProprioPerfil = usuarioLogadoId && String(usuarioId) === String(usuarioLogadoId);

    if (!ehProprioPerfil && !privacidade?.perfil_publico) {
      return res.success(
        {
          _id: usuario._id,
          perfil: {
            nome: usuario.perfil.nome,
            privacidade: usuario.perfil.privacidade,
          },
          acesso_restrito: true,
        },
        'Perfil privado. Siga o usuário para ver mais informações.'
      );
    }

    const [conexoes, badges] = await Promise.all([
      Conexoes.findOne({ usuario_id: usuarioId }),
      Badges.findOne({ usuario_id: usuarioId }),
    ]);

    // Montar resposta filtrando dados sensíveis
    const resposta = {
      _id: usuario._id,
      perfil: usuario.perfil,
      customizacao: usuario.customizacao,
      stats: usuario.stats,
      conexoes,
      badges,
    };

    // Se não é o próprio perfil, filtrar dados sensíveis
    if (!ehProprioPerfil) {
      if (!privacidade?.mostrar_email_publicamente) {
        delete resposta.perfil.email;
      }
      if (!privacidade?.mostrar_localizacao) {
        resposta.localizacao = null;
      }
      if (!privacidade?.mostrar_ultimo_login) {
        resposta.ultima_atividade = null;
      }
    }

    return res.success(resposta, 'Perfil carregado com sucesso.');
  } catch (erro) {
    return next(erro);
  }
};

/**
 * PUT /perfil/atualizar
 * Atualiza dados do perfil do usuário autenticado
 */
exports.atualizarPerfil = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const {
      nome,
      bio,
      status_vinculo,
      website,
      localizacao,
      ocupacao,
    } = req.body;

    // Validações
    if (nome && nome.length < 3) {
      return res.fail('Nome deve ter no mínimo 3 caracteres.', 400);
    }

    if (bio && bio.length > 500) {
      return res.fail('Bio não pode ter mais de 500 caracteres.', 400);
    }

    // Preparar dados de atualização
    const atualizacoes = {};
    if (nome) atualizacoes['perfil.nome'] = nome;
    if (bio !== undefined) atualizacoes['perfil.bio'] = bio;
    if (status_vinculo && ['estudante', 'egresso', 'servidor'].includes(status_vinculo)) {
      atualizacoes['perfil.status_vinculo'] = status_vinculo;
    }
    // Mapear corretamente os campos do perfil
    if (website !== undefined) {
      atualizacoes['perfil.website'] = website;
      atualizacoes['customizacao.banner_url'] = website;
    }

    if (localizacao !== undefined) atualizacoes['perfil.localizacao'] = localizacao;
    if (ocupacao !== undefined) atualizacoes['perfil.ocupacao'] = ocupacao;

    // Obter usuário antigo para auditoria
    const usuarioAntigo = await Usuario.findById(usuarioId);
    const camposAlterados = {};

    // Atualizar usuário
    const usuario = await Usuario.findByIdAndUpdate(
      usuarioId,
      { ...atualizacoes, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    // Registrar auditoria
    await Auditoria.create({
      usuario_id: usuarioId,
      acao: 'atualizacao-perfil',
      endereco_ip: req.ip,
      user_agent: req.get('User-Agent'),
      campos_alterados: Object.keys(atualizacoes),
      descricao: `Perfil atualizado: ${Object.keys(atualizacoes).join(', ')}`,
    });

    return res.success(
      {
        _id: usuario._id,
        perfil: usuario.perfil,
        customizacao: usuario.customizacao,
      },
      'Perfil atualizado com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

/**
 * PUT /perfil/atualizar-customizacao
 * Atualiza customização visual do perfil
 */
exports.atualizarCustomizacao = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const { cor_fundo, cor_botoes, tema } = req.body;

    const atualizacoes = {};

    // Validar cores HEX
    if (cor_fundo && !/^#[0-9A-Fa-f]{6}$/.test(cor_fundo)) {
      return res.fail('Cor de fundo deve ser em formato HEX válido (#RRGGBB).', 400);
    }

    if (cor_botoes && !/^#[0-9A-Fa-f]{6}$/.test(cor_botoes)) {
      return res.fail('Cor de botões deve ser em formato HEX válido (#RRGGBB).', 400);
    }

    if (cor_fundo) atualizacoes['customizacao.cor_fundo'] = cor_fundo;
    if (cor_botoes) atualizacoes['customizacao.cor_botoes'] = cor_botoes;
    if (tema && ['light', 'dark'].includes(tema)) {
      atualizacoes['customizacao.tema'] = tema;
    }

    const usuario = await Usuario.findByIdAndUpdate(
      usuarioId,
      { ...atualizacoes, updatedAt: new Date() },
      { new: true }
    );

    return res.success(
      usuario.customizacao,
      'Customização atualizada com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

/**
 * GET /perfil/:id/badges
 * Obtém badges do usuário
 */
exports.obterBadges = async (req, res, next) => {
  try {
    const usuarioId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
      return res.fail('ID de usuário inválido.', 400);
    }

    const badges = await Badges.findOne({ usuario_id: usuarioId });

    return res.success(
      badges || { badges: [], pontos: 0, nivel_usuario: 1 },
      'Badges carregados com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

/**
 * GET /perfil/:id/estatisticas
 * Obtém estatísticas do usuário
 */
exports.obterEstatisticas = async (req, res, next) => {
  try {
    const usuarioId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
      return res.fail('ID de usuário inválido.', 400);
    }

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.fail('Usuário não encontrado.', 404);
    }

    const badges = await Badges.findOne({ usuario_id: usuarioId });

    return res.success(
      {
        stats: usuario.stats,
        badges: badges?.nivel_usuario || 1,
        pontos: badges?.pontos || 0,
      },
      'Estatísticas carregadas com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

module.exports = exports;
