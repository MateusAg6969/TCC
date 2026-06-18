const mongoose = require('mongoose');

const medalhaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'Nome da medalha é obrigatório'],
      unique: true,
      trim: true,
    },
    descricao: {
      type: String,
      required: [true, 'Descrição da medalha é obrigatória'],
    },
    icone_url: {
      type: String,
      required: [true, 'URL do ícone é obrigatória'],
    },
  },
  {
    timestamps: true,
    collection: 'medalhas',
  }
);

module.exports = medalhaSchema;
