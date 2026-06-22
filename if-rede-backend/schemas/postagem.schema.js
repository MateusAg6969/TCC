/**
 * ============================================================================
 * SCHEMA: POSTAGEM
 * ============================================================================
 * Modelo que representa postagens na rede social IF REDE.
 * Suporta múltiplos tipos (áudio, imagem, texto) com um único schema.
 * 
 * Padrões aplicados:
 * - Polimorfismo: Um schema para vários tipos de conteúdo
 * - TTL Index: Rascunhos expiram automaticamente em 14 dias
 * - Bucket Pattern: Campos de stats denormalizados para performance
 * - Attribute Pattern: Metadados flexíveis por tipo
 */

const mongoose = require('mongoose');

// ============================================================================
// SUBDOCUMENTO: CONTEÚDO (Polimórfico)
// ============================================================================
// Estrutura flexível que se adapta ao tipo de postagem.
const conteudoSchema = new mongoose.Schema(
  {
    // URL publica do arquivo enviado (imagem/audio/texto).
    // Entrada: caminho gerado pelo middleware de upload na rota.
    // Saida: URL consumida pelo frontend para renderizar/download.
    url: {
      type: String,
      required: [true, 'URL do arquivo e obrigatoria'],
    },

    // Metadados tecnicos do arquivo para auditoria e validacoes futuras.
    // Entrada: propriedades do arquivo enviadas pelo multer (nome, mime, tamanho).
    // Saida: snapshot persistido no documento da postagem.
    arquivo: {
      nome_original: { type: String, default: '' },
      nome_servidor: { type: String, default: '' },
      mimetype: { type: String, default: '' },
      tamanho_bytes: { type: Number, default: 0, min: 0 },
    },

    // Texto longo ou descrição
    texto_longo: {
      type: String,
      maxlength: [5000, 'Texto não pode exceder 5000 caracteres'],
      default: '',
    },

    // Acessibilidade (Alt Text) para imagens e documentos
    descricao_alternativa: {
      type: String,
      maxlength: [300, 'A descrição alternativa não pode exceder 300 caracteres'],
      default: '',
    },

    // Flag para conteúdo sensível (violência, conteúdo adulto, etc.)
    sensivel: {
      type: Boolean,
      default: false,
    },

    // Dimensões (para imagens)
    dimensoes: {
      largura: Number,
      altura: Number,
    },

    // Duração (para áudio/vídeo em segundos)
    duracao_segundos: {
      type: Number,
      min: 0,
    },

    // Link Preview para artigos e referências
    link_preview: {
      url: String,
      titulo: String,
      descricao: String,
      imagem_url: String,
    },

    // Opções para postagens do tipo 'enquete'
    opcoes_enquete: [
      {
        texto: { type: String, required: true },
        votos: { type: Number, default: 0 },
        votantes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
      },
    ],

    // Metadados customizados por tipo (Attribute Pattern)
    // Exemplos:
    // { genero_musica: "MPB", artista: "Caetano Veloso" } para áudio
    // { tecnica: "Aquarela", material: "Papel" } para imagem
    metadados: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

// ============================================================================
// SUBDOCUMENTO: CONFIGURAÇÕES DE POSTAGEM
// ============================================================================
// Controla visibilidade, comentários e status de rascunho.
const configSchema = new mongoose.Schema(
  {
    // Se verdadeiro, não aparece no feed público
    eh_rascunho: {
      type: Boolean,
      default: true, // Padrão: rascunho até publicar
    },

    // Quem pode ver esta postagem
    visibilidade: {
      type: String,
      enum: {
        values: ['todos', 'seguidores', 'melhores_amigos'],
        message: 'Visibilidade deve ser: todos, seguidores ou melhores_amigos',
      },
      default: 'todos',
    },

    // Permitir comentários nesta postagem
    comentarios_ativos: {
      type: Boolean,
      default: true,
    },

    // Se comentários devem ser pré-aprovados (moderação)
    comentarios_moderados: {
      type: Boolean,
      default: false,
    },

    // Status de copyright/direitos autorais
    requer_permissao: {
      type: Boolean,
      default: false,
    },

    permissao_de: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

// ============================================================================
// SUBDOCUMENTO: INFORMAÇÕES DE REPOSTAGEM
// ============================================================================
// Quando um usuário faz repost (compartilhamento) de outro post.
const repostInfoSchema = new mongoose.Schema(
  {
    // ID do post original (null se for post original)
    original_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Postagem',
      default: null,
    },

    // Comentário que o repostador adicionou
    comentario_repost: {
      type: String,
      maxlength: [500, 'Comentário de repost não pode exceder 500 caracteres'],
      default: '',
    },

    // Contagem de quantas vezes foi repostado
    repost_count: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// ============================================================================
// SUBDOCUMENTO: ESTATÍSTICAS (Bucket Pattern)
// ============================================================================
// Denormalizado para rápido acesso sem agregações.
const statsSchema = new mongoose.Schema(
  {
    // Contagem de curtidas
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },

    // IDs dos usuários que curtiram (para evitar curtidas duplicadas)
    usuarios_que_curtiram: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Usuario',
      default: [],
    },

    // Contagem de comentários
    comentarios_count: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Contagem de compartilhamentos (reposts)
    shares: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Contagem de visualizações únicas (alcance)
    alcance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // IDs dos usuários que já visualizaram (para evitar duplicidade)
    visualizadores: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Usuario',
      default: [],
    },

    // Contagem de visualizações brutas (já existente no projeto)
    visualizacoes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

// ============================================================================
// SCHEMA PRINCIPAL: POSTAGEM
// ============================================================================
const postagemSchema = new mongoose.Schema(
  {
    // Referência ao autor
    autor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'Autor é obrigatório'],
      immutable: true, // Não pode ser alterado após criação
    },

    // Informações básicas
    titulo: {
      type: String,
      required: [true, 'Título é obrigatório'],
      minlength: [3, 'Título deve ter pelo menos 3 caracteres'],
      maxlength: [200, 'Título não pode exceder 200 caracteres'],
      trim: true,
    },

    descricao: {
      type: String,
      maxlength: [500, 'Descrição não pode exceder 500 caracteres'],
      default: '',
      trim: true,
    },

    // TIPO DE CONTEÚDO (Essencial para polimorfismo)
    tipo: {
      type: String,
      enum: {
        values: ['audio', 'imagem', 'texto', 'video', 'documento', 'enquete'],
        message: 'Tipo deve ser: audio, imagem, texto, video, documento ou enquete',
      },
      required: [true, 'Tipo de conteúdo é obrigatório'],
    },

    // SUBTIPO CUSTOMIZÁVEL (Attribute Pattern)
    // Exemplos: "Poema", "Podcast", "Pintura", "Código", "Resenha"
    subtipo: {
      type: String,
      maxlength: [50, 'Subtipo não pode exceder 50 caracteres'],
      default: '',
    },

    // Referencia opcional para catalogo de tags/subtipos.
    // Entrada: ID de TagSubtipo selecionado no frontend.
    // Saida: permite relacao entre post e taxonomia oficial de tags.
    subtipo_tag_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TagSubtipo',
      default: null,
      index: true,
    },

    // Conteúdo da postagem
    conteudo: {
      type: conteudoSchema,
      required: true,
    },

    // Configurações de publicação
    config: {
      type: configSchema,
      default: {},
    },

    // Informações de repostagem (se for um repost)
    repost_info: {
      type: repostInfoSchema,
      default: {},
    },

    // Estatísticas da postagem
    stats: {
      type: statsSchema,
      default: {},
    },

    // Marcadores/Hashtags
    tags: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 20; // Máximo 20 tags
        },
        message: 'Máximo de 20 tags permitido',
      },
      default: [],
    },

    // Categorias institucionais (IF REDE específico)
    categorias: {
      type: [String],
      enum: {
        values: [
          'projetos',
          'eventos',
          'artes',
          'tecnologia',
          'acesso-inclusivo',
          'geral',
        ],
        message: 'Categoria inválida',
      },
      default: ['geral'],
    },

    // ============================================================================
    // TTL (TIME-TO-LIVE) - PADRÃO IMPORTANTE PARA RASCUNHOS
    // ============================================================================
    // Este campo é usado pelo MongoDB para deletar automaticamente o documento.
    // Se eh_rascunho: true, o documento será deletado após 14 dias.
    // Crie um índice TTL ao conectar ao banco de dados (veja db/connection.js)
    excluir_em: {
      type: Date,
      default: function () {
        if (this.config.eh_rascunho) {
          // Se for rascunho, set para 14 dias a partir de agora
          const data = new Date();
          data.setDate(data.getDate() + 14);
          return data;
        }
        return null; // Não expira se não for rascunho
      },
    },

    // Denúncia/Reporte (para moderação)
    denuncias: {
      total: { type: Number, default: 0 },
      motivos: [
        {
          usuario_id: mongoose.Schema.Types.ObjectId,
          motivo: String,
          data: { type: Date, default: Date.now },
        },
      ],
      bloqueado: { type: Boolean, default: false },
      motivo_bloqueio: String,
    },

    // Status de moderação
    status_moderacao: {
      type: String,
      enum: ['pendente', 'aprovado', 'rejeitado', 'em_revisao'],
      default: 'aprovado',
    },

    moderado_por: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
    },

    // Data/hora de criação e atualização
  },
  {
    timestamps: true, // createdAt e updatedAt automáticos
    collection: 'postagens',
  }
);

// ============================================================================
// ÍNDICES (para performance e regras de negócio)
// ============================================================================

// TTL Index - Deleta rascunhos após 14 dias automaticamente
// IMPORTANTE: Este índice é criado na inicialização (veja db/connection.js)
postagemSchema.index(
  { excluir_em: 1 },
  {
    expireAfterSeconds: 0, // Deleta imediatamente quando a data é atingida
    partialFilterExpression: { 'config.eh_rascunho': true },
  }
);

// Busca por autor (posts do usuário)
postagemSchema.index({ autor_id: 1, 'config.eh_rascunho': -1 });

// Busca por tipo de conteúdo
postagemSchema.index({ tipo: 1, 'config.eh_rascunho': -1 });

// Busca por data (timeline)
postagemSchema.index({ createdAt: -1, 'config.eh_rascunho': -1 });

// Busca por visibilidade (importante para queries de feed)
postagemSchema.index({
  'config.visibilidade': 1,
  'config.eh_rascunho': -1,
  createdAt: -1,
});

// Texto livre (título e descrição)
postagemSchema.index({ titulo: 'text', descricao: 'text' });

// Busca por tags
postagemSchema.index({ tags: 1 });

// Busca por tag de subtipo (taxonomia oficial)
postagemSchema.index({ subtipo_tag_id: 1, createdAt: -1 });

// Busca por categorias
postagemSchema.index({ categorias: 1 });

// Status de moderação
postagemSchema.index({ status_moderacao: 1 });

// Índice para otimizar busca de posts curtidos por um usuário específico
postagemSchema.index({ 'stats.usuarios_que_curtiram': 1 });

// Denúncias
postagemSchema.index({ 'denuncias.bloqueado': 1 });

// Índice para otimizar a verificação de visualizadores únicos
postagemSchema.index({ 'stats.visualizadores': 1 });

// ============================================================================
// MÉTODOS ÚTEIS
// ============================================================================

/**
 * Publica o rascunho (remove status de rascunho e define visibilidade)
 */
postagemSchema.methods.publicar = function () {
  this.config.eh_rascunho = false;
  this.excluir_em = null; // Remove expiração
  this.status_moderacao = 'pendente'; // Vai para fila de moderação
  return this.save();
};

/**
 * Volta para rascunho
 */
postagemSchema.methods.voltarParaRascunho = function () {
  this.config.eh_rascunho = true;
  const data = new Date();
  data.setDate(data.getDate() + 14);
  this.excluir_em = data; // Reseta o TTL
  return this.save();
};

/**
 * Adiciona uma curtida
 */
postagemSchema.methods.adicionarCurtida = function (usuarioId) {
  if (!this.stats.usuarios_que_curtiram.includes(usuarioId)) {
    this.stats.usuarios_que_curtiram.push(usuarioId);
    this.stats.likes += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

/**
 * Remove uma curtida
 */
postagemSchema.methods.removerCurtida = function (usuarioId) {
  const indice = this.stats.usuarios_que_curtiram.indexOf(usuarioId);
  if (indice > -1) {
    this.stats.usuarios_que_curtiram.splice(indice, 1);
    this.stats.likes -= 1;
    return this.save();
  }
  return Promise.resolve(this);
};

/**
 * Incrementa contagem de comentários
 */
postagemSchema.methods.incrementarComentarios = function () {
  this.stats.comentarios_count += 1;
  return this.save();
};

/**
 * Decrementa contagem de comentários
 */
postagemSchema.methods.decrementarComentarios = function () {
  this.stats.comentarios_count = Math.max(0, this.stats.comentarios_count - 1);
  return this.save();
};

/**
 * Incrementa visualizações
 */
postagemSchema.methods.incrementarVisualizacoes = function () {
  this.stats.visualizacoes += 1;
  return this.save();
};

/**
 * Bloqueia a postagem (moderação)
 */
postagemSchema.methods.bloquear = function (motivo = '') {
  this.denuncias.bloqueado = true;
  this.denuncias.motivo_bloqueio = motivo;
  this.status_moderacao = 'rejeitado';
  return this.save();
};

/**
 * Desbloqueia a postagem
 */
postagemSchema.methods.desbloquear = function () {
  this.denuncias.bloqueado = false;
  this.denuncias.motivo_bloqueio = '';
  this.status_moderacao = 'aprovado';
  return this.save();
};

// ============================================================================
// STATICS (Métodos de classe)
// ============================================================================

/**
 * Encontra postagens por autor que não são rascunhos
 */
postagemSchema.statics.postagem_publica_por_autor = function (autorId) {
  return this.find({
    autor_id: autorId,
    'config.eh_rascunho': false,
    'denuncias.bloqueado': false,
  }).sort({ createdAt: -1 });
};

/**
 * Encontra rascunhos de um usuário
 */
postagemSchema.statics.rascunhos_do_usuario = function (usuarioId) {
  return this.find({
    autor_id: usuarioId,
    'config.eh_rascunho': true,
  }).sort({ createdAt: -1 });
};

/**
 * Encontra postagens bloqueadas (para moderação)
 */
postagemSchema.statics.postagens_bloqueadas = function () {
  return this.find({ 'denuncias.bloqueado': true }).sort({ createdAt: -1 });
};

/**
 * Encontra postagens pendentes de moderação
 */
postagemSchema.statics.postagens_pendentes_moderacao = function () {
  return this.find({ status_moderacao: 'pendente' }).sort({ createdAt: 1 });
};

/**
 * Busca por tipo de conteúdo
 */
postagemSchema.statics.por_tipo = function (tipo) {
  return this.find({
    tipo: tipo,
    'config.eh_rascunho': false,
    'denuncias.bloqueado': false,
  }).sort({ createdAt: -1 });
};

// ============================================================================
// EXPORTAR
// ============================================================================

module.exports = postagemSchema;
