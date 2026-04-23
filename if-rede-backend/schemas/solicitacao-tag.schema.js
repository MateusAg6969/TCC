const mongoose = require('mongoose');

const solicitacaoTagSchema = new mongoose.Schema(
  {
    // Usuario que solicitou a nova tag.
    // Entrada: req.usuario.id (JWT validado).
    // Saida: trilha de auditoria para moderacao/aprovacao.
    solicitante_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'Solicitante e obrigatorio'],
      index: true,
    },

    // Nome desejado para nova tag (ex.: "aquarela digital").
    nome_sugerido: {
      type: String,
      required: [true, 'Nome sugerido e obrigatorio'],
      trim: true,
      minlength: [2, 'Nome sugerido deve ter ao menos 2 caracteres'],
      maxlength: [50, 'Nome sugerido deve ter no maximo 50 caracteres'],
    },

    // Tipo para o qual a tag deve ser criada.
    tipo: {
      type: String,
      enum: ['imagem', 'audio', 'texto'],
      required: [true, 'Tipo e obrigatorio'],
      index: true,
    },

    // Justificativa opcional para contexto da equipe de moderacao.
    justificativa: {
      type: String,
      trim: true,
      maxlength: [300, 'Justificativa deve ter no maximo 300 caracteres'],
      default: '',
    },

    // Estado da solicitacao para fluxo de aprovacao.
    status: {
      type: String,
      enum: ['pendente', 'aprovada', 'rejeitada'],
      default: 'pendente',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'solicitacoes_tag',
  }
);

// Evita spam de pedidos identicos simultaneos.
// Entrada: mesmo usuario+tipo+nome_sugerido com status pendente.
// Saida: unicidade de fila pendente por combinacao.
solicitacaoTagSchema.index(
  { solicitante_id: 1, tipo: 1, nome_sugerido: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pendente' } }
);

module.exports = solicitacaoTagSchema;
