/**
 * ============================================================================
 * GUIDE: ÍNDICES OTIMIZADOS E ESTRATÉGIA DE PERFORMANCE
 * ============================================================================
 * Análise detalhada de índices, queries críticas, e projeções de crescimento
 * para schemas de USUÁRIOS e AMIZADES.
 */

// ============================================================================
// SEÇÃO 1: ÍNDICES RECOMENDADOS COM JUSTIFICATIVA
// ============================================================================

/**
 * ============================================================================
 * COLLECTION: usuarios
 * ============================================================================
 *
 * ÍNDICE 1: Email Único (Constraint)
 * ────────────────────────────────────
 * Justificativa: Autenticação / Login
 * Query crítica: db.usuarios.findOne({'perfil.email': 'user@example.com'})
 * Volume esperado: 100% das requisições de login
 * Cardinalidade: Muito alta (todos únicos)
 * Índice: { 'perfil.email': 1 }, { unique: true }
 * Impacto: Reduz scan de coleção inteira
 *
 *
 * ÍNDICE 2: Matrícula Única (Constraint)
 * ──────────────────────────────────────
 * Justificativa: Identificação acadêmica
 * Query crítica: db.usuarios.findOne({'perfil.matricula': '202401001'})
 * Volume esperado: Alto (busca durante cadastro)
 * Cardinalidade: Muito alta (todos únicos)
 * Índice: { 'perfil.matricula': 1 }, { unique: true }
 *
 *
 * ÍNDICE 3: Busca de Texto (Nome + Bio)
 * ──────────────────────────────────────
 * Justificativa: Descoberta de usuários
 * Query crítica: db.usuarios.find({ $text: { $search: 'João' } })
 * Volume esperado: Alto (feeds e recomendações)
 * Cardinalidade: Alta (muitos usuários com mesmo nome)
 * Índice: { 'perfil.nome': 'text', 'perfil.bio': 'text' }
 * Nota: Text index ocupa 2-5x mais espaço, use parcialmente se necessário
 *
 *
 * ÍNDICE 4: Ativo + Status Vínculo
 * ────────────────────────────────
 * Justificativa: Filtros comuns (usuários ativos, egressos com limitação)
 * Query crítica:
 *   db.usuarios.find({ativo: true, 'perfil.status_vinculo': 'egresso'})
 * Volume esperado: Alto (moderação, regras de negócio)
 * Cardinalidade: Baixa-Média
 * Índice: { ativo: 1, 'perfil.status_vinculo': 1 }
 * Ordem: ativo primeiro (mais seletivo em lógica)
 *
 *
 * ÍNDICE 5: Stats para Ranking
 * ──────────────────────────────
 * Justificativa: Feeds, recomendações, top 10 usuários
 * Query crítica:
 *   db.usuarios.find({ativo: true})
 *     .sort({'stats.total_seguidores': -1})
 *     .limit(10)
 * Volume esperado: Muito alto (feed é consultado 100+ vezes/minuto)
 * Cardinalidade: Alta (números variados)
 * Índice: { 'stats.total_seguidores': -1, createdAt: -1 }
 * Nota: Composto para evitar sort em memória
 *
 *
 * ÍNDICE 6: Atividade Recente
 * ────────────────────────────
 * Justificativa: Usuários inativos, limpeza de dados, feeds ativos
 * Query crítica:
 *   db.usuarios.find({ultima_atividade: {$gt: ISODate(...)}})
 *     .sort({ultima_atividade: -1})
 * Volume esperado: Alto
 * Cardinalidade: Alta
 * Índice: { ultima_atividade: -1 }
 *
 *
 * ÍNDICE 7: Moderadores (Filtro Rápido)
 * ──────────────────────────────────────
 * Justificativa: Encontrar moderadores voluntários para ações
 * Query crítica:
 *   db.usuarios.find({
 *     $or: [
 *       {'configuracoes.mod_voluntario': true},
 *       {papel: {$in: ['moderador', 'admin']}}
 *     ],
 *     ativo: true
 *   })
 * Volume esperado: Baixo (uso esporádico)
 * Cardinalidade: Muito baixa (< 1% de usuários)
 * Índice: { 'configuracoes.mod_voluntario': 1, ativo: 1 }
 *         { papel: 1, ativo: 1 }
 *
 *
 * ÍNDICE 8: TTL para Soft Delete
 * ───────────────────────────────
 * Justificativa: Arquivar usuários deletados após período
 * Regra: Usuários com ativo=false por > 1 ano podem ser arquivados
 * Índice: { updatedAt: 1 }, {
 *   expireAfterSeconds: 31536000,
 *   partialFilterExpression: {ativo: false}
 * }
 * Nota: MongoDB removerá documento automaticamente
 *
 *
 * ============================================================================
 * COLLECTION: amizades
 * ============================================================================
 *
 * ÍNDICE 1: Relação Única (Constraint)
 * ────────────────────────────────────
 * Justificativa: Evitar duplicatas de amizade
 * Problema: Dois docs com {usuarioId: A, amigoId: B, status: 'aceito'}
 * Solução: Índice único + validação em app
 * Índice: { usuarioId: 1, amigoId: 1, status: 1 }, { unique: true }
 * Nota: Status incluído porque pendente e aceito são relações diferentes
 *
 *
 * ÍNDICE 2: Listar Amigos (Critical Path)
 * ─────────────────────────────────────────
 * Justificativa: Operação MUITO frequente - mostrar amigos na tela
 * Query crítica:
 *   db.amizades.find({usuarioId: X, status: 'aceito'})
 *     .sort({dataSolicitacao: -1})
 *     .limit(20)
 * Volume esperado: ALTÍSSIMO (cada visualização de perfil executa)
 * Cardinalidade: Alta
 * Índice: { usuarioId: 1, status: 1, dataSolicitacao: -1 }
 * Ordem: usuarioId (filtro), status (filtro), data (sort)
 * Impacto: Sem este índice, MongoDB faz sort em memória (muito lento)
 *
 *
 * ÍNDICE 3: Solicitações Recebidas
 * ──────────────────────────────────
 * Justificativa: Notificações / inbox do usuário
 * Query crítica:
 *   db.amizades.find({usuarioId: X, status: 'pendente'})
 *     .sort({dataSolicitacao: -1})
 * Volume esperado: Alto
 * Cardinalidade: Média (alguns pendentes por usuário)
 * Índice: { usuarioId: 1, status: 1, dataSolicitacao: -1 }
 * Nota: Pode compartilhar índice com listar amigos
 *
 *
 * ÍNDICE 4: Solicitações Enviadas
 * ───────────────────────────────
 * Justificativa: Usuário quer ver suas solicitações pendentes
 * Query crítica:
 *   db.amizades.find({amigoId: X, status: 'pendente'})
 * Volume esperado: Médio
 * Cardinalidade: Média
 * Índice: { amigoId: 1, status: 1, dataSolicitacao: -1 }
 * Ordem: amigoId (filtro), status (filtro), data (sort)
 *
 *
 * ÍNDICE 5: TTL para Recusas
 * ──────────────────────────
 * Justificativa: Limpeza automática (opcional)
 * Regra: Recusas podem expirar após 90 dias
 * Índice: { dataSolicitacao: 1 }, {
 *   expireAfterSeconds: 7776000,
 *   partialFilterExpression: {status: 'recusado'}
 * }
 * Nota: Opcional - depende se recusas precisam histórico permanente
 *
 *
 * ============================================================================
 * QUERIES CRÍTICAS (EXPLAIN ESPERADO)
 * ============================================================================
 */

/**
 * QUERY 1: Listar amigos do usuário
 * ─────────────────────────────────
 * 
 * db.amizades.find({usuarioId: ObjectId('...'), status: 'aceito'})
 *   .sort({dataSolicitacao: -1})
 *   .skip(0)
 *   .limit(20)
 *
 * EXPLAIN ESPERADO (COM ÍNDICE):
 * {
 *   executionStats: {
 *     nReturned: 20,
 *     totalDocsExamined: 20,  // Ideal: nReturned === totalDocsExamined
 *     executionStages: {
 *       stage: "LIMIT",
 *       inputStage: {
 *         stage: "SORT",
 *         inputStage: {
 *           stage: "FETCH",
 *           inputStage: {
 *             stage: "IXSCAN",  // Index Scan (bom!)
 *             indexName: "idx_lista_amigos"
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 *
 * SEM ÍNDICE (ruins):
 * - stage: "SORT" com "totalDocsExamined": 5000
 * - stage: "COLLSCAN" (varredura completa)
 * - Sort em memória (pode causar erro se > 100MB)
 */

/**
 * QUERY 2: Verificar se são amigos
 * ──────────────────────────────────
 * 
 * db.amizades.findOne({
 *   $or: [
 *     {usuarioId: A, amigoId: B, status: 'aceito'},
 *     {usuarioId: B, amigoId: A, status: 'aceito'}
 *   ]
 * })
 *
 * PROBLEMA: Índice único não otimiza $or
 * SOLUÇÃO: Fazer duas queries separadas OU usar índice bidirecional
 * 
 * Melhor:
 * db.amizades.findOne({usuarioId: A, amigoId: B, status: 'aceito'})
 * SE não encontrar:
 * db.amizades.findOne({usuarioId: B, amigoId: A, status: 'aceito'})
 *
 * EXPLAIN ESPERADO (primeira query):
 * {
 *   executionStats: {
 *     nReturned: 0 ou 1,
 *     totalDocsExamined: 0 ou 1,
 *     executionStages: {
 *       stage: "FETCH",
 *       inputStage: {
 *         stage: "IXSCAN",
 *         indexName: "idx_relacao_unica"
 *       }
 *     }
 *   }
 * }
 */

/**
 * QUERY 3: Buscar usuário por email
 * ──────────────────────────────────
 * 
 * db.usuarios.findOne({'perfil.email': 'user@example.com'})
 *
 * EXPLAIN ESPERADO:
 * {
 *   executionStats: {
 *     nReturned: 1,
 *     totalDocsExamined: 1,
 *     executionStages: {
 *       stage: "FETCH",
 *       inputStage: {
 *         stage: "IXSCAN",
 *         indexName: "idx_email_unico"
 *       }
 *     }
 *   }
 * }
 */

/**
 * QUERY 4: Usuarios populares (ranking)
 * ──────────────────────────────────────
 * 
 * db.usuarios.find({ativo: true})
 *   .sort({'stats.total_seguidores': -1})
 *   .limit(20)
 *
 * EXPLAIN ESPERADO (COM ÍNDICE):
 * {
 *   executionStats: {
 *     nReturned: 20,
 *     totalDocsExamined: 20,
 *     executionStages: {
 *       stage: "LIMIT",
 *       inputStage: {
 *         stage: "IXSCAN",
 *         indexName: "idx_stats_ranking"
 *       }
 *     }
 *   }
 * }
 *
 * SEM ÍNDICE:
 * - totalDocsExamined: todos os usuários ativos
 * - stage: "SORT" com sort em memória
 */

// ============================================================================
// SEÇÃO 2: ESTIMATIVA DE CRESCIMENTO E IMPACTO
// ============================================================================

/**
 * CENÁRIO: Rede social acadêmica IF (Instituto Federal)
 * População-alvo: ~5000 estudantes + 500 servidores
 * 
 * ANO 1:
 * ──────
 * - Usuários: 2000
 * - Média de amigos: 8
 * - Documentos em amizades: 2000 * 8 = 16.000
 * - Tamanho doc usuario: ~1.5KB
 * - Tamanho doc amizade: ~0.3KB
 * - Total: 2000 * 1.5KB + 16000 * 0.3KB = 3MB + 4.8MB = 7.8MB
 * 
 * ANO 3 (Crescimento 3x):
 * ───────────────────────
 * - Usuários: 6000
 * - Média de amigos: 15 (mais conectado)
 * - Documentos em amizades: 6000 * 15 = 90.000
 * - Total: 6000 * 1.5KB + 90000 * 0.3KB = 9MB + 27MB = 36MB
 * - Índices: ~10-15MB
 * - Total com índices: ~50MB (facilmente gerenciável)
 * 
 * ANO 5+ (Rede madura):
 * ────────────────────
 * - Usuários: 10.000
 * - Média de amigos: 20
 * - Documentos em amizades: 200.000
 * - Total dados: 15MB + 60MB = 75MB
 * - Índices: ~20MB
 * - Total: ~95MB
 * - RAM recomendada: 512MB (3x tamanho total)
 * 
 * CONCLUSÃO: Dimensionamento está OK para MongoDB single node
 * Considerar replicação em ANO 2+ para HA
 */

// ============================================================================
// SEÇÃO 3: IMPACTO DOS ÍNDICES
// ============================================================================

/**
 * ESPAÇO EM DISCO
 * ───────────────
 * Index: { usuarioId: 1, status: 1, dataSolicitacao: -1 }
 * 
 * Cresce com:
 * - Número de documentos
 * - Tamanho dos valores (ObjectId = 12 bytes fixo, Date = 8 bytes)
 * - Overhead de B-tree (~20% adicional)
 * 
 * Estimativa para 90.000 docs amizade:
 * - Índice simples: ~1-2MB
 * - Índice composto 3 campos: ~3-5MB
 * - Índice text: ~10-20MB (muito maior!)
 * 
 * RECOMENDAÇÃO: Criar apenas índices que resolvem queries críticas
 */

/**
 * VELOCIDADE DE ESCRITA
 * ────────────────────
 * Cada inserção/atualização em amizades requer:
 * 1. Inserir doc principal
 * 2. Atualizar 5-6 índices
 * 3. Possível validação de integridade
 * 
 * Impacto: +2-5ms por inserção (aceitável)
 * 
 * Se performance de escrita for crítica:
 * - Reduzir número de índices
 * - Usar índices parciais (partialFilterExpression)
 * - Considerar denormalização
 */

/**
 * VELOCIDADE DE LEITURA
 * ────────────────────
 * Com índice apropriado:
 * - Listar amigos: ~5ms (io bound)
 * - Verificar amizade: ~2ms
 * - Buscar por email: ~1ms
 * 
 * Sem índice:
 * - Listar amigos: ~100-500ms (collection scan)
 * - Verificar amizade: ~100-500ms
 * - Busca por email: ~100-500ms
 * 
 * MELHORIA: 20-100x mais rápido com índices apropriados
 */

// ============================================================================
// SEÇÃO 4: ESTRATÉGIA DE ÍNDICES PARCIAIS (Otimização Avançada)
// ============================================================================

/**
 * PROBLEMA: Índice text ocupa muito espaço
 * SOLUÇÃO: Usar índice parcial apenas em usuários ativos
 * 
 * db.usuarios.createIndex(
 *   {'perfil.nome': 'text', 'perfil.bio': 'text'},
 *   {partialFilterExpression: {ativo: true}}
 * )
 * 
 * GANHO:
 * - Reduz tamanho do índice em ~30%
 * - Não indexa usuários inativos (que não aparecem em buscas)
 * - Idêntica performance para queries reais
 */

/**
 * PROBLEMA: TTL index precisa de índice separado
 * SOLUÇÃO: Usar índice parcial com sparse
 * 
 * db.usuarios.createIndex(
 *   {updatedAt: 1},
 *   {
 *     expireAfterSeconds: 31536000,
 *     partialFilterExpression: {ativo: false},
 *     sparse: true
 *   }
 * )
 */

// ============================================================================
// SEÇÃO 5: VALIDAÇÃO DE INTEGRIDADE
// ============================================================================

/**
 * PROBLEMA 1: Auto-amizade
 * ────────────────────────
 * Usuário A se torna amigo de si mesmo
 * 
 * DETECÇÃO:
 * db.amizades.find({
 *   $where: 'this.usuarioId === this.amigoId'
 * })
 * 
 * PREVENÇÃO: Schema valida com pre('save')
 * amizadeSchema.pre('save', function(next) {
 *   if (this.usuarioId.equals(this.amigoId)) {
 *     return next(new Error('Auto-amizade não permitida'));
 *   }
 *   next();
 * });
 */

/**
 * PROBLEMA 2: Referência inválida
 * ───────────────────────────────
 * usuarioId ou amigoId referem usuário que foi deletado
 * 
 * DETECÇÃO:
 * db.amizades.aggregate([
 *   {
 *     $lookup: {
 *       from: 'usuarios',
 *       localField: 'usuarioId',
 *       foreignField: '_id',
 *       as: 'usuario'
 *     }
 *   },
 *   {
 *     $match: {usuario: {$size: 0}}
 *   }
 * ])
 * 
 * PREVENÇÃO: Usar soft delete em usuários
 * - Marcar ativo: false em vez de deletar
 * - Queries sempre filtram por ativo: true
 * - Amizades nunca ficam órfãs
 */

/**
 * PROBLEMA 3: Duplicatas de amizade
 * ──────────────────────────────────
 * Dois docs com status 'aceito' para mesma relação
 * 
 * DETECÇÃO:
 * db.amizades.aggregate([
 *   {
 *     $group: {
 *       _id: {
 *         usuarios: {$sort: ['$usuarioId', '$amigoId']},
 *         status: '$status'
 *       },
 *       count: {$sum: 1}
 *     }
 *   },
 *   {$match: {count: {$gt: 1}}}
 * ])
 * 
 * PREVENÇÃO: Índice único
 * { usuarioId: 1, amigoId: 1, status: 1 }, {unique: true}
 */

/**
 * PROBLEMA 4: Stats desincronizadas
 * ──────────────────────────────────
 * usuarios.stats.total_amigos !== número real de amizades
 * 
 * SINCRONIZAÇÃO:
 * Usar triggers ou job de background:
 * 1. Contar docs em amizades com status='aceito'
 * 2. Atualizar usuarios.stats.total_amigos
 * 3. Executar 1x por hora ou após bulk operations
 */

/**
 * PROBLEMA 5: Status de amizade inválido
 * ──────────────────────────────────────
 * Documento com status fora do enum
 * 
 * DETECÇÃO:
 * db.amizades.find({
 *   status: {$nin: ['pendente', 'aceito', 'recusado']}
 * })
 * 
 * PREVENÇÃO: Schema com enum
 * status: {
 *   type: String,
 *   enum: ['pendente', 'aceito', 'recusado'],
 *   required: true
 * }
 */

// ============================================================================
// SEÇÃO 6: CHECKLIST DE VALIDAÇÃO
// ============================================================================

/**
 * ANTES DE DEPLOY
 * ───────────────
 * [ ] Índice { 'perfil.email': 1 } com unique: true criado
 * [ ] Índice { usuarioId: 1, status: 1, dataSolicitacao: -1 } em amizades
 * [ ] Índice { amigoId: 1, status: 1 } em amizades
 * [ ] Não há auto-amizades (verificar com $where)
 * [ ] Todos usuarioId/amigoId existem em usuarios
 * [ ] Não há duplicatas de amizade (status='aceito')
 * [ ] Stats estão sincronizadas
 * [ ] Documentos sem senha volta select: false
 * [ ] TTL index criado (se necessário)
 *
 * APÓS DEPLOY (Monitoramento)
 * ──────────────────────────
 * [ ] Queries de listar amigos executam em < 10ms
 * [ ] Queries de verificar amizade executam em < 5ms
 * [ ] Índices não crescem continuamente (sinal de duplicatas)
 * [ ] Taxa de escrita < 1000 docs/segundo
 * [ ] RAM utilizada < 80% da disponível
 * [ ] Nenhum erro de validação em logs
 */

// ============================================================================
// EXPORTAR PARA DOCUMENTAÇÃO
// ============================================================================

module.exports = {
  descricao: 'Guia de índices, performance e integridade de dados',
  schemas: {
    usuarios: 'usuario-otimizado.schema.js',
    amizades: 'amizade.schema.js',
  },
  indicesRecomendados: {
    usuarios: [
      '{ "perfil.email": 1 } - unique',
      '{ "perfil.matricula": 1 } - unique',
      '{ "perfil.nome": "text", "perfil.bio": "text" }',
      '{ "ativo": 1, "perfil.status_vinculo": 1 }',
      '{ "stats.total_seguidores": -1, "createdAt": -1 }',
      '{ "ultima_atividade": -1 }',
      '{ "papel": 1, "ativo": 1 }',
      '{ "updatedAt": 1 } - TTL para soft delete',
    ],
    amizades: [
      '{ "usuarioId": 1, "amigoId": 1, "status": 1 } - unique',
      '{ "usuarioId": 1, "status": 1, "dataSolicitacao": -1 }',
      '{ "amigoId": 1, "status": 1, "dataSolicitacao": -1 }',
      '{ "dataSolicitacao": 1 } - TTL para recusas (90 dias)',
    ],
  },
  queriesCriticas: [
    'db.usuarios.findOne({"perfil.email": "..."})',
    'db.amizades.find({usuarioId: X, status: "aceito"}).sort({dataSolicitacao: -1}).limit(20)',
    'db.amizades.findOne({usuarioId: A, amigoId: B, status: "aceito"})',
    'db.usuarios.find({ativo: true}).sort({"stats.total_seguidores": -1}).limit(20)',
  ],
};
