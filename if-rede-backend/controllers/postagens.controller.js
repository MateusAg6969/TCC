const postagensService = require('../services/postagens.service');
const socket = require('../socket');

/**
 * Controller para gestão de postagens e métricas de alcance
 */
const postagensController = {
  /**
   * Registrar uma visualização única (Alcance)
   * Rota: POST /postagens/:id/visualizar
   */
  async registrarVisualizacao(req, res, next) {
    try {
      const { alterado, alcance, autorId } = await postagensService.registrarVisualizacaoUnica(
        req.params.id,
        req.usuario.id
      );

      // Emite evento via Socket.io APENAS se o alcance realmente mudou
      if (alterado) {
        socket.getIO().to(`user_${autorId}`).emit('post_alcance_atualizado', {
          postId: req.params.id,
          alcance
        });
      }

      return res.success({ alcance }, 'Processamento de alcance concluído.');
    } catch (error) {
      if (error.status) {
        return res.fail(error.message, error.status);
      }
      next(error);
    }
  }
};

module.exports = postagensController;
