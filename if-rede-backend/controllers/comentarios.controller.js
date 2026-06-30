const { Comentario, Postagem, AtividadeModeracacao, Usuario } = require('../models');
const { detectarPalavraProibida } = require('../services/palavras-filtro.service');
const { notificarComentario, notificarLikeComentario, notificarRespostaComentario } = require('../services/notificacoes.service');

/**
 * Controller para gestão de comentários e discussão acadêmica
 */
const comentariosController = {
  /**
   * Criar um novo comentário ou resposta
   */
  async criar(req, res, next) {
    try {
      const { postagem_id, texto, parent_id } = req.body;

      if (!postagem_id || !texto) {
        return res.fail('Campos obrigatórios: postagem_id e texto.', 400);
      }

      const postagem = await Postagem.findById(postagem_id);
      if (!postagem) {
        return res.fail('Postagem não encontrada.', 404);
      }

      if (postagem.config && postagem.config.comentarios_ativos === false) {
        return res.fail('Comentários estão desativados nesta postagem.', 400);
      }

      // Se for uma resposta, verificar se o comentário pai existe
      if (parent_id) {
        const pai = await Comentario.findById(parent_id);
        if (!pai) {
          return res.fail('Comentário pai não encontrado.', 404);
        }
      }

      // Define status inicial baseado na configuração da postagem
      let statusInicial = (postagem.config && postagem.config.comentarios_moderados) ? 'pendente' : 'aprovado';

      const comentario = new Comentario({
        postagem_id,
        autor_id: req.usuario.id,
        texto,
        parent_id: parent_id || null,
        status: statusInicial
      });

      // Filtro de palavras proibidas
      const palavraDetectada = await detectarPalavraProibida(texto);
      if (palavraDetectada) {
        comentario.status = 'pendente'; // Força para moderação
        comentario.moderacao.auto_marcado = true;
        comentario.moderacao.palavra_detectada = palavraDetectada;
        comentario.moderacao.motivo = 'Comentário marcado automaticamente pelo filtro dinâmico.';
      }

      await comentario.save();

      // Log de moderação se foi auto-marcado
      if (comentario.moderacao.auto_marcado) {
        await AtividadeModeracacao.create({
          moderador_id: req.usuario.id,
          moderador_nome: 'Sistema Automático',
          moderador_matricula: 'SYSTEM',
          tipo_acao: 'filtro_palavras_acionado',
          descricao: 'Comentário marcado automaticamente por palavra proibida.',
          objeto_tipo: 'comentario',
          objeto_id: comentario._id,
          resultado: 'sucesso'
        });

        // Notificar administradores/moderadores sobre o comentário retido
        const { notificarRetencaoModeracao } = require('../services/notificacoes.service');
        notificarRetencaoModeracao(comentario._id, 'comentario', comentario.texto, req.usuario.id).catch(err =>
          console.error('Erro ao disparar notificacao de retencao de comentario:', err)
        );
      } else if (comentario.status === 'aprovado') {
        // Notificar autor se o comentário for aprovado automaticamente
        if (parent_id) {
          const pai = await Comentario.findById(parent_id);
          if (pai && String(pai.autor_id) !== String(comentario.autor_id)) {
            await notificarRespostaComentario(pai.autor_id, comentario.autor_id, comentario._id);
          }
        } else if (postagem && String(postagem.autor_id) !== String(comentario.autor_id)) {
          await notificarComentario(postagem.autor_id, comentario.autor_id, postagem._id, comentario._id);
        }
      }

      return res.success(
        { comentario },
        'Comentário enviado para moderação.',
        undefined,
        201
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Listar comentários de uma postagem (com suporte a hierarquia)
   */
  async listarPorPostagem(req, res, next) {
    try {
      const { postagemId } = req.params;
      
      // Busca todos os comentários aprovados
      const todos = await Comentario.find({ 
        postagem_id: postagemId, 
        status: 'aprovado' 
      })
      .sort({ highlight_type: -1, createdAt: 1 }) // Destaques primeiro, depois por data
      .populate('autor_id', 'perfil.nome perfil.apelido perfil.status_vinculo customizacao.avatar_url customizacao.avatar_position');

      // Organiza em árvore (apenas 1 nível de profundidade para simplificar UI)
      const raizes = todos.filter(c => !c.parent_id);
      const respostas = todos.filter(c => c.parent_id);

      const discussao = raizes.map(pai => {
        const item = pai.toObject();
        item.respostas = respostas.filter(r => String(r.parent_id) === String(pai._id));
        return item;
      });

      return res.success(discussao, 'Discussão carregada com sucesso.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Buscar um comentário específico pelo ID
   */
  async buscarPorId(req, res, next) {
    try {
      const { id } = req.params;
      const comentario = await Comentario.findById(id);
      if (!comentario) {
        return res.fail('Comentário não encontrado.', 404);
      }
      return res.success({ comentario }, 'Comentário encontrado.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Alternar destaque pedagógico (Apenas PROFESSOR/ORIENTADOR -> servidor)
   */
  async toggleHighlight(req, res, next) {
    try {
      const { id } = req.params;
      const { type } = req.body; // 'NORMAL', 'OFFICIAL_ANSWER', 'PEDAGOGICAL_HIGHLIGHT'

      // Validação de Permissão: Apenas servidores podem destacar
      if (req.usuario.vinculo !== 'servidor') {
        return res.fail('Apenas professores ou orientadores podem destacar comentários.', 403);
      }

      if (!['NORMAL', 'OFFICIAL_ANSWER', 'PEDAGOGICAL_HIGHLIGHT'].includes(type)) {
        return res.fail('Tipo de destaque inválido.', 400);
      }

      const comentario = await Comentario.findById(id);
      if (!comentario) {
        return res.fail('Comentário não encontrado.', 404);
      }

      comentario.highlight_type = type;
      await comentario.save();

      return res.success({ comentario }, `Comentário atualizado para: ${type}`);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Curtir um comentário
   */
  async curtir(req, res, next) {
    try {
      const comentario = await Comentario.findById(req.params.id);
      if (!comentario) return res.fail('Comentário não encontrado.', 404);

      await comentario.adicionarCurtida(req.usuario.id);

      if (String(comentario.autor_id) !== String(req.usuario.id)) {
        await notificarLikeComentario(comentario.autor_id, req.usuario.id, comentario._id);
      }

      return res.success({ likes: comentario.stats.likes }, 'Comentário curtido.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remover curtida
   */
  async descurtir(req, res, next) {
    try {
      const comentario = await Comentario.findById(req.params.id);
      if (!comentario) return res.fail('Comentário não encontrado.', 404);

      await comentario.removerCurtida(req.usuario.id);
      return res.success({ likes: comentario.stats.likes }, 'Curtida removida.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Aprovar comentário (Moderador)
   */
  async aprovar(req, res, next) {
    try {
      const comentario = await Comentario.findById(req.params.id);
      if (!comentario) return res.fail('Comentário não encontrado.', 404);

      await comentario.aprovar(req.usuario.id, req.body?.observacao);

      // Notificar autor do post ou autor do comentário pai se for resposta
      const postagem = await Postagem.findById(comentario.postagem_id);
      
      if (comentario.parent_id) {
        const pai = await Comentario.findById(comentario.parent_id);
        if (pai && String(pai.autor_id) !== String(comentario.autor_id)) {
          await notificarRespostaComentario(pai.autor_id, comentario.autor_id, comentario._id);
        }
      } else if (postagem && String(postagem.autor_id) !== String(comentario.autor_id)) {
        await notificarComentario(postagem.autor_id, comentario.autor_id, postagem._id, comentario._id);
      }

      return res.success({ comentario }, 'Comentário aprovado.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Rejeitar comentário (Moderador)
   */
  async rejeitar(req, res, next) {
    try {
      const comentario = await Comentario.findById(req.params.id);
      if (!comentario) return res.fail('Comentário não encontrado.', 404);

      await comentario.rejeitar(req.usuario.id, req.body?.motivo);
      return res.success({ comentario }, 'Comentário rejeitado.');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = comentariosController;
