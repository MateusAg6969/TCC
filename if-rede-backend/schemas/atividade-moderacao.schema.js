/**
 * ============================================================================
 * SCHEMA: ATIVIDADE MODERAÇÃO
 * ============================================================================
 * Modelo que registra todas as ações dos moderadores voluntários no IF REDE.
 * Essencial para:
 * - Cálculo de horas complementares
 * - Auditoria de moderação
 * - Relatórios para o IFC
 * 
 * Padrões aplicados:
 * - Bucket Pattern: Agregação de dados para cálculos de horas
 * - Imutabilidade: Registros de auditoria não podem ser alterados
 */

const mongoose = require('mongoose');

// ============================================================================
// SCHEMA PRINCIPAL: ATIVIDADE MODERACAO
// ============================================================================
const atividadeModeracaoSchema = new mongoose.Schema(
  {
    // ========================================================================
    // INFORMAÇÕES DO MODERADOR
    // ========================================================================
    
    // ID do moderador voluntário
    moderador_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'ID do moderador é obrigatório'],
      immutable: true, // Não pode ser alterado
    },

    // Snapshot do nome do moderador (para relatórios)
    moderador_nome: {
      type: String,
      required: true,
      immutable: true,
    },

    // Snapshot da matrícula (para rastreabilidade)
    moderador_matricula: {
      type: String,
      required: true,
      immutable: true,
    },

    // ========================================================================
    // INFORMAÇÕES DA AÇÃO
    // ========================================================================

    // Tipo de ação realizada
    tipo_acao: {
      type: String,
      enum: {
        values: [
          'comentario_aprovado', // Aprovou comentário pendente
          'comentario_rejeitado', // Rejeitou comentário
          'postagem_aprovada', // Aprovou postagem pendente
          'postagem_rejeitada', // Rejeitou postagem
          'postagem_bloqueada', // Bloqueou postagem existente
          'usuario_suspenso', // Suspendeu usuário
          'usuario_remover_suspensao', // Removeu suspensão
          'filtro_palavras_acionado', // Acionou filtro de palavras proibidas
          'conteudo_sensivel_marcado', // Marcou conteúdo como sensível
          'investigacao_aberta', // Abriu investigação sobre denúncia
          'investigacao_fechada', // Fechou investigação
        ],
        message: 'Tipo de ação não reconhecido',
      },
      required: [true, 'Tipo de ação é obrigatório'],
      immutable: true,
    },

    // Descrição mais detalhada da ação
    descricao: {
      type: String,
      maxlength: [500, 'Descrição não pode exceder 500 caracteres'],
      default: '',
      immutable: true,
    },

    // ========================================================================
    // OBJETO AFETADO (POST, COMENTÁRIO, USUÁRIO)
    // ========================================================================

    // Tipo de objeto que foi moderado
    objeto_tipo: {
      type: String,
      enum: {
        values: ['postagem', 'comentario', 'usuario'],
        message: 'Tipo de objeto deve ser: postagem, comentario ou usuario',
      },
      required: [true, 'Tipo de objeto é obrigatório'],
      immutable: true,
    },

    // ID do objeto (postagem_id, comentario_id ou usuario_id)
    objeto_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'ID do objeto é obrigatório'],
      immutable: true,
    },

    // Snapshot do conteúdo afetado (para auditoria)
    objeto_snapshot: {
      type: mongoose.Schema.Types.Mixed,
      immutable: true,
    },

    // ========================================================================
    // CÁLCULO DE HORAS COMPLEMENTARES
    // ========================================================================

    // Tempo estimado para executar a ação (em minutos)
    tempo_estimado_minutos: {
      type: Number,
      required: [true, 'Tempo estimado é obrigatório'],
      min: [1, 'Tempo mínimo é 1 minuto'],
      max: [120, 'Tempo máximo é 120 minutos'],
      default: function () {
        // Padrão por tipo de ação
        const tempos = {
          comentario_aprovado: 2,
          comentario_rejeitado: 3,
          postagem_aprovada: 5,
          postagem_rejeitada: 8,
          postagem_bloqueada: 10,
          usuario_suspenso: 15,
          usuario_remover_suspensao: 5,
          filtro_palavras_acionado: 3,
          conteudo_sensivel_marcado: 2,
          investigacao_aberta: 20,
          investigacao_fechada: 15,
        };
        return tempos[this.tipo_acao] || 5;
      },
      immutable: true,
    },

    // Horas convertidas (minutos / 60)
    horas: {
      type: Number,
      get: function () {
        return Number((this.tempo_estimado_minutos / 60).toFixed(2));
      },
    },

    // ========================================================================
    // METADADOS E CONTEXTO
    // ========================================================================

    // Se houve resultado, qual foi
    resultado: {
      type: String,
      enum: {
        values: ['sucesso', 'parcial', 'erro', 'sem_acao'],
        message: 'Resultado deve ser: sucesso, parcial, erro ou sem_acao',
      },
      default: 'sucesso',
      immutable: true,
    },

    // Motivo da rejeição/bloqueio (se aplicável)
    motivo_rejeicao: {
      type: String,
      maxlength: [300, 'Motivo não pode exceder 300 caracteres'],
      default: '',
      immutable: true,
    },

    // Tags para categorizar ações
    tags: {
      type: [String],
      enum: {
        values: [
          'spam',
          'linguagem-inapropriada',
          'discurso-odio',
          'direitos-autorais',
          'conteudo-sensivel',
          'assedio',
          'falsa-informacao',
          'qualidade_conteudo',
          'outro',
        ],
      },
      default: [],
      immutable: true,
    },

    // ========================================================================
    // AUDITORIA
    // ========================================================================

    // Data/hora da ação
    data_acao: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    // IP do moderador (opcional, para auditoria de segurança)
    ip_origem: {
      type: String,
      immutable: true,
    },

    // User agent (navegador/cliente)
    user_agent: {
      type: String,
      immutable: true,
    },

    // ========================================================================
    // REVISÃO E ESCALAÇÃO
    // ========================================================================

    // Se a ação foi revisada por outro moderador
    revisado: {
      type: Boolean,
      default: false,
    },

    // ID do moderador que revisou
    revisado_por: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
    },

    // Resultado da revisão
    resultado_revisao: {
      type: String,
      enum: {
        values: ['confirmado', 'revertido', 'escalado'],
        message: 'Resultado deve ser: confirmado, revertido ou escalado',
      },
      default: null,
    },

    // Comentário da revisão
    comentario_revisao: {
      type: String,
      maxlength: [500, 'Comentário não pode exceder 500 caracteres'],
      default: '',
    },
  },
  {
    timestamps: false, // Não queremos updatedAt aqui (é um log imutável)
    collection: 'atividades_moderacao',
  }
);

// ============================================================================
// ÍNDICES (para performance de queries de relatórios)
// ============================================================================

// Busca por moderador (para gerar relatório de horas)
atividadeModeracaoSchema.index({ moderador_id: 1, data_acao: -1 });

// Busca por período (para cálculo de horas em um intervalo)
atividadeModeracaoSchema.index({ data_acao: -1 });

// Busca por tipo de ação
atividadeModeracaoSchema.index({ tipo_acao: 1 });

// Busca por objeto afetado (rastrear ações sobre um post/usuário)
atividadeModeracaoSchema.index({ objeto_id: 1, objeto_tipo: 1 });

// Busca por ações que precisam revisão
atividadeModeracaoSchema.index({ revisado: 1, resultado_revisao: 1 });

// Busca por resultado
atividadeModeracaoSchema.index({ resultado: 1 });

// Busca por tags
atividadeModeracaoSchema.index({ tags: 1 });

// ============================================================================
// MÉTODOS ÚTEIS
// ============================================================================

/**
 * Marca a ação como revisada
 */
atividadeModeracaoSchema.methods.marcar_como_revisada = function (
  revisadoPor,
  resultado,
  comentario = ''
) {
  this.revisado = true;
  this.revisado_por = revisadoPor;
  this.resultado_revisao = resultado;
  this.comentario_revisao = comentario;
  return this.save();
};

/**
 * Converter minutos para formato HH:MM
 */
atividadeModeracaoSchema.methods.tempo_formatado = function () {
  const horas = Math.floor(this.tempo_estimado_minutos / 60);
  const minutos = this.tempo_estimado_minutos % 60;
  return `${horas}h${minutos}m`;
};

// ============================================================================
// STATICS (Métodos de classe)
// ============================================================================

/**
 * Calcula total de horas de um moderador em um período
 */
atividadeModeracaoSchema.statics.calcular_horas_moderador = function (
  moderadorId,
  dataInicio,
  dataFim
) {
  return this.aggregate([
    {
      $match: {
        moderador_id: new mongoose.Types.ObjectId(moderadorId),
        data_acao: {
          $gte: dataInicio,
          $lte: dataFim,
        },
      },
    },
    {
      $group: {
        _id: '$moderador_id',
        total_minutos: { $sum: '$tempo_estimado_minutos' },
        total_acoes: { $sum: 1 },
      },
    },
  ]);
};

/**
 * Relatório de horas por moderador (último mês)
 */
atividadeModeracaoSchema.statics.relatorio_horas_mes = function () {
  const agora = new Date();
  const mes_passado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);

  return this.aggregate([
    {
      $match: {
        data_acao: {
          $gte: mes_passado,
          $lte: agora,
        },
      },
    },
    {
      $group: {
        _id: '$moderador_id',
        moderador_nome: { $first: '$moderador_nome' },
        total_minutos: { $sum: '$tempo_estimado_minutos' },
        total_acoes: { $sum: 1 },
        acoes_por_tipo: {
          $push: {
            tipo: '$tipo_acao',
            count: 1,
          },
        },
      },
    },
    {
      $sort: { total_minutos: -1 },
    },
  ]);
};

/**
 * Ações que precisam revisão
 */
atividadeModeracaoSchema.statics.pendentes_revisao = function () {
  return this.find({ revisado: false }).sort({ data_acao: 1 });
};

/**
 * Histórico de ações sobre um objeto específico
 */
atividadeModeracaoSchema.statics.historico_objeto = function (
  objetoId,
  objetoTipo
) {
  return this.find({
    objeto_id: objetoId,
    objeto_tipo: objetoTipo,
  }).sort({ data_acao: -1 });
};

/**
 * Estatísticas gerais de moderação
 */
atividadeModeracaoSchema.statics.estatisticas_gerais = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total_acoes: { $sum: 1 },
        total_minutos: { $sum: '$tempo_estimado_minutos' },
        acoes_por_tipo: {
          $push: {
            tipo: '$tipo_acao',
            count: 1,
          },
        },
        moderadores_ativos: { $addToSet: '$moderador_id' },
      },
    },
  ]);
};

// ============================================================================
// EXPORTAR
// ============================================================================

module.exports = atividadeModeracaoSchema;
