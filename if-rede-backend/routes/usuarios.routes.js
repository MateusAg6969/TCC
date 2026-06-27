const express = require('express');
const mongoose = require('mongoose');
const { Usuario, Seguidor, UsuarioMedalha, PortfolioItem } = require('../models');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth.middleware');
const { notificarNovoSeguidor } = require('../services/notificacoes.service');
const { uploadPerfilArquivo } = require('../middleware/upload-perfil.middleware');

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
    
    // Buscar medalhas conquistadas
    const medalhas = await UsuarioMedalha.find({ usuario_id: usuario._id })
      .populate('medalha_id')
      .sort({ awarded_at: -1 });

    // Buscar itens do portfólio
    const portfolio = await PortfolioItem.find({ usuario_id: usuario._id })
      .populate('postagem_id')
      .sort({ posicao: 1 });

    return res.success(
      {
        id: usuario._id,
        perfil: usuario.perfil,
        customizacao: {
          ...usuario.customizacao.toObject?.(),
          medalhas: medalhas.map(m => ({
            ...m.medalha_id.toObject(),
            awarded_at: m.awarded_at
          })),
          portfolio: portfolio
            .filter(p => p.postagem_id)
            .map(p => ({
              ...p.postagem_id.toObject(),
              posicao: p.posicao,
              fixado_em: p.fixado_em
            }))
        },
        configuracoes: usuario.configuracoes,
        stats: {
          ...usuario.stats.toObject?.(),
          total_seguidores: rel.seguidores,
          total_seguindo: rel.seguindo,
        },
        postagens_salvas: usuario.postagens_salvas || [],
      },
      'Perfil carregado com sucesso.'
    );
  } catch (error) {
    return next(error);
  }
});

router.patch('/me', authMiddleware, async (req, res, next) => {
  try {
    const { perfil, customizacao } = req.body;
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.fail('Usuário não encontrado.', 404);
    }

    // Atualiza campos do perfil se fornecidos
    if (perfil) {
      if (perfil.nome) usuario.perfil.nome = perfil.nome;
      if (perfil.apelido !== undefined) usuario.perfil.apelido = perfil.apelido;
      if (perfil.bio !== undefined) usuario.perfil.bio = perfil.bio;
      if (perfil.privacidade) usuario.perfil.privacidade = perfil.privacidade;
    }

    // Atualiza campos de customização se fornecidos
    if (customizacao) {
      if (customizacao.cor_fundo) usuario.customizacao.cor_fundo = customizacao.cor_fundo;
      if (customizacao.cor_botoes) usuario.customizacao.cor_botoes = customizacao.cor_botoes;
      if (customizacao.avatar_url !== undefined) usuario.customizacao.avatar_url = customizacao.avatar_url;
      if (customizacao.banner_url !== undefined) usuario.customizacao.banner_url = customizacao.banner_url;
      if (customizacao.avatar_position !== undefined) usuario.customizacao.avatar_position = customizacao.avatar_position;
      if (customizacao.banner_position !== undefined) usuario.customizacao.banner_position = customizacao.banner_position;
    }

    await usuario.save();

    return res.success(
      {
        id: usuario._id,
        perfil: usuario.perfil,
        customizacao: usuario.customizacao,
      },
      'Perfil atualizado com sucesso.'
    );
  } catch (error) {
    return next(error);
  }
});

router.post('/me/midia', authMiddleware, uploadPerfilArquivo.fields([{ name: 'avatar', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.fail('Usuário não encontrado.', 404);
    }

    const { files } = req;
    let atualizado = false;
    const { uploadBuffer } = require('../services/cloudinary.service');

    if (files && files.avatar && files.avatar[0]) {
      const result = await uploadBuffer(files.avatar[0].buffer, files.avatar[0].mimetype);
      usuario.customizacao.avatar_url = result.secure_url;
      atualizado = true;
    }

    if (files && files.banner && files.banner[0]) {
      const result = await uploadBuffer(files.banner[0].buffer, files.banner[0].mimetype);
      usuario.customizacao.banner_url = result.secure_url;
      atualizado = true;
    }

    if (atualizado) {
      await usuario.save();
    }

    return res.success(
      {
        id: usuario._id,
        perfil: usuario.perfil,
        customizacao: usuario.customizacao,
      },
      'Mídia atualizada com sucesso.'
    );
  } catch (error) {
    return next(error);
  }
});

router.post('/me/salvas/:id', authMiddleware, async (req, res, next) => {
  try {
    const postId = req.params.id;
    const usuarioId = req.usuario.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.fail('ID de postagem inválido.', 400);
    }

    const post = await require('../models').Postagem.findById(postId);
    if (!post) {
      return res.fail('Postagem não encontrada.', 404);
    }

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.fail('Usuário não encontrado.', 404);
    }

    if (!usuario.postagens_salvas) {
      usuario.postagens_salvas = [];
    }

    const jaSalva = usuario.postagens_salvas.includes(postId);
    let salvo = false;

    if (jaSalva) {
      usuario.postagens_salvas.pull(postId);
    } else {
      usuario.postagens_salvas.push(postId);
      salvo = true;
    }

    await usuario.save();

    return res.success(
      { salvo },
      salvo ? 'Postagem salva com sucesso.' : 'Postagem removida dos salvos.'
    );
  } catch (error) {
    return next(error);
  }
});

router.get('/me/salvas', authMiddleware, async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
    const skip = (page - 1) * limit;

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.fail('Usuário não encontrado.', 404);
    }

    const total = usuario.postagens_salvas ? usuario.postagens_salvas.length : 0;

    const postagens = await require('../models').Postagem.find({
      _id: { $in: usuario.postagens_salvas || [] }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('autor_id', 'perfil.nome perfil.apelido customizacao.avatar_url');

    return res.success(
      postagens,
      'Postagens salvas carregadas com sucesso.',
      {
        total,
        pagina: page,
        limite: limit,
        paginas: Math.ceil(total / limit)
      }
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

    // Buscar medalhas conquistadas
    const medalhas = await UsuarioMedalha.find({ usuario_id: alvo._id })
      .populate('medalha_id')
      .sort({ awarded_at: -1 });

    // Buscar itens do portfólio
    const portfolio = await PortfolioItem.find({ usuario_id: alvo._id })
      .populate('postagem_id')
      .sort({ posicao: 1 });

    return res.success(
      {
        id: alvo._id,
        perfil: alvo.perfil,
        customizacao: {
          ...alvo.customizacao.toObject?.(),
          medalhas: medalhas.map(m => ({
            ...m.medalha_id.toObject(),
            awarded_at: m.awarded_at
          })),
          portfolio: portfolio
            .filter(p => p.postagem_id)
            .map(p => ({
              ...p.postagem_id.toObject(),
              posicao: p.posicao,
              fixado_em: p.fixado_em
            }))
        },
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

    const resultado = await Seguidor.updateOne(
      { seguidor_id: seguidorId, seguido_id: seguidoId },
      { $setOnInsert: { seguidor_id: seguidorId, seguido_id: seguidoId } },
      { upsert: true }
    );

    // Se houve um novo registro (upserted), disparar notificação
    if (resultado.upsertedCount > 0) {
      await notificarNovoSeguidor(seguidoId, seguidorId);
    }

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
