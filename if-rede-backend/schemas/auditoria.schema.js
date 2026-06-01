/**
 * ============================================================================
 * SCHEMA: AUDITORIA
 * ============================================================================
 * Registra todas as ações importantes do usuário para segurança e compliance.
 */

const mongoose = require('mongoose');

const auditoriaSchema = new mongoose.Schema(
  {
    // Referência ao usuário
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },

    // Ação realizada
    acao: {
      type: String,
      enum: [
        'login',
        'logout',
        'atualizacao-perfil',
        'alteracao-senha',
        'mudanca-privacidade',
        'seguir-usuario',
        'bloquear-usuario',
        'postagem-criada',
        'postagem-deletada',
      ],
      required: true,
    },

    // Endereço IP
    endereco_ip: String,

    // User Agent
    user_agent: String,

    // Campos que foram alterados
    campos_alterados: mongoose.Schema.Types.Mixed,

    // Descrição da ação
    descricao: String,

    // Status da ação
    status: {
      type: String,
      enum: ['sucesso', 'erro'],
      default: 'sucesso',
    },

    // Detalhes do erro (se houver)
    erro_mensagem: String,
  },
  {
    timestamps: true,
    collection: 'auditorias',
    // TTL: expirar após 90 dias
    expireAfterSeconds: 7776000,
  }
);

// ============================================================================
// ÍNDICES
// ============================================================================

auditoriaSchema.index({ usuario_id: 1, createdAt: -1 });
auditoriaSchema.index({ acao: 1 });
auditoriaSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = auditoriaSchema;
