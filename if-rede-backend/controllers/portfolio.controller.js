const { PortfolioItem, Postagem } = require('../models');

/**
 * Controller para gestão do Portfólio de Estudantes
 */
const portfolioController = {
  /**
   * Fixar ou desfixar uma postagem no portfólio
   * Rota: PATCH /portfolio/pin
   */
  async alternarPin(req, res, next) {
    try {
      const { postagem_id, posicao } = req.body;
      const usuario_id = req.usuario.id;

      if (!postagem_id) {
        return res.fail('ID da postagem é obrigatório.', 400);
      }

      // 1. Verificar se a postagem pertence ao usuário
      const postagem = await Postagem.findById(postagem_id);
      if (!postagem) {
        return res.fail('Postagem não encontrada.', 404);
      }

      if (String(postagem.autor_id) !== String(usuario_id)) {
        return res.fail('Você só pode fixar suas próprias postagens.', 403);
      }

      // 2. Verificar se já está fixado
      const jaFixado = await PortfolioItem.findOne({ usuario_id, postagem_id });

      if (jaFixado) {
        // Se já está fixado, vamos remover (desfixar)
        await PortfolioItem.deleteOne({ _id: jaFixado._id });
        return res.success(null, 'Postagem removida do portfólio.');
      } else {
        // Se não está fixado, vamos adicionar (fixar)
        
        // Validar posição
        if (![1, 2, 3].includes(Number(posicao))) {
          return res.fail('Posição inválida. Escolha entre 1, 2 ou 3.', 400);
        }

        // 3. Validar limite de 3 posts
        const totalFixados = await PortfolioItem.countDocuments({ usuario_id });
        if (totalFixados >= 3) {
          return res.fail('Limite de 3 postagens no portfólio atingido. Desfixe uma para adicionar outra.', 400);
        }

        // 4. Verificar se a posição já está ocupada
        const posicaoOcupada = await PortfolioItem.findOne({ usuario_id, posicao });
        if (posicaoOcupada) {
          return res.fail(`A posição ${posicao} já está ocupada por outra postagem.`, 400);
        }

        const novoItem = await PortfolioItem.create({
          usuario_id,
          postagem_id,
          posicao
        });

        return res.success(novoItem, 'Postagem fixada no portfólio com sucesso!', undefined, 201);
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * Listar itens do portfólio de um usuário
   */
  async listarPorUsuario(req, res, next) {
    try {
      const { userId } = req.params;
      const items = await PortfolioItem.find({ usuario_id: userId })
        .populate('postagem_id')
        .sort({ posicao: 1 });

      const mappedItems = items.map(p => {
        if (!p.postagem_id) return null;
        return {
          ...p.postagem_id.toObject(),
          posicao: p.posicao,
          fixado_em: p.fixado_em
        };
      }).filter(Boolean);

      return res.success(mappedItems, 'Portfólio carregado com sucesso.');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = portfolioController;
