/**
 * ============================================================================
 * SCHEMA: CONEXÕES SOCIAIS
 * ============================================================================
 * Relações de amizade entre usuários (amigos, bloqueados, etc).
 */

const mongoose = require('mongoose');

const conexoesSchema = new mongoose.Schema(
  {
    // Referência ao usuário
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      unique: true,
    },

    // Amigos (conexões mútuas)
    amigos: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Usuario',
      default: [],
    },

    // Solicitações de amizade pendentes (recebidas)
    solicitacoes_recebidas: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Usuario',
      default: [],
    },

    // Solicitações de amizade enviadas
    solicitacoes_enviadas: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Usuario',
      default: [],
    },

    // Total de amigos (denormalizado)
    total_amigos: {
      type: Number,
      default: 0,
    },

    // Total de seguidores (denormalizado)
    total_seguidores: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'conexoes',
  }
);

// ============================================================================
// ÍNDICES
// ============================================================================

conexoesSchema.index({ usuario_id: 1 });
conexoesSchema.index({ amigos: 1 });

module.exports = conexoesSchema;
