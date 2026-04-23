const mongoose = require('mongoose');

const palavraFiltroSchema = new mongoose.Schema(
  {
    termo: {
      type: String,
      required: [true, 'Termo e obrigatorio'],
      trim: true,
      minlength: [2, 'Termo deve ter no minimo 2 caracteres'],
      maxlength: [60, 'Termo deve ter no maximo 60 caracteres'],
    },
    termo_normalizado: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      immutable: true,
    },
    ativo: {
      type: Boolean,
      default: true,
      index: true,
    },
    severidade: {
      type: String,
      enum: ['baixa', 'media', 'alta'],
      default: 'media',
    },
    criado_por: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'palavras_filtro',
  }
);

palavraFiltroSchema.index({ termo_normalizado: 1 }, { unique: true });
palavraFiltroSchema.index({ ativo: 1, termo_normalizado: 1 });

palavraFiltroSchema.pre('validate', function normalizeTermo(next) {
  this.termo_normalizado = String(this.termo || '').trim().toLowerCase();
  next();
});

module.exports = palavraFiltroSchema;
