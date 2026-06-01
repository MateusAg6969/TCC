/**
 * ============================================================================
 * ÍNDICE COMPLETO: PROJETO USUARIO + AMIZADE
 * ============================================================================
 * 
 * Guia de navegação para toda documentação
 * 
 * TEMPO ESTIMADO DE LEITURA:
 * - Quick Start: 10 minutos
 * - Implementação: 2-3 horas
 * - Testes: 1 hora
 * ============================================================================
 */

// ============================================================================
// ARQUIVOS CRIADOS (6 schemas principais + 5 guias)
// ============================================================================

const INDEX = {
  schemas: {
    'usuario-otimizado.schema.js': {
      tamanho: '13 KB',
      tempo_leitura: '15 min',
      descricao: 'Schema otimizado de usuário com subdocumentos',
      conteudo: [
        '✓ Estrutura com Perfil, Customização, Configurações',
        '✓ Stats denormalizadas para performance',
        '✓ Validações robustas em todos campos',
        '✓ 8 índices estratégicos',
        '✓ Métodos: compararSenha(), suspender(), registrarAtividade()',
        '✓ Statics: encontrarPorEmail(), buscarPorTexto(), encontrarModeadores()',
        '✓ TTL para soft delete',
      ],
      destaques: [
        'Senha com hash bcryptjs',
        'Email e matrícula únicos',
        'Busca de texto full-text',
        'Índice de ranking (popular)',
      ],
      use_quando: [
        '✓ Precisa criar novo usuário',
        '✓ Implementar autenticação',
        '✓ Buscar usuários',
        '✓ Calcular stats',
      ],
    },

    'amizade.schema.js': {
      tamanho: '15 KB',
      tempo_leitura: '15 min',
      descricao: 'Schema dedicado para relações de amizade',
      conteudo: [
        '✓ Documentos individuais por relação (não arrays)',
        '✓ Estados: pendente, aceito, recusado',
        '✓ Histórico completo (dataSolicitacao, dataResposta)',
        '✓ Validação de auto-amizade',
        '✓ 4 índices compostos',
        '✓ Métodos: aceitar(), recusar(), desfazer()',
        '✓ Statics: saoAmigos(), listarAmigos(), enviarSolicitacao()',
        '✓ Agregações: pipelineListarAmigosComStats(), pipelineAmigosEmComum()',
        '✓ TTL para recusas (90 dias)',
      ],
      destaques: [
        'Índice único evita duplicatas',
        'Índices compostos para leitura rápida',
        'Métodos automáticos de transição de estado',
      ],
      use_quando: [
        '✓ Enviar/aceitar/recusar solicitação',
        '✓ Listar amigos com paginação',
        '✓ Verificar relação entre usuários',
        '✓ Encontrar amigos em comum',
      ],
    },
  },

  guias: {
    'RESUMO-EXECUTIVO.js': {
      tamanho: '19 KB',
      tempo_leitura: '20 min',
      descricao: 'Análise de decisões técnicas e problemas resolvidos',
      secoes: [
        '1. Problemas Resolvidos (Por que coleção dedicada?)',
        '2. Decisões de Design (Soft delete, Stats denormalizadas, etc)',
        '3. Índices Finais (Listagem completa)',
        '4. Roadmap de Implementação (Fases 1-5)',
        '5. Checklist Pré-Deploy',
        '6. Métricas de Sucesso (antes/depois)',
        '7. Troubleshooting (erros comuns)',
        '8. Conclusão',
      ],
      leia_primeiro: true,
      importancia: '★★★★★ CRÍTICO',
    },

    'INDICE-PERFORMANCE-GUIDE.js': {
      tamanho: '20 KB',
      tempo_leitura: '20 min',
      descricao: 'Guia detalhado de índices, performance e escalabilidade',
      secoes: [
        '1. Índices Recomendados com Justificativa',
        '2. Estimativa de Crescimento (Ano 1-5)',
        '3. Impacto dos Índices (espaço, velocidade)',
        '4. Estratégia de Índices Parciais',
        '5. Validação de Integridade (detectar erros)',
        '6. Checklist de Validação',
        '7. Query críticas com EXPLAIN esperado',
      ],
      para_dbas: true,
      deve_ler_antes: 'RESUMO-EXECUTIVO.js',
      importancia: '★★★★★ CRÍTICO',
    },

    'INTEGRACAO-USUARIO-AMIZADE.js': {
      tamanho: '14 KB',
      tempo_leitura: '15 min',
      descricao: 'Integração prática entre schemas, sincronização de dados',
      conteudo: [
        '✓ Middlewares pré/pós save',
        '✓ ServicoAmizade (classe com toda lógica)',
        '✓ Queries otimizadas (listarAmigos, verificarStatusRelacao)',
        '✓ Agregações úteis (listarAmigosComEstatisticas)',
        '✓ Job de validação de integridade',
      ],
      para_backend: true,
      importancia: '★★★★ MUITO IMPORTANTE',
    },

    'EXEMPLOS-USO.js': {
      tamanho: '19 KB',
      tempo_leitura: '20 min',
      descricao: 'Exemplos prontos para copiar/colar em controllers',
      exemplos: [
        '1. Enviar solicitação de amizade',
        '2. Aceitar solicitação',
        '3. Listar amigos com paginação',
        '4. Verificar se são amigos',
        '5. Listar solicitações pendentes',
        '6. Desfazer amizade',
        '7. Obter perfil com amigos',
        '8. Job: Sincronizar stats',
        '9. Admin: Validar integridade',
        '10. Recomendações (amigos em comum)',
      ],
      copiar_colar: true,
      para_backend: true,
      importancia: '★★★★ MUITO IMPORTANTE',
    },

    'TESTES-USUARIO-AMIZADE.js': {
      tamanho: '18 KB',
      tempo_leitura: '15 min',
      descricao: 'Suite completa de testes unitários e de integração',
      testes: [
        'Validações de campos',
        'Métodos de instância',
        'Métodos de classe (statics)',
        'Índices criados',
        'Performance (inserção, busca)',
        'Integridade de dados',
        'Referências',
      ],
      para_qa: true,
      comando: 'mocha TESTES-USUARIO-AMIZADE.js --timeout 5000',
      importancia: '★★★ IMPORTANTE',
    },

    'QUICK-START.js': {
      tamanho: '10 KB',
      tempo_leitura: '10 min',
      descricao: 'Script para inicializar schemas, criar índices, verificar integridade',
      funcoes: [
        'conectar() - Conectar ao MongoDB',
        'carregarSchemas() - Carregar schemas do disco',
        'criarIndices() - Criar todos os índices',
        'verificarIntegridade() - Verificar auto-amizades, refs órfãs, stats',
        'inicializar() - Executar tudo em sequência',
      ],
      uso: [
        'node QUICK-START.js (como script)',
        'const {inicializar} = require(...) (como módulo)',
      ],
      para_devops: true,
      importancia: '★★★ IMPORTANTE',
    },
  },

  diretorio: '/if-rede-backend/schemas/',
};

// ============================================================================
// PASSO A PASSO: COMO USAR ESTE PROJETO
// ============================================================================

const COMO_USAR = {
  passo_1: {
    titulo: 'LEIA PRIMEIRO (15 min)',
    arquivos: [
      {
        nome: 'RESUMO-EXECUTIVO.js',
        secoes: ['Seção 1: Problemas Resolvidos', 'Seção 2: Decisões de Design'],
        objetivo: 'Entender por que fazer desta forma',
      },
    ],
  },

  passo_2: {
    titulo: 'ESTUDE O DESIGN (30 min)',
    arquivos: [
      {
        nome: 'usuario-otimizado.schema.js',
        ler: 'Linhas 1-50 (estrutura)',
        objetivo: 'Entender estrutura de usuário',
      },
      {
        nome: 'amizade.schema.js',
        ler: 'Linhas 1-50 (estrutura)',
        objetivo: 'Entender estrutura de amizade',
      },
      {
        nome: 'INDICE-PERFORMANCE-GUIDE.js',
        ler: 'Seção 1 (índices recomendados)',
        objetivo: 'Entender por que cada índice',
      },
    ],
  },

  passo_3: {
    titulo: 'IMPLEMENTE (2-3 horas)',
    passos: [
      '1. Copie usuario-otimizado.schema.js para /schemas',
      '2. Copie amizade.schema.js para /schemas',
      '3. Copie INTEGRACAO-USUARIO-AMIZADE.js para /services',
      '4. Execute: node QUICK-START.js',
      '5. Verifique: npm run testes',
    ],
  },

  passo_4: {
    titulo: 'ADAPTE AOS CONTROLLERS (1 hora)',
    recursos: [
      {
        nome: 'EXEMPLOS-USO.js',
        descricao: 'Copie funções e adapte aos seus routers',
        foco: 'enviarSolicitacao, aceitarSolicitacao, listarAmigos',
      },
      {
        nome: 'INTEGRACAO-USUARIO-AMIZADE.js',
        descricao: 'Use ServicoAmizade em todas operações',
        foco: 'Seção 3: Serviço de Amizade',
      },
    ],
  },

  passo_5: {
    titulo: 'TESTE (1 hora)',
    arquivos: [
      {
        nome: 'TESTES-USUARIO-AMIZADE.js',
        comando: 'mocha TESTES-USUARIO-AMIZADE.js --timeout 5000',
        esperado: 'Todos testes passam',
      },
    ],
  },

  passo_6: {
    titulo: 'DEPLOY EM PRODUÇÃO',
    checklist: [
      '✓ Backup do BD antes',
      '✓ Executar QUICK-START.js em produção',
      '✓ Verificar integridade',
      '✓ Monitorar performance',
      '✓ Ativar alertas',
    ],
  },
};

// ============================================================================
// MAPA DE DECISÕES: POR QUE CADA COISA FOI FEITA ASSIM
// ============================================================================

const DECISOES = {
  'Por que coleção dedicada para amizades?': {
    alternativa: 'Arrays desnormalizados em usuários',
    problema: [
      '- Array cresce indefinidamente',
      '- Paginação complexa com $slice',
      '- Sem histórico (pendente/aceito/recusado)',
      '- Atualizar stats = modificar array inteiro',
    ],
    solucao: [
      '✓ Cada relação = 1 documento',
      '✓ Paginação fácil',
      '✓ Histórico completo',
      '✓ Atualizar stats = simples',
    ],
    arquivo: 'RESUMO-EXECUTIVO.js, Seção 1, Problema 1',
  },

  'Por que stats denormalizadas?': {
    alternativa: 'Calcular on-the-fly',
    problema: [
      '- 10.000 usuários = 10.000 queries por feed',
      '- 100ms * 10.000 = 1.000 segundos = CRASH',
    ],
    solucao: [
      '✓ Atualizar stats ao aceitar amizade',
      '✓ Sincronizar 1x por hora',
      '✓ Leitura 100x mais rápida',
    ],
    arquivo: 'RESUMO-EXECUTIVO.js, Seção 2, Problema 2',
  },

  'Por que soft delete?': {
    alternativa: 'Deletar permanentemente',
    problema: [
      '- Amizades ficam órfãs',
      '- Sem histórico',
      '- Impossível recuperar',
    ],
    solucao: [
      '✓ Marcar ativo=false',
      '✓ TTL após 1 ano',
      '✓ Referências nunca órfãs',
      '✓ Auditoria sempre possível',
    ],
    arquivo: 'RESUMO-EXECUTIVO.js, Seção 2, Problema 5',
  },

  'Por que índices compostos?': {
    alternativa: 'Índices simples',
    problema: [
      '- Query {usuarioId, status} com sort precisa sort em memória',
      '- 100.000 docs = ~500ms',
      '- Pode falhar se > 100MB',
    ],
    solucao: [
      '✓ { usuarioId: 1, status: 1, dataSolicitacao: -1 }',
      '✓ IXSCAN + SORT integrado',
      '✓ 100.000 docs = ~2ms',
    ],
    arquivo: 'INDICE-PERFORMANCE-GUIDE.js, Seção 1',
  },
};

// ============================================================================
// MATRIZ DE REFERÊNCIA RÁPIDA
// ============================================================================

const MATRIZ_RAPIDA = {
  'Preciso criar usuário novo': {
    arquivo: 'usuario-otimizado.schema.js',
    funcoes: [
      'Usuario.create({senhaHash, perfil, customizacao})',
      'usuario.compararSenha(senha)',
      'usuario.registrarAtividade()',
    ],
    exemplo: 'EXEMPLOS-USO.js (não há, é básico)',
  },

  'Preciso enviar solicitação de amizade': {
    arquivo: 'amizade.schema.js',
    funcoes: ['Amizade.enviarSolicitacao(usuarioId, amigoId)'],
    exemplo: 'EXEMPLOS-USO.js, Exemplo 1',
    performance: '< 5ms',
  },

  'Preciso aceitar solicitação': {
    arquivo: 'INTEGRACAO-USUARIO-AMIZADE.js',
    funcoes: ['ServicoAmizade.aceitar(usuarioIdQuemAceita, usuarioIdQuemSolicitou)'],
    exemplo: 'EXEMPLOS-USO.js, Exemplo 2',
    sincroniza_stats: true,
    performance: '< 10ms',
  },

  'Preciso listar amigos': {
    arquivo: 'amizade.schema.js + EXEMPLOS-USO.js',
    funcoes: [
      'Amizade.listarAmigos(usuarioId)',
      'db.amizades.aggregate(pipelineListarAmigosComStats)',
    ],
    exemplo: 'EXEMPLOS-USO.js, Exemplo 3',
    performance: '< 5ms (com índice)',
    sem_indice: '> 100ms (ruim!)',
  },

  'Preciso verificar se são amigos': {
    arquivo: 'amizade.schema.js',
    funcoes: ['Amizade.saoAmigos(usuarioIdA, usuarioIdB)'],
    exemplo: 'EXEMPLOS-USO.js, Exemplo 4',
    performance: '< 3ms',
  },

  'Preciso desfazer amizade': {
    arquivo: 'INTEGRACAO-USUARIO-AMIZADE.js',
    funcoes: ['ServicoAmizade.desfazer(usuarioIdA, usuarioIdB)'],
    exemplo: 'EXEMPLOS-USO.js, Exemplo 6',
    sincroniza_stats: true,
    performance: '< 10ms',
  },

  'Preciso buscar usuários': {
    arquivo: 'usuario-otimizado.schema.js',
    funcoes: [
      'Usuario.encontrarPorEmail(email)',
      'Usuario.buscarPorTexto(termo)',
      'Usuario.find({ativo: true, ...})',
    ],
    exemplo: 'usuario-otimizado.schema.js (linhas 355-374)',
    performance: '< 5ms (com índice)',
  },

  'Preciso sincronizar stats': {
    arquivo: 'INTEGRACAO-USUARIO-AMIZADE.js + EXEMPLOS-USO.js',
    funcoes: ['ServicoAmizade.sincronizarStats(usuarioId)'],
    exemplo: 'EXEMPLOS-USO.js, Exemplo 8',
    uso: 'Job 1x por hora',
  },

  'Preciso validar integridade': {
    arquivo: 'INTEGRACAO-USUARIO-AMIZADE.js + EXEMPLOS-USO.js',
    funcoes: ['validarIntegridadeAmizades()'],
    exemplo: 'EXEMPLOS-USO.js, Exemplo 9',
    uso: 'Admin apenas, manual ou cron',
  },
};

// ============================================================================
// DIAGRAMA DE FLUXO: OPERAÇÃO DE AMIZADE
// ============================================================================

const FLUXO_AMIZADE = `
┌─────────────────────────────────────────────────────────────────────┐
│ FLUXO DE ESTADOS: AMIZADE                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [NOVO] →  usuarioA.enviarSolicitacao(usuarioB)                   │
│    ↓                                                                │
│    └→  Amizade {                                                   │
│         usuarioId: usuarioB  (recebedor)                           │
│         amigoId: usuarioA    (remetente)                           │
│         status: 'pendente'   ← AQUI!                               │
│         dataSolicitacao: now                                       │
│       }                                                            │
│    ↓                                                                │
│  [PENDENTE] ← Notificar usuarioB                                  │
│    ↓                                                                │
│    ├→ usuarioB.aceitar()                                           │
│    │    ↓                                                           │
│    │    └→ status: 'aceito'  ← AMIGOS AGORA!                      │
│    │        dataResposta: now                                      │
│    │        stats.total_amigos++ (ambos)                           │
│    │    ↓                                                           │
│    │  [ACEITO] ← Notificar usuarioA                               │
│    │                                                               │
│    └→ usuarioB.recusar()                                           │
│         ↓                                                           │
│         └→ status: 'recusado'  ← REJEITADO                         │
│             dataResposta: now                                      │
│             TTL expira em 90 dias                                  │
│    ↓                                                                │
│  [RECUSADO] ← Sem notificação (opcional)                          │
│    ↓                                                                │
│  [DELETADO] (após 90 dias, se TTL ativo)                          │
│                                                                    │
│  QUERY IMPORTANTE:                                                │
│  db.amizades.findOne({                                            │
│    $or: [                                                         │
│      {usuarioId: A, amigoId: B, status: 'aceito'},               │
│      {usuarioId: B, amigoId: A, status: 'aceito'}                │
│    ]                                                              │
│  }) → Verifica se são amigos em qualquer direção                 │
│                                                                    │
└─────────────────────────────────────────────────────────────────────┘
`;

// ============================================================================
// EXPORTAR ÍNDICE
// ============================================================================

module.exports = {
  titulo: 'ÍNDICE COMPLETO: USUARIO + AMIZADE',
  estrutura: INDEX,
  como_usar: COMO_USAR,
  decisoes: DECISOES,
  matriz_rapida: MATRIZ_RAPIDA,
  fluxo: FLUXO_AMIZADE,

  resumo_executivo: 'COMECE AQUI: Leia RESUMO-EXECUTIVO.js',
  tempo_total: '5-6 horas (leitura + implementação + testes)',
  

  arquivos_por_prioridade: [
    {
      prioridade: '★★★★★ CRÍTICO',
      arquivo: 'RESUMO-EXECUTIVO.js',
      tempo: '20 min',
    },
    {
      prioridade: '★★★★★ CRÍTICO',
      arquivo: 'usuario-otimizado.schema.js',
      tempo: '15 min',
    },
    {
      prioridade: '★★★★★ CRÍTICO',
      arquivo: 'amizade.schema.js',
      tempo: '15 min',
    },
    {
      prioridade: '★★★★ MUITO IMPORTANTE',
      arquivo: 'EXEMPLOS-USO.js',
      tempo: '20 min',
    },
    {
      prioridade: '★★★★ MUITO IMPORTANTE',
      arquivo: 'INTEGRACAO-USUARIO-AMIZADE.js',
      tempo: '15 min',
    },
    {
      prioridade: '★★★ IMPORTANTE',
      arquivo: 'INDICE-PERFORMANCE-GUIDE.js',
      tempo: '20 min (DBA)',
    },
    {
      prioridade: '★★★ IMPORTANTE',
      arquivo: 'TESTES-USUARIO-AMIZADE.js',
      tempo: '15 min (QA)',
    },
    {
      prioridade: '★★★ IMPORTANTE',
      arquivo: 'QUICK-START.js',
      tempo: '10 min (DevOps)',
    },
  ],

  equipes: {
    backend: ['RESUMO-EXECUTIVO', 'amizade.schema', 'EXEMPLOS-USO', 'INTEGRACAO'],
    dba: ['RESUMO-EXECUTIVO', 'INDICE-PERFORMANCE-GUIDE', 'QUICK-START'],
    qa: ['TESTES-USUARIO-AMIZADE', 'EXEMPLOS-USO'],
    devops: ['QUICK-START', 'RESUMO-EXECUTIVO'],
  },
};

/*
 * ============================================================================
 * INSTRUÇÕES FINAIS
 * ============================================================================
 * 
 * 1. LEIA PRIMEIRO
 *    → RESUMO-EXECUTIVO.js (entender decisões)
 *    → Este arquivo (INDICE-COMPLETO.js)
 * 
 * 2. ANTES DE CODIFICAR
 *    → Leia usuario-otimizado.schema.js (estrutura)
 *    → Leia amizade.schema.js (estrutura)
 * 
 * 3. AO CODIFICAR
 *    → Use EXEMPLOS-USO.js como referência
 *    → Use INTEGRACAO-USUARIO-AMIZADE.js para lógica complexa
 * 
 * 4. ANTES DE DEPLOY
 *    → Execute QUICK-START.js
 *    → Rode TESTES-USUARIO-AMIZADE.js
 *    → Consulte INDICE-PERFORMANCE-GUIDE.js (DBA)
 * 
 * 5. EM PRODUÇÃO
 *    → Monitore queries com explain()
 *    → Execute job de sincronização 1x/hora
 *    → Verifique integridade diariamente
 * 
 * ============================================================================
 */
