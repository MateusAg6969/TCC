/**
 * ============================================================================
 * CONTROLLER: PRIVACIDADE
 * ============================================================================
 * Controla configurações de privacidade do usuário.
 */

const { Privacidade, Auditoria } = require('../models');

/**
 * GET /privacidade/minha-privacidade
 * Obtém configurações de privacidade do usuário autenticado
 */
exports.obterMinhaPrivacidade = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;

    let privacidade = await Privacidade.findOne({ usuario_id: usuarioId });

    // Se não existe, criar documento padrão
    if (!privacidade) {
      privacidade = await Privacidade.create({ usuario_id: usuarioId });
    }

    return res.success(privacidade, 'Configurações de privacidade carregadas.');
  } catch (erro) {
    return next(erro);
  }
};

/**
 * PUT /privacidade/atualizar
 * Atualiza configurações de privacidade
 */
exports.atualizarPrivacidade = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const {
      perfil_publico,
      quem_pode_mensagear,
      quem_pode_comentar_posts,
      mostrar_email_publicamente,
      mostrar_localizacao,
      mostrar_data_nascimento,
      mostrar_ultimo_login,
      permitir_indexar_buscador,
    } = req.body;

    // Validar enums
    const enumsValidos = {
      quem_pode_mensagear: ['todos', 'amigos', 'ninguem'],
      quem_pode_comentar_posts: ['todos', 'amigos', 'ninguem'],
    };

    if (
      quem_pode_mensagear &&
      !enumsValidos.quem_pode_mensagear.includes(quem_pode_mensagear)
    ) {
      return res.fail(
        'Valor inválido para quem_pode_mensagear. Deve ser: todos, amigos ou ninguem.',
        400
      );
    }

    if (
      quem_pode_comentar_posts &&
      !enumsValidos.quem_pode_comentar_posts.includes(quem_pode_comentar_posts)
    ) {
      return res.fail(
        'Valor inválido para quem_pode_comentar_posts. Deve ser: todos, amigos ou ninguem.',
        400
      );
    }

    const atualizacoes = {};
    if (perfil_publico !== undefined) atualizacoes.perfil_publico = perfil_publico;
    if (quem_pode_mensagear !== undefined)
      atualizacoes.quem_pode_mensagear = quem_pode_mensagear;
    if (quem_pode_comentar_posts !== undefined)
      atualizacoes.quem_pode_comentar_posts = quem_pode_comentar_posts;
    if (mostrar_email_publicamente !== undefined)
      atualizacoes.mostrar_email_publicamente = mostrar_email_publicamente;
    if (mostrar_localizacao !== undefined)
      atualizacoes.mostrar_localizacao = mostrar_localizacao;
    if (mostrar_data_nascimento !== undefined)
      atualizacoes.mostrar_data_nascimento = mostrar_data_nascimento;
    if (mostrar_ultimo_login !== undefined)
      atualizacoes.mostrar_ultimo_login = mostrar_ultimo_login;
    if (permitir_indexar_buscador !== undefined)
      atualizacoes.permitir_indexar_buscador = permitir_indexar_buscador;

    let privacidade = await Privacidade.findOne({ usuario_id: usuarioId });

    // Se não existe, criar documento
    if (!privacidade) {
      privacidade = await Privacidade.create({
        usuario_id: usuarioId,
        ...atualizacoes,
      });
    } else {
      privacidade = await Privacidade.findOneAndUpdate(
        { usuario_id: usuarioId },
        { ...atualizacoes, updatedAt: new Date() },
        { new: true }
      );
    }

    // Registrar auditoria
    await Auditoria.create({
      usuario_id: usuarioId,
      acao: 'mudanca-privacidade',
      endereco_ip: req.ip,
      user_agent: req.get('User-Agent'),
      campos_alterados: Object.keys(atualizacoes),
      descricao: `Privacidade alterada: ${Object.keys(atualizacoes).join(', ')}`,
    });

    return res.success(
      privacidade,
      'Configurações de privacidade atualizadas com sucesso.'
    );
  } catch (erro) {
    return next(erro);
  }
};

/**
 * POST /privacidade/bloquear/:usuario_id
 * Bloqueia um usuário
 */
exports.bloquearUsuario = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const usuarioABloquearId = req.params.usuario_id;

    if (String(usuarioId) === String(usuarioABloquearId)) {
      return res.fail('Você não pode bloquear a si mesmo.', 400);
    }

    const privacidade = await Privacidade.findOneAndUpdate(
      { usuario_id: usuarioId },
      { $addToSet: { bloqueados: usuarioABloquearId } },
      { new: true, upsert: true }
    );

    // Registrar auditoria
    await Auditoria.create({
      usuario_id: usuarioId,
      acao: 'bloquear-usuario',
      endereco_ip: req.ip,
      user_agent: req.get('User-Agent'),
      descricao: `Usuário ${usuarioABloquearId} bloqueado`,
    });

    return res.success(null, 'Usuário bloqueado com sucesso.');
  } catch (erro) {
    return next(erro);
  }
};

/**
 * DELETE /privacidade/desbloquear/:usuario_id
 * Desbloqueia um usuário
 */
exports.desbloquearUsuario = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const usuarioADesbloqueareId = req.params.usuario_id;

    await Privacidade.findOneAndUpdate(
      { usuario_id: usuarioId },
      { $pull: { bloqueados: usuarioADesbloqueareId } }
    );

    // Registrar auditoria
    await Auditoria.create({
      usuario_id: usuarioId,
      acao: 'bloquear-usuario',
      endereco_ip: req.ip,
      user_agent: req.get('User-Agent'),
      descricao: `Usuário ${usuarioADesbloqueareId} desbloqueado`,
    });

    return res.success(null, 'Usuário desbloqueado com sucesso.');
  } catch (erro) {
    return next(erro);
  }
};

module.exports = exports;
