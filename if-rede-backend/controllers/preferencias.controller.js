/**
 * ============================================================================
 * CONTROLLER: PREFERÊNCIAS
 * ============================================================================
 * Controla preferências do usuário (tema, idioma, notificações).
 */

const { Preferencias } = require('../models');

/**
 * GET /preferencias/minhas-preferencias
 * Obtém preferências do usuário autenticado
 */
exports.obterMinhasPreferencias = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;

    let preferencias = await Preferencias.findOne({ usuario_id: usuarioId });

    // Se não existe, criar documento padrão
    if (!preferencias) {
      preferencias = await Preferencias.create({ usuario_id: usuarioId });
    }

    return res.success(preferencias, 'Preferências carregadas com sucesso.');
  } catch (erro) {
    return next(erro);
  }
};

/**
 * PUT /preferencias/atualizar
 * Atualiza preferências do usuário
 */
exports.atualizarPreferencias = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const {
      tema_preferido,
      idioma,
      tamanho_fonte,
      notificacoes_email,
      session_timeout,
      permitir_analytics,
    } = req.body;

    // Validações
    if (tema_preferido && !['claro', 'escuro', 'auto'].includes(tema_preferido)) {
      return res.fail(
        'Tema inválido. Deve ser: claro, escuro ou auto.',
        400
      );
    }

    if (tamanho_fonte && (tamanho_fonte < 0.8 || tamanho_fonte > 1.5)) {
      return res.fail('Tamanho de fonte deve estar entre 0.8 e 1.5.', 400);
    }

    const atualizacoes = {};
    if (tema_preferido) atualizacoes.tema_preferido = tema_preferido;
    if (idioma) atualizacoes.idioma = idioma;
    if (tamanho_fonte) atualizacoes.tamanho_fonte = tamanho_fonte;
    if (notificacoes_email) atualizacoes.notificacoes_email = notificacoes_email;
    if (session_timeout) atualizacoes.session_timeout = session_timeout;
    if (permitir_analytics !== undefined) atualizacoes.permitir_analytics = permitir_analytics;

    let preferencias = await Preferencias.findOne({ usuario_id: usuarioId });

    // Se não existe, criar documento
    if (!preferencias) {
      preferencias = await Preferencias.create({
        usuario_id: usuarioId,
        ...atualizacoes,
      });
    } else {
      preferencias = await Preferencias.findOneAndUpdate(
        { usuario_id: usuarioId },
        { ...atualizacoes, updatedAt: new Date() },
        { new: true }
      );
    }

    return res.success(
      preferencias,
      'Preferências atualizadas com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

module.exports = exports;
