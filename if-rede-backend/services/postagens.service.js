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
      .select('autor_id stats.alcance stats.visualizacoes stats.visualizadores');

    if (!postagem) {
      const error = new Error('Postagem não encontrada');
      error.status = 404;
      throw error;
    }

    const autorId = postagem.autor_id?._id || postagem.autor_id;

    // Se o usuário estiver logado
    if (userId) {
      // 2. Regra: O autor não conta para o próprio alcance ou visualizações para evitar auto-inflação
      if (String(autorId) === String(userId)) {
        return { 
          alterado: false, 
          alcance: postagem.stats.alcance, 
          visualizacoes: postagem.stats.visualizacoes || 0,
          autorId 
        };
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
          $inc: { 'stats.alcance': 1, 'stats.visualizacoes': 1 }
        },
        { new: true, select: 'stats.alcance stats.visualizacoes autor_id' }
      );

      // Se resultado for nulo, significa que o usuário já visualizou anteriormente.
      // Então apenas incrementamos as visualizações brutas incondicionalmente.
      if (!resultado) {
        const resultadoBruto = await Postagem.findOneAndUpdate(
          { _id: postId },
          { $inc: { 'stats.visualizacoes': 1 } },
          { new: true, select: 'stats.alcance stats.visualizacoes autor_id' }
        );
        return {
          alterado: false,
          alcance: postagem.stats.alcance,
          visualizacoes: resultadoBruto ? resultadoBruto.stats.visualizacoes : postagem.stats.visualizacoes,
          autorId
        };
      }

      return {
        alterado: true,
        alcance: resultado.stats.alcance,
        visualizacoes: resultado.stats.visualizacoes,
        autorId
      };
    } else {
      // Usuário anônimo (sem userId)
      // Se o perfil for privado, não permite acesso anônimo
      if (postagem.autor_id?.perfil?.privacidade === 'privado') {
        const error = new Error('Acesso negado: Perfil privado.');
        error.status = 403;
        throw error;
      }

      // Apenas incrementa visualização bruta de forma incondicional
      const resultadoBruto = await Postagem.findOneAndUpdate(
        { _id: postId },
        { $inc: { 'stats.visualizacoes': 1 } },
        { new: true, select: 'stats.alcance stats.visualizacoes autor_id' }
      );

      return {
        alterado: false,
        alcance: postagem.stats.alcance,
        visualizacoes: resultadoBruto ? resultadoBruto.stats.visualizacoes : postagem.stats.visualizacoes,
        autorId
      };
    }
  }
};

module.exports = postagensService;
