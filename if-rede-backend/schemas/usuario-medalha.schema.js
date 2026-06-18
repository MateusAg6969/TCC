const mongoose = require('mongoose');

const usuarioMedalhaSchema = new mongoose.Schema(
  {
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    medalha_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medalha',
      required: true,
      index: true,
    },
    awarded_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'usuario_medalhas',
  }
);

// Garantir que um usuário não ganhe a mesma medalha duas vezes
usuarioMedalhaSchema.index({ usuario_id: 1, medalha_id: 1 }, { unique: true });

module.exports = usuarioMedalhaSchema;
