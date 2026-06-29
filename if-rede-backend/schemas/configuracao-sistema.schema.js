const mongoose = require('mongoose');

const configuracaoSistemaSchema = new mongoose.Schema(
  {
    modo_manutencao: {
      type: Boolean,
      default: false,
    },
    atualizado_por: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
    },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

module.exports = configuracaoSistemaSchema;
