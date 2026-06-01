/**
 * ============================================================================
 * CONTROLLER: CONEXÕES
 * ============================================================================
 * Controla relações de amizade entre usuários.
 */

const mongoose = require('mongoose');
const { Conexoes, Auditoria } = require('../models');

/**
 * POST /conexoes/:usuario_id/solicitar-amizade
 * Envia solicitação de amizade
 */
exports.solicitarAmizade = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const usuarioAlvoId = req.params.usuario_id;

    if (!mongoose.Types.ObjectId.isValid(usuarioAlvoId)) {
      return res.fail('ID de usuário inválido.', 400);
    }

    if (String(usuarioId) === String(usuarioAlvoId)) {
      return res.fail('Você não pode enviar solicitação a si mesmo.', 400);
    }

    // Atualizar conexão do usuário (adicionar aos enviados)
    await Conexoes.findOneAndUpdate(
      { usuario_id: usuarioId },
      { $addToSet: { solicitacoes_enviadas: usuarioAlvoId } },
      { upsert: true }
    );

    // Atualizar conexão do alvo (adicionar aos recebidos)
    await Conexoes.findOneAndUpdate(
      { usuario_id: usuarioAlvoId },
      { $addToSet: { solicitacoes_recebidas: usuarioId } },
      { upsert: true }
    );

    // Auditoria
    await Auditoria.create({
      usuario_id: usuarioId,
      acao: 'seguir-usuario',
      descricao: `Solicitação de amizade enviada para ${usuarioAlvoId}`,
      endereco_ip: req.ip,
    });

    return res.success(null, 'Solicitação de amizade enviada com sucesso.');
  } catch (erro) {
    return next(erro);
  }
};

/**
 * POST /conexoes/:usuario_id/aceitar-amizade
 * Aceita solicitação de amizade
 */
exports.aceitarAmizade = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const usuarioSolicitanteId = req.params.usuario_id;

    if (!mongoose.Types.ObjectId.isValid(usuarioSolicitanteId)) {
      return res.fail('ID de usuário inválido.', 400);
    }

    // Atualizar minha conexão
    await Conexoes.findOneAndUpdate(
      { usuario_id: usuarioId },
      {
        $addToSet: { amigos: usuarioSolicitanteId },
        $pull: { solicitacoes_recebidas: usuarioSolicitanteId },
        $inc: { total_amigos: 1 },
      },
      { upsert: true }
    );

    // Atualizar conexão do outro usuário
    const conexaoAlvo = await Conexoes.findOneAndUpdate(
      { usuario_id: usuarioSolicitanteId },
      {
        $addToSet: { amigos: usuarioId },
        $pull: { solicitacoes_enviadas: usuarioId },
        $inc: { total_amigos: 1 },
      },
      { new: true, upsert: true }
    );

    // Auditoria
    await Auditoria.create({
      usuario_id: usuarioId,
      acao: 'seguir-usuario',
      descricao: `Amizade aceita com ${usuarioSolicitanteId}`,
      endereco_ip: req.ip,
    });

    return res.success(conexaoAlvo, 'Amizade aceita com sucesso.');
  } catch (erro) {
    return next(erro);
  }
};

/**
 * DELETE /conexoes/:usuario_id/recusar-amizade
 * Recusa solicitação de amizade
 */
exports.recusarAmizade = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const usuarioSolicitanteId = req.params.usuario_id;

    // Remover das solicitações recebidas
    await Conexoes.findOneAndUpdate(
      { usuario_id: usuarioId },
      { $pull: { solicitacoes_recebidas: usuarioSolicitanteId } }
    );

    // Remover das solicitações enviadas
    await Conexoes.findOneAndUpdate(
      { usuario_id: usuarioSolicitanteId },
      { $pull: { solicitacoes_enviadas: usuarioId } }
    );

    return res.success(null, 'Solicitação recusada com sucesso.');
  } catch (erro) {
    return next(erro);
  }
};

/**
 * DELETE /conexoes/:usuario_id/remover-amizade
 * Remove uma amizade
 */
exports.removerAmizade = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const amigoId = req.params.usuario_id;

    if (!mongoose.Types.ObjectId.isValid(amigoId)) {
      return res.fail('ID de usuário inválido.', 400);
    }

    // Remover dos amigos (minha conexão)
    await Conexoes.findOneAndUpdate(
      { usuario_id: usuarioId },
      { $pull: { amigos: amigoId }, $inc: { total_amigos: -1 } }
    );

    // Remover dos amigos (conexão do amigo)
    await Conexoes.findOneAndUpdate(
      { usuario_id: amigoId },
      { $pull: { amigos: usuarioId }, $inc: { total_amigos: -1 } }
    );

    // Auditoria
    await Auditoria.create({
      usuario_id: usuarioId,
      acao: 'seguir-usuario',
      descricao: `Amizade removida com ${amigoId}`,
      endereco_ip: req.ip,
    });

    return res.success(null, 'Amizade removida com sucesso.');
  } catch (erro) {
    return next(erro);
  }
};

/**
 * GET /conexoes/minhas-conexoes
 * Obtém lista de amigos
 */
exports.minhasConexoes = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const { limit = 20, page = 1 } = req.query;

    const conexoes = await Conexoes.findOne({ usuario_id: usuarioId })
      .populate({
        path: 'amigos',
        select: 'perfil.nome customizacao.banner_url',
        options: {
          limit: Math.min(limit, 100),
          skip: (page - 1) * limit,
        },
      });

    return res.success(
      {
        amigos: conexoes?.amigos || [],
        total: conexoes?.total_amigos || 0,
        pagina: page,
      },
      'Amigos carregados com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

/**
 * GET /conexoes/:usuario_id/amigos
 * Obtém lista de amigos de outro usuário
 */
exports.obterAmigos = async (req, res, next) => {
  try {
    const usuarioId = req.params.usuario_id;
    const { limit = 20, page = 1 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
      return res.fail('ID de usuário inválido.', 400);
    }

    const conexoes = await Conexoes.findOne({ usuario_id: usuarioId })
      .populate({
        path: 'amigos',
        select: 'perfil.nome customizacao.banner_url',
        options: {
          limit: Math.min(limit, 100),
          skip: (page - 1) * limit,
        },
      });

    return res.success(
      {
        amigos: conexoes?.amigos || [],
        total: conexoes?.total_amigos || 0,
        pagina: page,
      },
      'Amigos carregados com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

/**
 * GET /conexoes/minhas-solicitacoes
 * Obtém solicitações de amizade pendentes
 */
exports.minhasSolicitacoes = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;

    const conexoes = await Conexoes.findOne({ usuario_id: usuarioId }).populate(
      'solicitacoes_recebidas',
      'perfil.nome customizacao.banner_url'
    );

    return res.success(
      {
        solicitacoes: conexoes?.solicitacoes_recebidas || [],
        total: conexoes?.solicitacoes_recebidas?.length || 0,
      },
      'Solicitações carregadas com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

module.exports = exports;
