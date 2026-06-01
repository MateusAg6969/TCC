/**
 * ============================================================================
 * SCHEMA: PREFERÊNCIAS
 * ============================================================================
 * Preferências personalizadas do usuário (tema, idioma, notificações).
 */

const mongoose = require('mongoose');

const preferenciasSchema = new mongoose.Schema(
  {
    // Referência ao usuário
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      unique: true,
    },

    // Tema preferido
    tema_preferido: {
      type: String,
      enum: ['claro', 'escuro', 'auto'],
      default: 'auto',
    },

    // Idioma
    idioma: {
      type: String,
      default: 'pt-BR',
    },

    // Tamanho da fonte
    tamanho_fonte: {
      type: Number,
      default: 1,
      min: 0.8,
      max: 1.5,
    },

    // Notificações
    notificacoes_email: {
      novo_mensagem: { type: Boolean, default: true },
      novo_comentario: { type: Boolean, default: true },
      nova_conexao: { type: Boolean, default: true },
      resumo_semanal: { type: Boolean, default: false },
    },

    // Timeout de sessão em minutos
    session_timeout: {
      type: Number,
      default: 30,
    },

    // Permitir analytics
    permitir_analytics: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'preferencias',
  }
);

// ============================================================================
// ÍNDICES
// ============================================================================

preferenciasSchema.index({ usuario_id: 1 });

module.exports = preferenciasSchema;
