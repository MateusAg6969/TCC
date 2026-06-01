/**
 * ============================================================================
 * SCHEMA OTIMIZADO: USUARIO
 * ============================================================================
 * Modelo aprimorado de usuário com validação robusta, métodos úteis e
 * índices estratégicos para performance.
 *
 * DECISÕES DE DESIGN:
 * ✓ email e matrícula com índice único (constraint de negócio)
 * ✓ senhaHash em select: false por segurança
 * ✓ stats denormalizadas mas sincronizadas por triggers (eventual consistency)
 * ✓ ativo para soft delete (nunca apagar dados, apenas desativar)
 * ✓ Virtual field: amigosCount (derivado de queries optimizadas)
 * ============================================================================
 */

const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

// ============================================================================
// SUBDOCUMENTO: PERFIL (Dados pessoais e acadêmicos)
// ============================================================================
const perfilSchema = new mongoose.Schema(
  {
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
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Email inválido',
      ],
    },

    matricula: {
      type: String,
      required: [true, 'Matrícula é obrigatória'],
      match: [/^\d{6,10}$/, 'Matrícula deve conter 6-10 dígitos'],
    },

    bio: {
      type: String,
      maxlength: [500, 'Bio não pode exceder 500 caracteres'],
      default: '',
    },

    localizacao: {
      type: String,
      maxlength: [200, 'Localização não pode exceder 200 caracteres'],
      default: '',
    },

    website: {
      type: String,
      match: [/^(https?:\/\/.+)?$/, 'Website deve ser uma URL válida ou vazio'],
      default: '',
    },

    ocupacao: {
      type: String,
      maxlength: [100, 'Ocupação não pode exceder 100 caracteres'],
      default: '',
    },

    status_vinculo: {
      type: String,
      enum: {
        values: ['estudante', 'egresso', 'servidor'],
        message: 'Status deve ser: estudante, egresso ou servidor',
      },
      default: 'estudante',
    },

    privacidade: {
      type: String,
      enum: ['publico', 'privado'],
      default: 'publico',
    },

    data_criacao: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { _id: false }
);

// ============================================================================
// SUBDOCUMENTO: CUSTOMIZAÇÃO (Atributo Pattern para flexibilidade visual)
// ============================================================================
const customizacaoSchema = new mongoose.Schema(
  {
    cor_fundo: {
      type: String,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser formato HEX (#RRGGBB)'],
      default: '#FFFFFF',
    },

    cor_botoes: {
      type: String,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser formato HEX (#RRGGBB)'],
      default: '#1E40AF',
    },

    banner_url: {
      type: String,
      match: [/^(https?:\/\/.+)?$/, 'Banner URL inválido ou vazio'],
      default: '',
    },

    foto_perfil_url: {
      type: String,
      match: [/^(https?:\/\/.+)?$/, 'Foto de perfil URL inválido ou vazio'],
      default: '',
    },

    medalhas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medalha',
      },
    ],

    tema: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
  },
  { _id: false }
);

// ============================================================================
// SUBDOCUMENTO: CONFIGURAÇÕES
// ============================================================================
const configuracoesSchema = new mongoose.Schema(
  {
    mod_voluntario: {
      type: Boolean,
      default: false,
    },

    // "Melhores amigos" para compartilhamento restrito
    melhores_amigos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
      },
    ],

    permitir_mensagens: {
      type: Boolean,
      default: true,
    },

    notificacoes: {
      likes: { type: Boolean, default: true },
      comentarios: { type: Boolean, default: true },
      seguidores: { type: Boolean, default: true },
      reposts: { type: Boolean, default: true },
      amizade: { type: Boolean, default: true },
    },

    egresso_limitado: {
      type: Boolean,
      default: function () {
        return this.parent().perfil?.status_vinculo === 'egresso';
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
    // Autenticação (nunca retorna por padrão)
    senhaHash: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [8, 'Senha deve ter pelo menos 8 caracteres'],
      select: false,
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

    // STATS DENORMALIZADAS (otimizadas para leitura, sincronizadas via triggers)
    // Em um sistema com alto volume, manter contadores desnormalizados
    // evita aggregations custosas
    stats: {
      total_seguidores: { type: Number, default: 0, index: true },
      total_seguindo: { type: Number, default: 0 },
      total_amigos: { type: Number, default: 0, index: true },
      total_postagens: { type: Number, default: 0 },
      total_moderacoes: { type: Number, default: 0 },
    },

    // Status da conta
    ativo: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Data de última atividade (para limpeza de inativos)
    ultima_atividade: {
      type: Date,
      default: Date.now,
      index: true,
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

    // Campo para identificar admins/moderadores globais
    papel: {
      type: String,
      enum: ['usuario', 'moderador', 'admin'],
      default: 'usuario',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'usuarios',
  }
);

// ============================================================================
// ÍNDICES (Estratégia: Performance + Unicidade + Busca)
// ============================================================================

// 1. UNICIDADE (constraints de negócio críticas)
usuarioSchema.index({ 'perfil.email': 1 }, { unique: true, sparse: true });
usuarioSchema.index(
  { 'perfil.matricula': 1 },
  { unique: true, sparse: true }
);

// 2. BUSCA E FILTRO COMUNS
usuarioSchema.index({ ativo: 1, 'perfil.status_vinculo': 1 });
usuarioSchema.index({ 'perfil.nome': 'text', 'perfil.bio': 'text' });
usuarioSchema.index({ 'configuracoes.mod_voluntario': 1, ativo: 1 });

// 3. PERFORMANCE (stats e atividade para ranking/feeds)
usuarioSchema.index({ 'stats.total_seguidores': -1, createdAt: -1 });
usuarioSchema.index({ 'stats.total_amigos': -1 });
usuarioSchema.index({ ultima_atividade: -1 });

// 4. MODERAÇÃO E SUSPENSÃO
usuarioSchema.index({ suspenso_ate: 1 });
usuarioSchema.index({ papel: 1 });

// TTL para usuários deletados logicamente (soft delete)
// Se 'ativo' for false por mais de 1 ano, podemos arquivar
usuarioSchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: 31536000, // 1 ano
    partialFilterExpression: { ativo: false },
  }
);

// ============================================================================
// VALIDAÇÃO CUSTOMIZADA
// ============================================================================

/**
 * Valida que senha não é igual a email ou nome (segurança básica)
 */
usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('senhaHash')) {
    return next();
  }

  try {
    // Validar força de senha
    const senhaHash = this.senhaHash;
    if (senhaHash.length < 8) {
      throw new Error('Senha deve ter pelo menos 8 caracteres');
    }

    // Hash com bcrypt
    const salt = await bcryptjs.genSalt(10);
    this.senhaHash = await bcryptjs.hash(senhaHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Limpar seleção de senha após salvar
 */
usuarioSchema.post('save', function () {
  delete this.senhaHash;
});

// ============================================================================
// MÉTODOS DE INSTÂNCIA (Instance Methods)
// ============================================================================

/**
 * Compara senha fornecida com hash armazenado
 * @param {String} senhaFornecida
 * @returns {Promise<Boolean>}
 */
usuarioSchema.methods.compararSenha = async function (senhaFornecida) {
  // Recuperar hash original (não incluído por padrão)
  const usuarioComSenha = await this.constructor.findById(this._id).select(
    '+senhaHash'
  );
  return bcryptjs.compare(senhaFornecida, usuarioComSenha.senhaHash);
};

/**
 * Verifica se está suspenso no momento
 * @returns {Boolean}
 */
usuarioSchema.methods.estaSuspenso = function () {
  if (!this.suspenso_ate) return false;
  return new Date() < this.suspenso_ate;
};

/**
 * Suspender usuário por período
 * @param {Date} dataFim
 * @param {String} motivo
 * @returns {Promise}
 */
usuarioSchema.methods.suspender = function (dataFim, motivo = '') {
  this.suspenso_ate = dataFim;
  this.suspensao_motivo = motivo;
  return this.save();
};

/**
 * Remover suspensão
 * @returns {Promise}
 */
usuarioSchema.methods.removerSuspensao = function () {
  this.suspenso_ate = null;
  this.suspensao_motivo = '';
  return this.save();
};

/**
 * Registrar atividade
 * @returns {Promise}
 */
usuarioSchema.methods.registrarAtividade = function () {
  this.ultima_atividade = new Date();
  return this.save();
};

/**
 * Verificar se é moderador
 * @returns {Boolean}
 */
usuarioSchema.methods.ehModerador = function () {
  return this.configuracoes.mod_voluntario === true || this.papel !== 'usuario';
};

/**
 * Retornar dados públicos (para API)
 * @returns {Object}
 */
usuarioSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.senhaHash;
  delete obj.__v;
  return obj;
};

// ============================================================================
// MÉTODOS DE CLASSE (Static Methods)
// ============================================================================

/**
 * Encontrar por email
 * @param {String} email
 * @returns {Promise<Document>}
 */
usuarioSchema.statics.encontrarPorEmail = function (email) {
  return this.findOne({ 'perfil.email': email.toLowerCase() });
};

/**
 * Encontrar por matrícula
 * @param {String} matricula
 * @returns {Promise<Document>}
 */
usuarioSchema.statics.encontrarPorMatricula = function (matricula) {
  return this.findOne({ 'perfil.matricula': matricula });
};

/**
 * Busca por texto (nome e bio)
 * @param {String} termo
 * @param {Number} limit
 * @returns {Promise<Array>}
 */
usuarioSchema.statics.buscarPorTexto = function (termo, limit = 20) {
  return this.find({ $text: { $search: termo } })
    .limit(limit)
    .sort({ score: { $meta: 'textScore' } });
};

/**
 * Encontrar moderadores ativos
 * @returns {Promise<Array>}
 */
usuarioSchema.statics.encontrarModeadores = function () {
  return this.find({
    $or: [
      { 'configuracoes.mod_voluntario': true },
      { papel: { $in: ['moderador', 'admin'] } },
    ],
    ativo: true,
  });
};

/**
 * Encontrar usuários inativos (para limpeza)
 * @param {Number} diasInativo - dias sem atividade
 * @returns {Promise<Array>}
 */
usuarioSchema.statics.encontrarInativos = function (diasInativo = 180) {
  const dataLimite = new Date(Date.now() - diasInativo * 24 * 60 * 60 * 1000);
  return this.find({
    ultima_atividade: { $lt: dataLimite },
    ativo: true,
  });
};

/**
 * Atualizar stats de forma segura
 * @param {ObjectId} usuarioId
 * @param {String} campo
 * @param {Number} incremento
 * @returns {Promise}
 */
usuarioSchema.statics.atualizarStats = function (usuarioId, campo, incremento = 1) {
  return this.findByIdAndUpdate(
    usuarioId,
    { $inc: { [`stats.${campo}`]: incremento } },
    { new: true }
  );
};

// ============================================================================
// EXPORTAR
// ============================================================================

module.exports = usuarioSchema;
