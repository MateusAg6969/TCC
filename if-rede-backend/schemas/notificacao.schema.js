/**
 * ============================================================================
 * SCHEMA: NOTIFICACAO
 * ============================================================================
 * Modelo que representa notificações para usuários.
 * Inclui: likes, comentários, novos seguidores, e outras ações.
 * 
 * Padrões aplicados:
 * - TTL Index: notificações antigas são deletadas automaticamente após 30 dias
 */

const mongoose = require('mongoose');

const notificacaoSchema = new mongoose.Schema(
  {
    // Usuário que recebe a notificação
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'Usuario ID é obrigatório'],
      index: true,
    },

    // Usuário que gerou a ação
    ator_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'Ator ID é obrigatório'],
    },

    // Tipo de notificação
    tipo: {
      type: String,
      enum: ['like', 'comentario', 'seguidor', 'repost', 'tag', 'resposta'],
      required: [true, 'Tipo de notificação é obrigatório'],
    },

    // Descrição da ação
    mensagem: {
      type: String,
      required: [true, 'Mensagem é obrigatória'],
      maxlength: [200, 'Mensagem não pode exceder 200 caracteres'],
    },

    // Referência ao objeto relacionado (postagem, comentário, etc)
    objeto_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },

    // Tipo do objeto relacionado
    objeto_tipo: {
      type: String,
      enum: ['postagem', 'comentario', 'usuario'],
      required: false,
    },

    // Status de leitura
    lida: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Data de leitura
    data_leitura: {
      type: Date,
      required: false,
    },

    // TTL Index: expira em 30 dias
    criada_em: {
      type: Date,
      default: Date.now,
      expires: 2592000, // 30 dias em segundos
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Índice para buscar notificações não lidas rapidamente
notificacaoSchema.index({ usuario_id: 1, lida: 1 });

// Índice para ordenação por data
notificacaoSchema.index({ usuario_id: 1, criada_em: -1 });

// Métodos de instância
notificacaoSchema.methods.marcarComoLida = async function () {
  this.lida = true;
  this.data_leitura = new Date();
  return this.save();
};

notificacaoSchema.methods.marcarComoNaoLida = async function () {
  this.lida = false;
  this.data_leitura = null;
  return this.save();
};

// Método estático para contar não lidas
notificacaoSchema.statics.contarNaoLidas = function (usuario_id) {
  return this.countDocuments({ usuario_id, lida: false });
};

// Método estático para buscar notificações com população
notificacaoSchema.statics.buscarComDetalhes = function (usuario_id, limite = 20, pagina = 1) {
  const skip = (pagina - 1) * limite;
  return this.find({ usuario_id })
    .populate('ator_id', 'perfil.nome perfil.email')
    .sort({ criada_em: -1 })
    .limit(limite)
    .skip(skip)
    .exec();
};

module.exports = mongoose.model('Notificacao', notificacaoSchema);
