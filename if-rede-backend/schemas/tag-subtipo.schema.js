const mongoose = require('mongoose');

const tagSubtipoSchema = new mongoose.Schema(
  {
    // Nome visivel da tag para o usuario final (ex.: "desenho", "fotografia").
    // Entrada: valor informado por moderador/sistema.
    // Saida: string exibida em formularios e listagens de postagens.
    nome: {
      type: String,
      required: [true, 'Nome da tag e obrigatorio'],
      trim: true,
      minlength: [2, 'Nome da tag deve ter ao menos 2 caracteres'],
      maxlength: [50, 'Nome da tag deve ter no maximo 50 caracteres'],
    },

    // Slug normalizado para busca/indexacao e comparacao case-insensitive.
    // Entrada: derivado de nome no pre-validate.
    // Saida: chave estavel para deduplicacao e consultas rapidas.
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      immutable: true,
    },

    // Tipo principal ao qual a tag pertence.
    // Entrada: tipo da postagem (imagem/audio/texto).
    // Saida: permite filtrar tags relevantes por tipo durante criacao do post.
    tipo: {
      type: String,
      enum: ['imagem', 'audio', 'texto'],
      required: [true, 'Tipo da tag e obrigatorio'],
      index: true,
    },

    // Flag para inativar tags sem perder historico de postagens antigas.
    ativo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'tags_subtipo',
  }
);

// Indice unico composto evita duplicidade de slug por tipo.
// Ex.: "desenho" em imagem e "desenho" em texto podem coexistir,
// mas duas tags "desenho" no tipo imagem nao.
tagSubtipoSchema.index({ tipo: 1, slug: 1 }, { unique: true });
tagSubtipoSchema.index({ tipo: 1, ativo: 1, nome: 1 });

// Normalizacao centralizada para manter consistencia de slug no banco.
// Entrada: nome digitado.
// Saida: slug previsivel sem acentos/caracteres especiais.
tagSubtipoSchema.pre('validate', function normalizeSlug(next) {
  this.slug = String(this.nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  next();
});

module.exports = tagSubtipoSchema;
