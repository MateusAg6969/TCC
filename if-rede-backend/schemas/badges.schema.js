/**
 * ============================================================================
 * SCHEMA: BADGES E REALIZAÇÕES
 * ============================================================================
 * Badges, pontos e nível do usuário baseado em atividades.
 */

const mongoose = require('mongoose');

const badgesSchema = new mongoose.Schema(
  {
    // Referência ao usuário
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      unique: true,
    },

    // Lista de badges conquistadas
    badges: [
      {
        badge_id: {
          type: String,
          enum: [
            'primeira-postagem',
            '100-seguidores',
            '1000-seguidores',
            'verificado',
            'membro-premium',
            'moderador',
            'contribuidor-ativo',
            'pioneiro',
          ],
        },
        nome_badge: String,
        descricao: String,
        icone: String, // URL da imagem
        data_concedida: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Pontos totais
    pontos: {
      type: Number,
      default: 0,
    },

    // Nível do usuário (baseado em pontos)
    nivel_usuario: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },

    // Histórico de atividades (denormalizado)
    total_posts: {
      type: Number,
      default: 0,
    },

    total_comentarios: {
      type: Number,
      default: 0,
    },

    total_likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'badges',
  }
);

// ============================================================================
// ÍNDICES
// ============================================================================

badgesSchema.index({ usuario_id: 1 });
badgesSchema.index({ pontos: -1 }); // Para ranking
badgesSchema.index({ nivel_usuario: -1 });

module.exports = badgesSchema;
