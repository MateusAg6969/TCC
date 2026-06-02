const express = require('express');
const { Comentario, Postagem, AtividadeModeracacao } = require('../models');
const { authMiddleware, moderadorMiddleware } = require('../middleware/auth.middleware');
const { detectarPalavraProibida } = require('../services/palavras-filtro.service');
const { notificarComentario, notificarLikeComentario } = require('../services/notificacoes.service');

const router = express.Router();

// ============================================================================
// POST: Curtir um comentário
// ============================================================================
// O que faz: Adiciona o ID do usuário logado à lista de curtidas do comentário.
// Justificativa: Permite interação social direta nos comentários.
router.post('/:id/curtir', authMiddleware, async (req, res, next) => {
  try {
    const comentario = await Comentario.findById(req.params.id);
    if (!comentario) {
      return res.fail('Comentário não encontrado.', 404);
    }

    // Executa método do schema que gerencia a lógica de negócio da curtida
    await comentario.adicionarCurtida(req.usuario.id);

    // Disparar notificação apenas se o autor do comentário não for o próprio usuário
    if (String(comentario.autor_id) !== String(req.usuario.id)) {
      await notificarLikeComentario(comentario.autor_id, req.usuario.id, comentario._id);
    }

    return res.success(
      { likes: comentario.stats.likes },
      'Comentário curtido com sucesso.'
    );
  } catch (error) {
    return next(error);
  }
});

// ============================================================================
// DELETE: Remover curtida de um comentário
// ============================================================================
// O que faz: Remove o ID do usuário logado da lista de curtidas.
router.delete('/:id/curtir', authMiddleware, async (req, res, next) => {
  try {
    const comentario = await Comentario.findById(req.params.id);
    if (!comentario) {
      return res.fail('Comentário não encontrado.', 404);
    }

    await comentario.removerCurtida(req.usuario.id);

    return res.success(
      { likes: comentario.stats.likes },
      'Curtida removida com sucesso.'
    );
  } catch (error) {
    return next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { postagem_id, texto } = req.body;

    if (!postagem_id || !texto) {
      return res.fail('Campos obrigatórios: postagem_id e texto.', 400);
    }

    const postagem = await Postagem.findById(postagem_id);
    if (!postagem) {
      return res.fail('Postagem não encontrada.', 404);
    }

    if (!postagem.config.comentarios_ativos) {
      return res.fail('Comentários estão desativados nesta postagem.', 400);
    }

    const comentario = new Comentario({
      postagem_id,
      autor_id: req.usuario.id,
      texto,
    });

    comentario.status = 'pendente';
    const palavraDetectada = await detectarPalavraProibida(texto);

    if (palavraDetectada) {
      comentario.moderacao.auto_marcado = true;
      comentario.moderacao.palavra_detectada = palavraDetectada;
      comentario.moderacao.motivo = 'Comentario marcado automaticamente pelo filtro dinamico.';
    }

    await comentario.save();

    if (comentario.moderacao.auto_marcado) {
      await AtividadeModeracacao.create({
        moderador_id: req.usuario.id,
        moderador_nome: 'Sistema Automático',
        moderador_matricula: 'SYSTEM',
        tipo_acao: 'filtro_palavras_acionado',
        descricao: 'Comentário marcado automaticamente por palavra proibida.',
        objeto_tipo: 'comentario',
        objeto_id: comentario._id,
        tempo_estimado_minutos: 1,
        resultado: 'sucesso',
        tags: ['linguagem-inapropriada'],
      });
    }

    return res.success(
      { comentario },
      'Comentário recebido e enviado para moderação.',
      undefined,
      201
    );
  } catch (error) {
    return next(error);
  }
});

router.get('/postagem/:postagemId', async (req, res, next) => {
  try {
    const comentarios = await Comentario.listarAprovadosDaPostagem(req.params.postagemId, 100);
    return res.success(comentarios, 'Comentários carregados com sucesso.', {
      total: comentarios.length,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/moderacao/pendentes', authMiddleware, moderadorMiddleware, async (req, res, next) => {
  try {
    const comentarios = await Comentario.listarPendentes(100);
    return res.success(comentarios, 'Fila de moderação carregada com sucesso.', {
      total: comentarios.length,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/aprovar', authMiddleware, moderadorMiddleware, async (req, res, next) => {
  try {
    const comentario = await Comentario.findById(req.params.id);

    if (!comentario) {
      return res.fail('Comentário não encontrado.', 404);
    }

    await comentario.aprovar(req.usuario.id, req.body?.observacao || 'Aprovado pela moderação.');

    // Disparar notificação para o autor da postagem
    // Buscamos a postagem para saber quem é o autor
    const { Postagem } = require('../models');
    const postagem = await Postagem.findById(comentario.postagem_id);
    
    if (postagem && String(postagem.autor_id) !== String(comentario.autor_id)) {
      await notificarComentario(postagem.autor_id, comentario.autor_id, postagem._id, comentario._id);
    }

    return res.success({ comentario }, 'Comentário aprovado com sucesso.');
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/rejeitar', authMiddleware, moderadorMiddleware, async (req, res, next) => {
  try {
    const comentario = await Comentario.findById(req.params.id);

    if (!comentario) {
      return res.fail('Comentário não encontrado.', 404);
    }

    await comentario.rejeitar(req.usuario.id, req.body?.motivo || 'Rejeitado pela moderação.');

    return res.success({ comentario }, 'Comentário rejeitado com sucesso.');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
