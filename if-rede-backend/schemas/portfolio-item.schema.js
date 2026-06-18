const mongoose = require('mongoose');

const portfolioItemSchema = new mongoose.Schema(
  {
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    postagem_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Postagem',
      required: true,
    },
    posicao: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },
    fixado_em: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'portfolio_items',
  }
);

// Garantir que um usuário não tenha dois posts na mesma posição
portfolioItemSchema.index({ usuario_id: 1, posicao: 1 }, { unique: true });
// Garantir que um post não seja fixado duas vezes pelo mesmo usuário
portfolioItemSchema.index({ usuario_id: 1, postagem_id: 1 }, { unique: true });

module.exports = portfolioItemSchema;
