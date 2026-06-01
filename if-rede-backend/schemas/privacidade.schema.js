/**
 * ============================================================================
 * SCHEMA: PRIVACIDADE
 * ============================================================================
 * Configurações de privacidade detalhadas para cada usuário.
 * Define quem pode fazer o quê no perfil do usuário.
 */

const mongoose = require('mongoose');

const privacidadeSchema = new mongoose.Schema(
  {
    // Referência ao usuário
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      unique: true,
    },

    // Perfil público ou privado
    perfil_publico: {
      type: Boolean,
      default: true,
    },

    // Quem pode enviar mensagens
    quem_pode_mensagear: {
      type: String,
      enum: ['todos', 'amigos', 'ninguem'],
      default: 'todos',
    },

    // Quem pode comentar posts
    quem_pode_comentar_posts: {
      type: String,
      enum: ['todos', 'amigos', 'ninguem'],
      default: 'todos',
    },

    // Mostrar email publicamente
    mostrar_email_publicamente: {
      type: Boolean,
      default: false,
    },

    // Mostrar localização
    mostrar_localizacao: {
      type: Boolean,
      default: false,
    },

    // Mostrar data de nascimento
    mostrar_data_nascimento: {
      type: Boolean,
      default: false,
    },

    // Mostrar último login
    mostrar_ultimo_login: {
      type: Boolean,
      default: false,
    },

    // Permitir indexação em buscadores
    permitir_indexar_buscador: {
      type: Boolean,
      default: true,
    },

    // Bloqueados
    bloqueados: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Usuario',
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'privacidades',
  }
);

// ============================================================================
// ÍNDICES
// ============================================================================

privacidadeSchema.index({ usuario_id: 1 });

module.exports = privacidadeSchema;
