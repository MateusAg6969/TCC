const mongoose = require('mongoose');
const palavrasProibidas = require('../config/palavras-proibidas');

function textoContemPalavraProibida(texto) {
  const textoNormalizado = String(texto || '').toLowerCase();
  return palavrasProibidas.find((palavra) => {
    const regex = new RegExp(`\\b${palavra}\\b`, 'i');
    return regex.test(textoNormalizado);
  }) || null;
}

const comentarioSchema = new mongoose.Schema(
  {
    postagem_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Postagem',
      required: [true, 'ID da postagem é obrigatório'],
      index: true,
    },
    autor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'ID do autor é obrigatório'],
      index: true,
    },
    texto: {
      type: String,
      required: [true, 'Texto do comentário é obrigatório'],
      trim: true,
      minlength: [2, 'Comentário deve ter pelo menos 2 caracteres'],
      maxlength: [1000, 'Comentário não pode exceder 1000 caracteres'],
    },
    status: {
      type: String,
      enum: ['pendente', 'aprovado', 'rejeitado'],
      default: 'pendente',
      index: true,
    },
    moderacao: {
      motivo: { type: String, default: '' },
      auto_marcado: { type: Boolean, default: false },
      palavra_detectada: { type: String, default: '' },
      moderado_por: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null,
      },
      data_moderacao: { type: Date, default: null },
      observacao: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    collection: 'comentarios',
  }
);

comentarioSchema.index({ postagem_id: 1, status: 1, createdAt: -1 });
comentarioSchema.index({ autor_id: 1, createdAt: -1 });

comentarioSchema.methods.aplicarFiltroInicial = function () {
  const palavra = textoContemPalavraProibida(this.texto);

  this.status = 'pendente';

  if (palavra) {
    this.moderacao.auto_marcado = true;
    this.moderacao.palavra_detectada = palavra;
    this.moderacao.motivo = 'Comentário marcado automaticamente pelo filtro.';
  }

  return this;
};

comentarioSchema.methods.aprovar = function (moderadorId, observacao = '') {
  this.status = 'aprovado';
  this.moderacao.moderado_por = moderadorId;
  this.moderacao.data_moderacao = new Date();
  this.moderacao.observacao = observacao;
  return this.save();
};

comentarioSchema.methods.rejeitar = function (moderadorId, motivo = '') {
  this.status = 'rejeitado';
  this.moderacao.moderado_por = moderadorId;
  this.moderacao.data_moderacao = new Date();
  this.moderacao.motivo = motivo || 'Comentário rejeitado pela moderação.';
  return this.save();
};

comentarioSchema.statics.listarAprovadosDaPostagem = function (postagemId, limit = 20) {
  return this.find({ postagem_id: postagemId, status: 'aprovado' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('autor_id', 'perfil.nome customizacao.banner_url');
};

comentarioSchema.statics.listarPendentes = function (limit = 50) {
  return this.find({ status: 'pendente' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate('autor_id', 'perfil.nome perfil.matricula')
    .populate('postagem_id', 'titulo autor_id');
};

module.exports = comentarioSchema;
