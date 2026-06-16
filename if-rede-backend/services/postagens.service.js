const { Postagem, Seguidor } = require('../models');

/**
 * Service para gestão de métricas e lógica de postagens
 */
const postagensService = {
  /**
   * Registrar uma visualização única (Alcance)
   * O que faz: Valida regras de privacidade e incrementa alcance atomicamente.
   */
  async registrarVisualizacaoUnica(postId, userId) {
    // 1. Busca postagem com dados mínimos de privacidade do autor
    // Por que: Otimiza performance carregando apenas o necessário.
    const postagem = await Postagem.findById(postId)
      .populate('autor_id', 'perfil.privacidade')
      .select('autor_id stats.alcance stats.visualizadores');

    if (!postagem) {
      const error = new Error('Postagem não encontrada');
      error.status = 404;
      throw error;
    }

    const autorId = postagem.autor_id?._id || postagem.autor_id;

    // 2. Regra: O autor não conta para o próprio alcance
    if (String(autorId) === String(userId)) {
      return { alterado: false, alcance: postagem.stats.alcance, autorId };
    }

    // 3. Regra de Privacidade: Se perfil privado, apenas seguidores aprovados contam
    if (postagem.autor_id?.perfil?.privacidade === 'privado') {
      const ehSeguidor = await Seguidor.exists({
        seguidor_id: userId,
        seguido_id: autorId
      });

      if (!ehSeguidor) {
        const error = new Error('Acesso negado: Perfil privado.');
        error.status = 403;
        throw error;
      }
    }

    // 4. Atualização Atômica: Só incrementa se o usuário ainda não visualizou
    // A condição visualizadores: { $ne: userId } garante atomicidade.
    const resultado = await Postagem.findOneAndUpdate(
      { 
        _id: postId, 
        'stats.visualizadores': { $ne: userId } 
      },
      { 
        $addToSet: { 'stats.visualizadores': userId },
        $inc: { 'stats.alcance': 1 }
      },
      { new: true, select: 'stats.alcance autor_id' }
    );

    return {
      alterado: !!resultado,
      alcance: resultado ? resultado.stats.alcance : postagem.stats.alcance,
      autorId
    };
  }
};

module.exports = postagensService;
