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

// Schemas do sistema de perfis
const privacidadeSchema = require('../schemas/privacidade.schema');
const preferenciasSchema = require('../schemas/preferencias.schema');
const conexoesSchema = require('../schemas/conexoes.schema');
const badgesSchema = require('../schemas/badges.schema');
const auditoriaSchema = require('../schemas/auditoria.schema');
const amizadeSchema = require('../schemas/amizade.schema');

// ============================================================================
// CRIAR MODELOS
// ============================================================================

/**
 * Modelo Usuario
 * Representa usuários da rede social IF REDE
 */
const Usuario = mongoose.model('Usuario', usuarioSchema);

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
 * Modelo Privacidade
 * Configurações de privacidade do usuário
 */
const Privacidade = mongoose.model('Privacidade', privacidadeSchema);

/**
 * Modelo Preferencias
 * Preferências pessoais do usuário (tema, idioma, notificações)
 */
const Preferencias = mongoose.model('Preferencias', preferenciasSchema);

/**
 * Modelo Conexoes
 * Relações de amizade entre usuários
 */
const Conexoes = mongoose.model('Conexoes', conexoesSchema);

/**
 * Modelo Badges
 * Badges, pontos e nível do usuário
 */
const Badges = mongoose.model('Badges', badgesSchema);

/**
 * Modelo Auditoria
 * Registro de ações e atividades do usuário
 */
const Auditoria = mongoose.model('Auditoria', auditoriaSchema);

/**
 * Modelo Amizade
 * Relações de amizade entre usuários com histórico de solicitações
 */
const Amizade = mongoose.model('Amizade', amizadeSchema);

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
  Privacidade,
  Preferencias,
  Conexoes,
  Badges,
  Auditoria,
  Amizade,
};
