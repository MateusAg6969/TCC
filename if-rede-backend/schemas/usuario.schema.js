/**
 * ============================================================================
 * SCHEMA: USUARIO
 * ============================================================================
 * Modelo que representa um usuário na rede social IF REDE.
 * Inclui campos de autenticação, perfil, customização visual e configurações.
 * 
 * Padrões aplicados:
 * - Atributo Pattern: campos de estilização dinâmica (cor_fundo, cor_botoes)
 * - TTL para dados temporários (se aplicável)
 */

const mongoose = require('mongoose');

// ============================================================================
// SUBDOCUMENTO: PERFIL
// ============================================================================
// Contém informações básicas e vinculação acadêmica do usuário.
const perfilSchema = new mongoose.Schema(
  {
    // Identificação pessoal
    nome: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
      minlength: [3, 'Nome deve ter pelo menos 3 caracteres'],
      maxlength: [100, 'Nome não pode exceder 100 caracteres'],
    },

    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor, insira um email válido',
      ],
    },

    // Vínculo institucional (IF REDE)
    matricula: {
      type: String,
      required: [true, 'Matrícula é obrigatória'],
      unique: true,
      match: [/^\d{6,10}$/, 'Matrícula inválida (use apenas números)'],
    },

    // Informações do perfil
    bio: {
      type: String,
      maxlength: [500, 'Bio não pode exceder 500 caracteres'],
      default: '',
    },

    // Tipo de vínculo (essencial para regras de acesso e moderação)
    status_vinculo: {
      type: String,
      enum: {
        values: ['estudante', 'egresso', 'servidor'],
        message: 'Status de vínculo deve ser: estudante, egresso ou servidor',
      },
      default: 'estudante',
      required: true,
    },

    // Configuração de privacidade
    privacidade: {
      type: String,
      enum: {
        values: ['publico', 'privado'],
        message: 'Privacidade deve ser: publico ou privado',
      },
      default: 'publico',
    },

    // Data de entrada no IF REDE
    data_criacao: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { _id: false } // Não precisa ID próprio, é subdocumento
);

// ============================================================================
// SUBDOCUMENTO: CUSTOMIZAÇÃO (Atributo Pattern)
// ============================================================================
// Permite que cada usuário personalize a aparência do seu perfil.
// Cores em formato HEX, medalhas como array de IDs.
const customizacaoSchema = new mongoose.Schema(
  {
    // Cores do perfil (padrão: azul e branco do IFC)
    cor_fundo: {
      type: String,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Cor de fundo deve ser em formato HEX (#RRGGBB)'],
      default: '#FFFFFF',
    },

    cor_botoes: {
      type: String,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Cor de botões deve ser em formato HEX (#RRGGBB)'],
      default: '#1E40AF',
    },

    // Personalização adicional
    banner_url: {
      type: String,
      match: [
        /^https?:\/\/.+/,
        'Banner URL deve ser uma URL válida (http ou https)',
      ],
      default: '',
    },

    // Medalhas conquistadas (referências a IDs de medalhas)
    medalhas: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Medalha',
      default: [],
    },

    // Tema: light ou dark (futuro)
    tema: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
  },
  { _id: false }
);

// ============================================================================
// SUBDOCUMENTO: CONFIGURAÇÕES DE CONTA
// ============================================================================
// Opções de moderação voluntária e privacidade social.
const configuracoesSchema = new mongoose.Schema(
  {
    // Moderador voluntário (IFC)
    mod_voluntario: {
      type: Boolean,
      default: false,
    },

    // Lista de "melhores amigos" para compartilhamento restrito
    melhores_amigos: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Usuario',
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 20; // Máximo de 20 melhores amigos
        },
        message: 'Máximo de 20 melhores amigos permitido',
      },
    },

    // Permitir receber mensagens diretas
    permitir_mensagens: {
      type: Boolean,
      default: true,
    },

    // Notificações
    notificacoes: {
      likes: { type: Boolean, default: true },
      comentarios: { type: Boolean, default: true },
      seguidores: { type: Boolean, default: true },
      reposts: { type: Boolean, default: true },
    },

    // Se verdadeiro, egressos têm limite de 2 postagens por semana
    egresso_limitado: {
      type: Boolean,
      default: function () {
        return this.perfil?.status_vinculo === 'egresso';
      },
    },
  },
  { _id: false }
);

// ============================================================================
// SCHEMA PRINCIPAL: USUARIO
// ============================================================================
const usuarioSchema = new mongoose.Schema(
  {
    // Autenticação
    senha: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [8, 'Senha deve ter pelo menos 8 caracteres'],
      select: false, // Não retorna por padrão (segurança)
    },

    // Subdocumentos
    perfil: {
      type: perfilSchema,
      required: true,
    },

    customizacao: {
      type: customizacaoSchema,
      default: {},
    },

    configuracoes: {
      type: configuracoesSchema,
      default: {},
    },

    // Estatísticas sociais (denormalizadas para performance)
    stats: {
      total_seguidores: { type: Number, default: 0 },
      total_seguindo: { type: Number, default: 0 },
      total_postagens: { type: Number, default: 0 },
      total_moderacoes: { type: Number, default: 0 }, // Apenas se mod_voluntario: true
    },

    // Status da conta
    ativo: {
      type: Boolean,
      default: true,
    },

    // Data de última atividade
    ultima_atividade: {
      type: Date,
      default: Date.now,
    },

    // Suspensão temporária por moderação
    suspenso_ate: {
      type: Date,
      default: null,
    },

    suspensao_motivo: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    collection: 'usuarios',
  }
);

// ============================================================================
// ÍNDICES (para performance e regras de negócio)
// ============================================================================

// Email único (já definido no schema, mas aqui deixamos explícito)
usuarioSchema.index({ 'perfil.email': 1 }, { unique: true });

// Matrícula única
usuarioSchema.index({ 'perfil.matricula': 1 }, { unique: true });

// Busca por nome (texto)
usuarioSchema.index({ 'perfil.nome': 'text' });

// Busca por status de vínculo (importante para moderação e limites)
usuarioSchema.index({ 'perfil.status_vinculo': 1 });

// Busca por moderadores voluntários
usuarioSchema.index({ 'configuracoes.mod_voluntario': 1 });

// Busca por usuários ativos e suspensos
usuarioSchema.index({ ativo: 1, suspenso_ate: 1 });

// ============================================================================
// MÉTODOS ÚTEIS
// ============================================================================

/**
 * Verifica se o usuário está suspenso no momento
 * @returns {Boolean}
 */
usuarioSchema.methods.estaSuspenso = function () {
  if (!this.suspenso_ate) return false;
  return new Date() < this.suspenso_ate;
};

/**
 * Verifica se o usuário é moderador voluntário
 * @returns {Boolean}
 */
usuarioSchema.methods.ehModerador = function () {
  return this.configuracoes.mod_voluntario === true;
};

/**
 * Verifica se é egresso (com limitações)
 * @returns {Boolean}
 */
usuarioSchema.methods.ehEgresso = function () {
  return this.perfil.status_vinculo === 'egresso';
};

/**
 * Aplica suspensão temporária
 * @param {Date} dataFim - Até quando suspender
 * @param {String} motivo - Razão da suspensão
 */
usuarioSchema.methods.suspender = function (dataFim, motivo = '') {
  this.suspenso_ate = dataFim;
  this.suspensao_motivo = motivo;
  return this.save();
};

/**
 * Remove suspensão
 */
usuarioSchema.methods.removerSuspensao = function () {
  this.suspenso_ate = null;
  this.suspensao_motivo = '';
  return this.save();
};

/**
 * Atualiza última atividade
 */
usuarioSchema.methods.registrarAtividade = function () {
  this.ultima_atividade = new Date();
  return this.save();
};

// ============================================================================
// STATICS (Métodos de classe)
// ============================================================================

/**
 * Encontra moderadores voluntários
 */
usuarioSchema.statics.encontrarModeadores = function () {
  return this.find({ 'configuracoes.mod_voluntario': true, ativo: true });
};

/**
 * Encontra egressos
 */
usuarioSchema.statics.encontrarEgressos = function () {
  return this.find({ 'perfil.status_vinculo': 'egresso' });
};

/**
 * Busca por texto (nome ou bio)
 */
usuarioSchema.statics.buscarPorTexto = function (termo) {
  return this.find({ $text: { $search: termo } });
};

// ============================================================================
// EXPORTAR
// ============================================================================

module.exports = usuarioSchema;
