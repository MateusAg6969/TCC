const express = require('express');
const mongoose = require('mongoose');
const { Postagem, Usuario, Seguidor, TagSubtipo } = require('../models');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth.middleware');
const { detectarPalavraEmPartes } = require('../services/palavras-filtro.service');
const { uploadPostArquivo, LIMITES_POR_TIPO } = require('../middleware/upload-post.middleware');
const { notificarLike } = require('../services/notificacoes.service');
const postagensController = require('../controllers/postagens.controller');

const router = express.Router();

function parsePageParams(req) {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

router.post('/', authMiddleware, uploadPostArquivo.single('arquivo'), async (req, res, next) => {
  try {
    const {
      titulo,
      descricao = '',
      tipo,
      subtipo = '',
      subtipo_tag_id = null,
      tags,
      categorias,
      config,
    } = req.body;

    const arquivo = req.file;

    // O que faz: valida campos obrigatorios para fluxo de upload.
    // Por que: agora toda postagem depende de arquivo real, nao apenas URL manual.
    // Fluxo de dados: multipart/form-data -> multer(req.file + req.body) -> validacao.
    if (!titulo || !tipo || !arquivo) {
      return res.fail('Campos obrigatorios: titulo, tipo e arquivo.', 400);
    }

    const limiteTipo = LIMITES_POR_TIPO[tipo];
    if (!limiteTipo) {
      return res.fail('Tipo de postagem invalido.', 400);
    }

    if (arquivo.size > limiteTipo) {
      return res.fail(
        `Arquivo excede o limite para ${tipo}. Limite: ${Math.round(limiteTipo / (1024 * 1024))}MB.`,
        413
      );
    }

    // Resolve tag oficial de subtipo, quando enviada.
    // Entrada: subtipo_tag_id vindo do formulario.
    // Saida: referencia persistida e subtipo textual sincronizado.
    let subtipoTag = null;
    if (subtipo_tag_id && mongoose.Types.ObjectId.isValid(subtipo_tag_id)) {
      subtipoTag = await TagSubtipo.findById(subtipo_tag_id).lean();
      if (!subtipoTag || !subtipoTag.ativo || subtipoTag.tipo !== tipo) {
        return res.fail('Tag de subtipo invalida para o tipo informado.', 400);
      }
    }

    const conteudo = {
      url: `/uploads/postagens/${arquivo.filename}`,
      texto_longo: tipo === 'texto' ? String(req.body.texto_longo || '').trim() : '',
      arquivo: {
        nome_original: arquivo.originalname,
        nome_servidor: arquivo.filename,
        mimetype: arquivo.mimetype,
        tamanho_bytes: arquivo.size,
      },
    };

    const palavraDetectada = await detectarPalavraEmPartes([
      titulo,
      descricao,
      conteudo.texto_longo,
      subtipoTag?.nome || subtipo,
    ]);

    if (palavraDetectada) {
      return res.fail(`Sua postagem contém um termo não permitido: "${palavraDetectada}". Remova-o para continuar.`, 400);
    }

    const configFinal = { ...(config || { eh_rascunho: false }) };
    let statusModeracao = 'pendente';

    const post = await Postagem.create({
      autor_id: req.usuario.id,
      titulo,
      descricao,
      tipo,
      subtipo: subtipoTag?.nome || subtipo,
      subtipo_tag_id: subtipoTag?._id || null,
      conteudo,
      config: configFinal,
      tags: (() => {
        // Normaliza tags livres mantendo compatibilidade do schema atual.
        if (Array.isArray(tags)) return tags;
        if (typeof tags === 'string' && tags.trim()) {
          return tags.split(',').map((item) => item.trim()).filter(Boolean);
        }
        return [];
      })(),
      categorias: (() => {
        if (Array.isArray(categorias)) return categorias;
        if (typeof categorias === 'string' && categorias.trim()) {
          return categorias.split(',').map((item) => item.trim()).filter(Boolean);
        }
        return ['geral'];
      })(),
      status_moderacao: statusModeracao,
      denuncias: palavraDetectada
        ? {
            total: 1,
            motivos: [
              {
                usuario_id: req.usuario.id,
                motivo: `Filtro automatico detectou o termo: ${palavraDetectada}`,
              },
            ],
          }
        : undefined,
    });

    await Usuario.updateOne({ _id: req.usuario.id }, { $inc: { 'stats.total_postagens': 1 } });

    return res.success(post, 'Postagem criada com sucesso.', undefined, 201);
  } catch (error) {
    return next(error);
  }
});

// ============================================================================
// GET: Feed Híbrido (Seguidos + Descoberta)
// ============================================================================
// O que faz: Entrega postagens personalizadas para o usuário logado.
// Fluxo: 
// 1. Busca IDs de quem o usuário segue.
// 2. Busca posts desses seguidos (Timeline).
// 3. Se o total for menor que o limite da página, busca posts populares (Discovery).
// 4. Garante que rascunhos e posts bloqueados nunca apareçam.
router.get('/feed', authMiddleware, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePageParams(req);

    // 1. Identificar Grafo Social: Quem eu sigo?
    const seguindo = await Seguidor.find({ seguidor_id: req.usuario.id }).select('seguido_id');
    const seguindoIds = seguindo.map((s) => s.seguido_id);

    // 2. Critérios de Segurança e Visibilidade (Base)
    const criterioBase = {
      'config.eh_rascunho': false,
      'denuncias.bloqueado': false,
      status_moderacao: { $in: ['aprovado', 'pendente'] },
    };

    // 3. Busca de Postagens de Seguidos (Fase 1: Timeline)
    const criterioSeguidos = {
      ...criterioBase,
      autor_id: { $in: seguindoIds },
      'config.visibilidade': { $in: ['todos', 'seguidores'] },
    };

    let items = await Postagem.find(criterioSeguidos)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('autor_id', 'perfil.nome perfil.privacidade customizacao.banner_url');

    // 4. Modo de Descoberta (Fase 2: Fallback para Populares)
    // Se o usuário não segue ninguém ou já viu o conteúdo dos seguidos na página atual.
    if (items.length < limit) {
      const idsJaCarregados = items.map(item => item._id);
      const limiteRestante = limit - items.length;

      const criterioPopulares = {
        ...criterioBase,
        _id: { $not: { $in: idsJaCarregados } }, // Evita duplicados na mesma página
        'config.visibilidade': 'todos',
        // Opcional: Não mostrar posts do próprio autor na descoberta se ele já os viu
        autor_id: { $ne: req.usuario.id } 
      };

      const postsPopulares = await Postagem.find(criterioPopulares)
        .sort({ 'stats.likes': -1, 'stats.visualizacoes': -1, createdAt: -1 })
        .limit(limiteRestante)
        .populate('autor_id', 'perfil.nome perfil.privacidade customizacao.banner_url');

      items = [...items, ...postsPopulares];
    }

    const total = await Postagem.countDocuments(criterioBase);

    return res.success(items, 'Feed carregado com sucesso.', {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      modo_descoberta: seguindoIds.length === 0 || items.length > 0
    });
  } catch (error) {
    console.error('Erro ao processar Feed Híbrido:', error);
    return next(error);
  }
});

router.get('/usuario/:usuarioId', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePageParams(req);

    if (!mongoose.Types.ObjectId.isValid(req.params.usuarioId)) {
      return res.fail('ID de usuário inválido.', 400);
    }

    const usuario = await Usuario.findById(req.params.usuarioId).select('perfil.privacidade');
    if (!usuario) {
      return res.fail('Usuário não encontrado.', 404);
    }

    const usuarioLogadoId = req.usuario?.id || null;
    const ehProprio = usuarioLogadoId && String(usuarioLogadoId) === String(req.params.usuarioId);

    const segue = usuarioLogadoId
      ? await Seguidor.exists({
          seguidor_id: usuarioLogadoId,
          seguido_id: req.params.usuarioId,
        })
      : null;

    if (!ehProprio && usuario.perfil.privacidade === 'privado' && !segue) {
      return res.success([], 'Perfil privado. Nenhuma postagem disponível.', {
        page,
        limit,
        total: 0,
        totalPages: 0,
      });
    }

    const criterio = {
      autor_id: req.params.usuarioId,
      'config.eh_rascunho': false,
      'denuncias.bloqueado': false,
      status_moderacao: ehProprio ? { $in: ['aprovado', 'pendente'] } : 'aprovado',
    };

    const [items, total] = await Promise.all([
      Postagem.find(criterio).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Postagem.countDocuments(criterio),
    ]);

    return res.success(items, 'Postagens do usuário carregadas com sucesso.', {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/search', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { q, tipo, page, limit, skip } = { ...parsePageParams(req), q: req.query.q, tipo: req.query.tipo };
    
    if (!q) {
      return res.success({ usuarios: [], postagens: [] }, 'Busca vazia.');
    }

    const regex = new RegExp(q, 'i');

    // 1. Buscar Usuários que coincidem com o termo (por nome ou email/username se disponível)
    const usuariosEncontrados = await Usuario.find({
      $or: [
        { 'perfil.nome': regex },
        { 'perfil.email': regex }
      ]
    })
    .select('perfil.nome perfil.bio customizacao.avatar_url customizacao.banner_url')
    .limit(10);

    // Pegar IDs dos usuários encontrados para buscar postagens deles também
    const idsUsuarios = usuariosEncontrados.map(u => u._id);

    // 2. Construir Query de Postagens
    const queryPostagens = {
      'config.eh_rascunho': false,
      'denuncias.bloqueado': false,
      status_moderacao: 'aprovado'
    };

    if (q) {
      queryPostagens.$or = [
        { titulo: regex },
        { descricao: regex },
        { subtipo: regex },
        { tags: regex },
        { categorias: regex },
        { autor_id: { $in: idsUsuarios } } // Inclui posts dos usuários encontrados
      ];
    }

    if (tipo && tipo !== 'todos') {
      queryPostagens.tipo = tipo;
    }

    const [postagens, totalPostagens] = await Promise.all([
      Postagem.find(queryPostagens)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('autor_id', 'perfil.nome perfil.privacidade customizacao.avatar_url customizacao.banner_url'),
      Postagem.countDocuments(queryPostagens)
    ]);

    return res.success(
      { 
        usuarios: usuariosEncontrados, 
        postagens: postagens 
      }, 
      'Busca realizada com sucesso.', 
      {
        page,
        limit,
        total: totalPostagens,
        totalPages: Math.ceil(totalPostagens / limit)
      }
    );
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', optionalAuthMiddleware, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.fail('ID de postagem inválido.', 400);
    }

    const post = await Postagem.findById(req.params.id).populate(
      'autor_id',
      'perfil.nome perfil.privacidade customizacao.banner_url'
    );

    if (!post) {
      return res.fail('Postagem não encontrada.', 404);
    }

    const usuarioLogadoId = req.usuario?.id || null;
    const ehAutor = usuarioLogadoId && String(post.autor_id._id) === String(usuarioLogadoId);
    const autorPrivado = post.autor_id.perfil?.privacidade === 'privado';

    if (autorPrivado && !ehAutor) {
      const segue = usuarioLogadoId
        ? await Seguidor.exists({
            seguidor_id: usuarioLogadoId,
            seguido_id: post.autor_id._id,
          })
        : null;

      if (!segue) {
        return res.fail('Postagem de perfil privado.', 403);
      }
    }

    return res.success(post, 'Postagem carregada com sucesso.');
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const post = await Postagem.findById(req.params.id);
    if (!post) {
      return res.fail('Postagem não encontrada.', 404);
    }

    if (String(post.autor_id) !== String(req.usuario.id)) {
      return res.fail('Você não pode editar esta postagem.', 403);
    }

    const camposPermitidos = [
      'titulo',
      'descricao',
      'subtipo',
      'subtipo_tag_id',
      'conteudo',
      'config',
      'tags',
      'categorias',
    ];
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        post[campo] = req.body[campo];
      }
    });

    const palavraDetectada = await detectarPalavraEmPartes([
      post.titulo,
      post.descricao,
      post.conteudo?.texto_longo,
    ]);

    if (palavraDetectada) {
      return res.fail(`Sua postagem contém um termo não permitido: "${palavraDetectada}". Remova-o para continuar.`, 400);
    }

    await post.save();

    return res.success(post, 'Postagem atualizada com sucesso.');
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const post = await Postagem.findById(req.params.id);
    if (!post) {
      return res.fail('Postagem não encontrada.', 404);
    }

    if (String(post.autor_id) !== String(req.usuario.id)) {
      return res.fail('Você não pode remover esta postagem.', 403);
    }

    await Postagem.deleteOne({ _id: post._id });
    await Usuario.updateOne({ _id: req.usuario.id }, { $inc: { 'stats.total_postagens': -1 } });

    return res.success(null, 'Postagem removida com sucesso.');
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/curtir', authMiddleware, async (req, res, next) => {
  try {
    const post = await Postagem.findById(req.params.id);
    if (!post) {
      return res.fail('Postagem não encontrada.', 404);
    }

    await post.adicionarCurtida(req.usuario.id);

    // Disparar notificação apenas se o autor da postagem não for o próprio usuário
    if (String(post.autor_id) !== String(req.usuario.id)) {
      await notificarLike(post.autor_id, req.usuario.id, post._id);
    }

    return res.success({ likes: post.stats.likes + 0 }, 'Curtida registrada com sucesso.');
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id/curtir', authMiddleware, async (req, res, next) => {
  try {
    const post = await Postagem.findById(req.params.id);
    if (!post) {
      return res.fail('Postagem não encontrada.', 404);
    }

    await post.removerCurtida(req.usuario.id);
    return res.success({ likes: post.stats.likes + 0 }, 'Curtida removida com sucesso.');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
