const express = require('express');
const mongoose = require('mongoose');
const { Usuario, Seguidor } = require('../models');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

async function contarRelacionamentos(usuarioId) {
  const [seguidores, seguindo] = await Promise.all([
    Seguidor.countDocuments({ seguido_id: usuarioId }),
    Seguidor.countDocuments({ seguidor_id: usuarioId }),
  ]);

  return { seguidores, seguindo };
}

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.fail('Usuário não encontrado.', 404);
    }

    const rel = await contarRelacionamentos(usuario._id);

    return res.success(
      {
        id: usuario._id,
        perfil: usuario.perfil,
        customizacao: usuario.customizacao,
        configuracoes: usuario.configuracoes,
        stats: {
          ...usuario.stats.toObject?.(),
          total_seguidores: rel.seguidores,
          total_seguindo: rel.seguindo,
        },
      },
      'Perfil carregado com sucesso.'
    );
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', optionalAuthMiddleware, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.fail('ID de usuário inválido.', 400);
    }

    const alvo = await Usuario.findById(req.params.id);

    if (!alvo) {
      return res.fail('Usuário não encontrado.', 404);
    }

    const usuarioLogadoId = req.usuario?.id || null;
    const ehProprioPerfil = usuarioLogadoId && String(alvo._id) === String(usuarioLogadoId);

    const segue = usuarioLogadoId
      ? await Seguidor.exists({
          seguidor_id: usuarioLogadoId,
          seguido_id: alvo._id,
        })
      : null;

    if (!ehProprioPerfil && alvo.perfil.privacidade === 'privado' && !segue) {
      return res.success(
        {
          id: alvo._id,
          perfil: {
            nome: alvo.perfil.nome,
            privacidade: alvo.perfil.privacidade,
          },
          acesso_restrito: true,
        },
        'Perfil privado. Siga o usuário para ver mais informações.'
      );
    }

    const rel = await contarRelacionamentos(alvo._id);

    return res.success(
      {
        id: alvo._id,
        perfil: alvo.perfil,
        customizacao: alvo.customizacao,
        stats: {
          ...alvo.stats.toObject?.(),
          total_seguidores: rel.seguidores,
          total_seguindo: rel.seguindo,
        },
        seguindo: Boolean(segue),
      },
      'Perfil carregado com sucesso.'
    );
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/seguir', authMiddleware, async (req, res, next) => {
  try {
    const seguidoId = req.params.id;
    const seguidorId = req.usuario.id;

    if (!mongoose.Types.ObjectId.isValid(seguidoId)) {
      return res.fail('ID de usuário inválido.', 400);
    }

    if (String(seguidoId) === String(seguidorId)) {
      return res.fail('Você não pode seguir a si mesmo.', 400);
    }

    const usuarioAlvo = await Usuario.findById(seguidoId);
    if (!usuarioAlvo) {
      return res.fail('Usuário não encontrado.', 404);
    }

    await Seguidor.updateOne(
      { seguidor_id: seguidorId, seguido_id: seguidoId },
      { $setOnInsert: { seguidor_id: seguidorId, seguido_id: seguidoId } },
      { upsert: true }
    );

    return res.success(null, 'Usuário seguido com sucesso.');
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id/seguir', authMiddleware, async (req, res, next) => {
  try {
    const seguidoId = req.params.id;
    const seguidorId = req.usuario.id;

    if (!mongoose.Types.ObjectId.isValid(seguidoId)) {
      return res.fail('ID de usuário inválido.', 400);
    }

    await Seguidor.deleteOne({ seguidor_id: seguidorId, seguido_id: seguidoId });

    return res.success(null, 'Você deixou de seguir o usuário.');
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/seguidores', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const seguidores = await Seguidor.find({ seguido_id: req.params.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('seguidor_id', 'perfil.nome perfil.email customizacao.banner_url');

    return res.success(
      seguidores.map((s) => s.seguidor_id),
      'Seguidores carregados com sucesso.',
      { total: seguidores.length }
    );
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/seguindo', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const seguindo = await Seguidor.find({ seguidor_id: req.params.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('seguido_id', 'perfil.nome perfil.email customizacao.banner_url');

    return res.success(
      seguindo.map((s) => s.seguido_id),
      'Lista de usuários seguidos carregada com sucesso.',
      { total: seguindo.length }
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
