/**
 * ============================================================================
 * MODELS (Mongoose)
 * ============================================================================
 * Arquivo que exporta os modelos prontos para uso em toda a aplicação.
 * Os modelos combinam os schemas com as coleções do MongoDB.
 */

const mongoose = require('mongoose');

// Importar os schemas
const usuarioSchema = require('../schemas/usuario.schema');
const postagemSchema = require('../schemas/postagem.schema');
const atividadeModeracaoSchema = require('../schemas/atividade-moderacao.schema');
const comentarioSchema = require('../schemas/comentario.schema');
const seguidorSchema = require('../schemas/seguidor.schema');
const palavraFiltroSchema = require('../schemas/palavra-filtro.schema');
const tagSubtipoSchema = require('../schemas/tag-subtipo.schema');
const solicitacaoTagSchema = require('../schemas/solicitacao-tag.schema');
const notificacaoSchema = require('../schemas/notificacao.schema');
const medalhaSchema = require('../schemas/medalha.schema');
const usuarioMedalhaSchema = require('../schemas/usuario-medalha.schema');
const portfolioItemSchema = require('../schemas/portfolio-item.schema');

// ============================================================================
// CRIAR MODELOS
// ============================================================================

/**
 * Modelo Usuario
 * Representa usuários da rede social IF REDE
 */
const Usuario = mongoose.model('Usuario', usuarioSchema);

/**
 * Modelo Medalha
 * Conquistas acadêmicas
 */
const Medalha = mongoose.model('Medalha', medalhaSchema);

/**
 * Modelo UsuarioMedalha
 * Relacionamento entre usuarios e medalhas
 */
const UsuarioMedalha = mongoose.model('UsuarioMedalha', usuarioMedalhaSchema);

/**
 * Modelo PortfolioItem
 * Itens fixados no portfolio do usuario
 */
const PortfolioItem = mongoose.model('PortfolioItem', portfolioItemSchema);

/**
 * Modelo Postagem
 * Representa postagens (áudio, imagem, texto)
 */
const Postagem = mongoose.model('Postagem', postagemSchema);

/**
 * Modelo AtividadeModeração
 * Registra ações de moderadores voluntários para cálculo de horas
 */
const AtividadeModeracacao = mongoose.model(
  'AtividadeModeracacao',
  atividadeModeracaoSchema
);

/**
 * Modelo Comentario
 * Comentários com moderação em duas etapas
 */
const Comentario = mongoose.model('Comentario', comentarioSchema);

/**
 * Modelo Seguidor
 * Relação de seguir/deixar de seguir entre usuários
 */
const Seguidor = mongoose.model('Seguidor', seguidorSchema);

/**
 * Modelo PalavraFiltro
 * Termos bloqueados usados pela moderacao automatica
 */
const PalavraFiltro = mongoose.model('PalavraFiltro', palavraFiltroSchema);

/**
 * Modelo TagSubtipo
 * Catalogo de tags para classificar subtipos de postagens
 */
const TagSubtipo = mongoose.model('TagSubtipo', tagSubtipoSchema);

/**
 * Modelo SolicitacaoTag
 * Pedidos de novas tags feitos por usuarios
 */
const SolicitacaoTag = mongoose.model('SolicitacaoTag', solicitacaoTagSchema);

/**
 * Modelo Notificacao
 * Notificações de eventos (likes, comentários, novos seguidores, etc)
 */
const Notificacao = mongoose.model('Notificacao', notificacaoSchema);

// Alias para manter nomenclatura consistente
const AtividadeModeracao = AtividadeModeracacao;

// ============================================================================
// EXPORTAR MODELOS
// ============================================================================

module.exports = {
  Usuario,
  Postagem,
  AtividadeModeracacao,
  AtividadeModeracao,
  Comentario,
  Seguidor,
  PalavraFiltro,
  TagSubtipo,
  SolicitacaoTag,
  Notificacao,
  Medalha,
  UsuarioMedalha,
  PortfolioItem,
};
