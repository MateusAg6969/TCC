/**
 * ============================================================================
 * SCHEMA OTIMIZADO: AMIZADE
 * ============================================================================
 * Modelo dedicado para relações de amizade com suporte a solicitações.
 * Substitui a abordagem de arrays desnormalizados por coleção própria.
 *
 * VANTAGENS DESTE DESIGN:
 * ✓ Histórico completo de solicitações (pendente/aceito/recusado)
 * ✓ Índices compostos para queries rápidas
 * ✓ Evita operações complexas de array ($push, $pull, $unwind)
 * ✓ Melhor escalabilidade em sistemas com muitos amigos por usuário
 * ✓ Validação de integridade no nível do documento
 *
 * ESTRUTURA:
 * - usuarioId: Quem recebeu a solicitação (se pendente) ou um dos amigos
 * - amigoId: Quem enviou a solicitação (se pendente) ou o outro amigo
 * - status: 'pendente' | 'aceito' | 'recusado'
 * - dataSolicitacao: Quando foi enviado
 * - dataResposta: Quando foi respondido
 * ============================================================================
 */

const mongoose = require('mongoose');

// ============================================================================
// SCHEMA PRINCIPAL: AMIZADE
// ============================================================================
const amizadeSchema = new mongoose.Schema(
  {
    // Referência ao usuário (recebedor da solicitação ou um dos amigos)
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'usuarioId é obrigatório'],
      index: true,
    },

    // Referência ao amigo (enviador da solicitação ou outro amigo)
    amigoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'amigoId é obrigatório'],
      index: true,
    },

    // Status da relação
    status: {
      type: String,
      enum: {
        values: ['pendente', 'aceito', 'recusado'],
        message:
          "Status deve ser 'pendente', 'aceito' ou 'recusado'",
      },
      default: 'pendente',
      index: true,
    },

    // Data de envio da solicitação
    dataSolicitacao: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    // Data de resposta (quando foi aceito ou recusado)
    dataResposta: {
      type: Date,
      default: null,
    },

    // Motivo da recusa (opcional, para feedback)
    motivoRecusa: {
      type: String,
      maxlength: [200, 'Motivo não pode exceder 200 caracteres'],
      default: '',
    },

    // Campo para suportar "melhor amigo" ou similar
    tipo_relacao: {
      type: String,
      enum: {
        values: ['amigo_comum', 'melhor_amigo', 'colega'],
        message: "Tipo deve ser 'amigo_comum', 'melhor_amigo' ou 'colega'",
      },
      default: 'amigo_comum',
    },
  },
  {
    timestamps: true,
    collection: 'amizades',
  }
);

// ============================================================================
// VALIDAÇÕES CUSTOMIZADAS
// ============================================================================

/**
 * Evitar auto-amizade (usuarioId === amigoId)
 */
amizadeSchema.pre('save', function (next) {
  if (this.usuarioId.toString() === this.amigoId.toString()) {
    return next(new Error('Um usuário não pode ser amigo de si mesmo'));
  }
  next();
});

/**
 * Garantir que dataResposta seja definida quando status mudar para aceito/recusado
 */
amizadeSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status !== 'pendente' && !this.dataResposta) {
      this.dataResposta = new Date();
    }
  }
  next();
});

// ============================================================================
// ÍNDICES (Estratégia: Queries + Performance + Integridade)
// ============================================================================

/**
 * ÍNDICE 1: Composto ÚNICO para evitar duplicatas por direção
 * Exemplo: um único documento para {usuarioId: B, amigoId: A}
 */
amizadeSchema.index(
  { usuarioId: 1, amigoId: 1 },
  {
    unique: true,
    name: 'idx_relacao_unica',
  }
);

/**
 * ÍNDICE 2: Para listar amigos de um usuário (aceitos)
 * Query: db.amizades.find({usuarioId: X, status: "aceito"})
 */
amizadeSchema.index(
  { usuarioId: 1, status: 1 },
  {
    name: 'idx_lista_amigos',
  }
);

/**
 * ÍNDICE 3: Para consultas inversas esporádicas
 * Query: db.amizades.find({amigoId: X})
 */
amizadeSchema.index(
  { amigoId: 1 },
  {
    name: 'idx_consulta_inversa',
  }
);

// ============================================================================
// MÉTODOS DE INSTÂNCIA
// ============================================================================

/**
 * Aceitar solicitação de amizade
 * @returns {Promise}
 */
amizadeSchema.methods.aceitar = function () {
  if (this.status !== 'pendente') {
    throw new Error(
      'Apenas solicitações pendentes podem ser aceitas'
    );
  }
  this.status = 'aceito';
  this.dataResposta = new Date();
  return this.save();
};

/**
 * Recusar solicitação de amizade
 * @param {String} motivo - Opcional
 * @returns {Promise}
 */
amizadeSchema.methods.recusar = function (motivo = '') {
  if (this.status !== 'pendente') {
    throw new Error('Apenas solicitações pendentes podem ser recusadas');
  }
  this.status = 'recusado';
  this.motivoRecusa = motivo;
  this.dataResposta = new Date();
  return this.save();
};

/**
 * Desfazer amizade (set como recusado)
 * @returns {Promise}
 */
amizadeSchema.methods.desfazer = function () {
  if (this.status !== 'aceito') {
    throw new Error('Apenas amizades aceitas podem ser desfeitas');
  }
  this.status = 'recusado';
  this.motivoRecusa = 'Desfazer amizade';
  this.dataResposta = new Date();
  return this.save();
};

/**
 * Retornar dados públicos
 * @returns {Object}
 */
amizadeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// ============================================================================
// MÉTODOS DE CLASSE (STATIC)
// ============================================================================

/**
 * Verificar se dois usuários são amigos
 * @param {ObjectId} usuarioIdA
 * @param {ObjectId} usuarioIdB
 * @returns {Promise<Boolean>}
 */
amizadeSchema.statics.saoAmigos = async function (usuarioIdA, usuarioIdB) {
  const resultado = await this.findOne({
    $or: [
      { usuarioId: usuarioIdA, amigoId: usuarioIdB, status: 'aceito' },
      { usuarioId: usuarioIdB, amigoId: usuarioIdA, status: 'aceito' },
    ],
  });
  return !!resultado;
};

/**
 * Listar amigos de um usuário
 * @param {ObjectId} usuarioId
 * @param {Object} opcoes - { skip, limit, populate }
 * @returns {Promise<Array>}
 */
amizadeSchema.statics.listarAmigos = function (
  usuarioId,
  opcoes = { skip: 0, limit: 20 }
) {
  return this.find({
    usuarioId,
    status: 'aceito',
  })
    .populate('amigoId', 'perfil stats') // Retorna dados essenciais do amigo
    .sort({ dataSolicitacao: -1 })
    .skip(opcoes.skip)
    .limit(opcoes.limit);
};

/**
 * Contar amigos de um usuário
 * @param {ObjectId} usuarioId
 * @returns {Promise<Number>}
 */
amizadeSchema.statics.contarAmigos = function (usuarioId) {
  return this.countDocuments({
    usuarioId,
    status: 'aceito',
  });
};

/**
 * Listar solicitações pendentes recebidas
 * @param {ObjectId} usuarioId
 * @param {Object} opcoes
 * @returns {Promise<Array>}
 */
amizadeSchema.statics.listarSolicitacoesRecebidas = function (
  usuarioId,
  opcoes = { skip: 0, limit: 20 }
) {
  return this.find({
    usuarioId,
    status: 'pendente',
  })
    .populate('amigoId', 'perfil stats')
    .sort({ dataSolicitacao: -1 })
    .skip(opcoes.skip)
    .limit(opcoes.limit);
};

/**
 * Listar solicitações pendentes enviadas
 * @param {ObjectId} usuarioId
 * @param {Object} opcoes
 * @returns {Promise<Array>}
 */
amizadeSchema.statics.listarSolicitacoesEnviadas = function (
  usuarioId,
  opcoes = { skip: 0, limit: 20 }
) {
  return this.find({
    amigoId: usuarioId,
    status: 'pendente',
  })
    .populate('usuarioId', 'perfil stats')
    .sort({ dataSolicitacao: -1 })
    .skip(opcoes.skip)
    .limit(opcoes.limit);
};

/**
 * Enviar solicitação de amizade
 * Criar novo documento automaticamente
 * @param {ObjectId} usuarioId - Quem recebeu
 * @param {ObjectId} amigoId - Quem enviou
 * @returns {Promise<Document>}
 */
amizadeSchema.statics.enviarSolicitacao = async function (usuarioId, amigoId) {
  // Validar: não pode ser auto-solicitação
  if (usuarioId.toString() === amigoId.toString()) {
    throw new Error('Não é possível enviar solicitação para si mesmo');
  }

  // Verificar se já existe relação
  const jaExiste = await this.findOne({
    $or: [
      { usuarioId, amigoId, status: { $in: ['pendente', 'aceito'] } },
      { usuarioId: amigoId, amigoId: usuarioId, status: { $in: ['pendente', 'aceito'] } },
    ],
  });

  if (jaExiste) {
    throw new Error('Já existe uma relação de amizade ou solicitação entre estes usuários');
  }

  // Criar nova solicitação
  const amizade = new this({
    usuarioId,
    amigoId,
    status: 'pendente',
  });

  return amizade.save();
};

/**
 * Cancelar solicitação pendente
 * @param {ObjectId} usuarioId - Quem receberia
 * @param {ObjectId} amigoId - Quem enviou
 * @returns {Promise}
 */
amizadeSchema.statics.cancelarSolicitacao = function (usuarioId, amigoId) {
  return this.findOneAndDelete({
    usuarioId,
    amigoId,
    status: 'pendente',
  });
};

/**
 * Obter status da relação entre dois usuários
 * @param {ObjectId} usuarioIdA
 * @param {ObjectId} usuarioIdB
 * @returns {Promise<String|null>} 'pendente', 'aceito', 'recusado' ou null
 */
amizadeSchema.statics.obterStatusRelacao = async function (usuarioIdA, usuarioIdB) {
  const resultado = await this.findOne({
    $or: [
      { usuarioId: usuarioIdA, amigoId: usuarioIdB },
      { usuarioId: usuarioIdB, amigoId: usuarioIdA },
    ],
  });
  return resultado ? resultado.status : null;
};

// ============================================================================
// AGREGAÇÕES ÚTEIS
// ============================================================================

/**
 * Pipeline para listar amigos com stats
 * @param {ObjectId} usuarioId
 * @returns {Array} Pipeline para agregação
 */
amizadeSchema.statics.pipelineListarAmigosComStats = function (usuarioId) {
  return [
    {
      $match: {
        usuarioId: new mongoose.Types.ObjectId(usuarioId),
        status: 'aceito',
      },
    },
    {
      $lookup: {
        from: 'usuarios',
        localField: 'amigoId',
        foreignField: '_id',
        as: 'amigo',
      },
    },
    {
      $unwind: '$amigo',
    },
    {
      $project: {
        _id: 1,
        amigoId: 1,
        dataSolicitacao: 1,
        'amigo._id': 1,
        'amigo.perfil': 1,
        'amigo.stats': 1,
        'amigo.customizacao.foto_perfil_url': 1,
      },
    },
    {
      $sort: { dataSolicitacao: -1 },
    },
  ];
};

/**
 * Encontrar amigos em comum entre dois usuários
 * Útil para sugestões de amizade
 * @param {ObjectId} usuarioIdA
 * @param {ObjectId} usuarioIdB
 * @returns {Array} Pipeline para agregação
 */
amizadeSchema.statics.pipelineAmigosEmComum = function (usuarioIdA, usuarioIdB) {
  return [
    // Obter amigos do usuário A
    {
      $match: {
        $or: [
          { usuarioId: new mongoose.Types.ObjectId(usuarioIdA), status: 'aceito' },
          { amigoId: new mongoose.Types.ObjectId(usuarioIdA), status: 'aceito' },
        ],
      },
    },
    {
      $addFields: {
        amigo: {
          $cond: [
            { $eq: ['$usuarioId', new mongoose.Types.ObjectId(usuarioIdA)] },
            '$amigoId',
            '$usuarioId',
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        amigosA: { $push: '$amigo' },
      },
    },
    // Cruzar com amigos do usuário B
    {
      $lookup: {
        from: 'amizades',
        let: { amigosA: '$amigosA' },
        pipeline: [
          {
            $match: {
              $or: [
                {
                  usuarioId: new mongoose.Types.ObjectId(usuarioIdB),
                  status: 'aceito',
                },
                {
                  amigoId: new mongoose.Types.ObjectId(usuarioIdB),
                  status: 'aceito',
                },
              ],
            },
          },
          {
            $addFields: {
              amigo: {
                $cond: [
                  { $eq: ['$usuarioId', new mongoose.Types.ObjectId(usuarioIdB)] },
                  '$amigoId',
                  '$usuarioId',
                ],
              },
            },
          },
          {
            $match: {
              amigo: { $in: '$$amigosA' },
            },
          },
        ],
        as: 'amigosEmComum',
      },
    },
    {
      $project: {
        _id: 0,
        amigosEmComum: '$amigosEmComum.amigo',
        total: { $size: '$amigosEmComum' },
      },
    },
  ];
};

// ============================================================================
// EXPORTAR
// ============================================================================

module.exports = amizadeSchema;
