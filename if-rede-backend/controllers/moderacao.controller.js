const { Postagem, AtividadeModeracao, Usuario } = require('../models');

/**
 * Controller para operações administrativas de moderação
 */
const moderacaoController = {
  /**
   * Listar postagens pendentes de moderação
   * (Denunciadas ou retidas por filtro)
   */
  async listarPendentes(req, res, next) {
    try {
      const criterio = {
        $or: [
          { status_moderacao: 'pendente' },
          { 'denuncias.total': { $gt: 0 } },
          { 'denuncias.bloqueado': true }
        ],
        // Opcional: apenas posts que não foram rejeitados ainda
        status_moderacao: { $ne: 'rejeitado' }
      };

      const pendentes = await Postagem.find(criterio)
        .sort({ createdAt: 1 })
        .populate('autor_id', 'perfil.nome customizacao.avatar_url customizacao.avatar_position');

      return res.success(pendentes, 'Fila de moderação carregada.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Aprovar uma postagem (limpar flags de denúncia)
   */
  async aprovarPostagem(req, res, next) {
    try {
      const { postId } = req.params;
      const post = await Postagem.findById(postId);

      if (!post) {
        return res.fail('Postagem não encontrada.', 404);
      }

      // Limpar flags e aprovar
      post.status_moderacao = 'aprovado';
      post.denuncias.total = 0;
      post.denuncias.bloqueado = false;
      post.moderado_por = req.usuario.id;

      await post.save();

      // Registrar atividade de moderação
      await AtividadeModeracao.create({
        moderador_id: req.usuario.id,
        tipo_acao: 'aprovacao_postagem',
        descricao: `Postagem "${post.titulo}" aprovada manualmente.`,
        objeto_id: post._id,
        objeto_tipo: 'postagem',
        resultado: 'sucesso'
      });

      return res.success(post, 'Postagem aprovada e visível publicamente.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Rejeitar uma postagem (ocultar ou deletar logicamente)
   */
  async rejeitarPostagem(req, res, next) {
    try {
      const { postId } = req.params;
      const { motivo } = req.body;

      const post = await Postagem.findById(postId);
      if (!post) {
        return res.fail('Postagem não encontrada.', 404);
      }

      // Ocultar postagem
      post.status_moderacao = 'rejeitado';
      post.denuncias.bloqueado = true;
      post.denuncias.motivo_bloqueio = motivo || 'Conteúdo inadequado segundo as diretrizes acadêmicas.';
      post.moderado_por = req.usuario.id;

      await post.save();

      // Registrar atividade
      await AtividadeModeracao.create({
        moderador_id: req.usuario.id,
        tipo_acao: 'rejeicao_postagem',
        descricao: `Postagem "${post.titulo}" rejeitada. Motivo: ${post.denuncias.motivo_bloqueio}`,
        objeto_id: post._id,
        objeto_tipo: 'postagem',
        resultado: 'sucesso'
      });

      return res.success(null, 'Postagem removida de circulação.');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = moderacaoController;
