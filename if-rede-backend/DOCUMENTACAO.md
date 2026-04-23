# IF REDE - Documentação Completa do Backend MongoDB

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Diretórios](#estrutura-de-diretórios)
3. [Modelos de Dados](#modelos-de-dados)
4. [Padrões de Design MongoDB](#padrões-de-design-mongodb)
5. [Como Usar](#como-usar)
6. [Exemplos de Código](#exemplos-de-código)
7. [Índices e Performance](#índices-e-performance)
8. [Sistema de Moderação](#sistema-de-moderação)

---

## Visão Geral

**IF REDE** é uma rede social acadêmica do Instituto Federal (IFC) construída com:
- **MongoDB** como banco de dados NoSQL
- **Mongoose** como ODM (Object Document Mapper)
- **Node.js** como runtime

O projeto demonstra práticas profissionais de design de banco de dados MongoDB, incluindo:
- ✅ Padrões de Design (Attribute Pattern, Bucket Pattern, TTL)
- ✅ Validações robustas
- ✅ Índices otimizados
- ✅ Segurança de dados
- ✅ Auditoria de moderação

---

## Estrutura de Diretórios

```
if-rede-backend/
├── schemas/                          # Definições dos schemas
│   ├── usuario.schema.js             # Usuários (estudante, egresso, servidor)
│   ├── postagem.schema.js            # Postagens (áudio, imagem, texto)
│   └── atividade-moderacao.schema.js # Log de ações de moderadores
├── models/
│   └── index.js                      # Exporta os modelos Mongoose
├── db/
│   └── connection.js                 # Conexão e inicialização do BD
├── exemplos-uso.js                   # Exemplos práticos de uso
├── package.json                      # Dependências do projeto
└── DOCUMENTACAO.md                   # Este arquivo
```

---

## Modelos de Dados

### 1️⃣ Usuario (Usuários)

Representa usuários da plataforma com informações de perfil, customização e configurações.

#### Coleção: `usuarios`

```javascript
{
  _id: ObjectId,
  
  // Autenticação
  senha: String,
  
  // Perfil do usuário
  perfil: {
    nome: String,              // Nome completo
    email: String,             // Único e verificado
    matricula: String,         // Identificador institucional
    bio: String,               // Biografia pessoal
    status_vinculo: String,    // estudante | egresso | servidor
    privacidade: String,       // publico | privado
    data_criacao: Date
  },
  
  // Personalização visual (Attribute Pattern)
  customizacao: {
    cor_fundo: String,         // Cor HEX (#RRGGBB)
    cor_botoes: String,        // Cor HEX
    banner_url: String,        // URL do banner personalizado
    medalhas: [ObjectId],      // Array de IDs de medalhas
    tema: String               // light | dark
  },
  
  // Configurações de conta
  configuracoes: {
    mod_voluntario: Boolean,   // É moderador voluntário?
    melhores_amigos: [ObjectId], // Lista de melhores amigos
    permitir_mensagens: Boolean,
    notificacoes: {
      likes: Boolean,
      comentarios: Boolean,
      seguidores: Boolean,
      reposts: Boolean
    },
    egresso_limitado: Boolean  // Egressos têm limite de posts
  },
  
  // Estatísticas (denormalizadas para performance)
  stats: {
    total_seguidores: Number,
    total_seguindo: Number,
    total_postagens: Number,
    total_moderacoes: Number
  },
  
  // Gerenciamento de conta
  ativo: Boolean,
  ultima_atividade: Date,
  suspenso_ate: Date,         // Data de fim da suspensão
  suspensao_motivo: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

#### Métodos Úteis do Usuario

```javascript
// Verificações
usuario.estaSuspenso()          // Retorna boolean
usuario.ehModerador()           // Retorna boolean
usuario.ehEgresso()             // Retorna boolean

// Ações
await usuario.suspender(data, motivo)
await usuario.removerSuspensao()
await usuario.registrarAtividade()
```

#### Statics (Métodos de Classe)

```javascript
// Buscar moderadores
const mods = await Usuario.encontrarModeadores()

// Buscar egressos
const egressos = await Usuario.encontrarEgressos()

// Buscar por texto
const resultados = await Usuario.buscarPorTexto("termo de busca")
```

---

### 2️⃣ Postagem (Posts)

Representa postagens na rede social com suporte a múltiplos tipos de conteúdo (áudio, imagem, texto).

#### Coleção: `postagens`

```javascript
{
  _id: ObjectId,
  
  // Autor da postagem
  autor_id: ObjectId,          // Referência a Usuario
  
  // Informações básicas
  titulo: String,              // Título obrigatório
  descricao: String,           // Descrição curta
  
  // TIPO DE CONTEÚDO (Polimorfismo)
  tipo: String,                // audio | imagem | texto
  subtipo: String,             // "Poema", "Podcast", "Pintura", etc.
  
  // Conteúdo (flexível por tipo)
  conteudo: {
    url: String,               // URL no S3/Cloudinary
    texto_longo: String,       // Até 5000 caracteres
    sensivel: Boolean,         // Conteúdo sensível?
    dimensoes: {
      largura: Number,
      altura: Number
    },
    duracao_segundos: Number,  // Para áudio/vídeo
    metadados: Mixed           // Customizável por tipo
  },
  
  // Configurações de publicação
  config: {
    eh_rascunho: Boolean,      // ← IMPORTANTE para TTL
    visibilidade: String,      // todos | seguidores | melhores_amigos
    comentarios_ativos: Boolean,
    comentarios_moderados: Boolean,
    requer_permissao: Boolean,
    permissao_de: String
  },
  
  // Informações de repost (quando compartilha outro post)
  repost_info: {
    original_id: ObjectId,     // null se for post original
    comentario_repost: String,
    repost_count: Number
  },
  
  // Estatísticas (Bucket Pattern - denormalizadas)
  stats: {
    likes: Number,
    usuarios_que_curtiram: [ObjectId],  // Para evitar curtidas duplicadas
    comentarios_count: Number,
    shares: Number,
    visualizacoes: Number
  },
  
  // Metadados sociais
  tags: [String],              // Até 20 hashtags
  categorias: [String],        // projetos | eventos | artes | tecnologia | etc.
  
  // TTL INDEX (Auto-delete em 14 dias se rascunho)
  excluir_em: Date,            // ← CRÍTICO para funcionalidade TTL
  
  // Denúncia e moderação
  denuncias: {
    total: Number,
    motivos: [
      {
        usuario_id: ObjectId,
        motivo: String,
        data: Date
      }
    ],
    bloqueado: Boolean,
    motivo_bloqueio: String
  },
  
  // Status de moderação
  status_moderacao: String,    // pendente | aprovado | rejeitado | em_revisao
  moderado_por: ObjectId,      // Referência a Usuario
  
  createdAt: Date,
  updatedAt: Date
}
```

#### Métodos Úteis da Postagem

```javascript
// Gerenciar estado
await postagem.publicar()              // Remove rascunho
await postagem.voltarParaRascunho()    // Volta para rascunho

// Interações sociais
await postagem.adicionarCurtida(usuarioId)
await postagem.removerCurtida(usuarioId)
await postagem.incrementarComentarios()
await postagem.decrementarComentarios()
await postagem.incrementarVisualizacoes()

// Moderação
await postagem.bloquear("Motivo")      // Bloqueia a postagem
await postagem.desbloquear()           // Desbloqueia
```

#### Statics

```javascript
// Postagens públicas de um autor
const posts = await Postagem.postagem_publica_por_autor(autorId)

// Rascunhos de um usuário
const rascunhos = await Postagem.rascunhos_do_usuario(usuarioId)

// Postagens bloqueadas (para moderação)
const bloqueadas = await Postagem.postagens_bloqueadas()

// Pendentes de moderação
const pendentes = await Postagem.postagens_pendentes_moderacao()

// Por tipo
const audios = await Postagem.por_tipo('audio')
```

---

### 3️⃣ AtividadeModeração (Log de Moderação)

Registra todas as ações dos moderadores voluntários para auditoria e cálculo de horas.

#### Coleção: `atividades_moderacao`

```javascript
{
  _id: ObjectId,
  
  // Informações do moderador
  moderador_id: ObjectId,          // Referência a Usuario
  moderador_nome: String,          // Snapshot para auditoria
  moderador_matricula: String,     // Snapshot
  
  // Ação realizada
  tipo_acao: String,               // comentario_aprovado | comentario_rejeitado
                                   // postagem_aprovada | postagem_rejeitada
                                   // postagem_bloqueada | usuario_suspenso | etc.
  descricao: String,               // Detalhes da ação
  
  // Objeto afetado
  objeto_tipo: String,             // postagem | comentario | usuario
  objeto_id: ObjectId,             // ID do objeto afetado
  objeto_snapshot: Mixed,          // Snapshot do objeto (auditoria)
  
  // CÁLCULO DE HORAS (essencial para complementares)
  tempo_estimado_minutos: Number,  // Tempo gasto (1-120 min)
  horas: Number,                   // Convertido: minutos / 60
  
  // Resultado da ação
  resultado: String,               // sucesso | parcial | erro | sem_acao
  motivo_rejeicao: String,         // Se rejeitado/bloqueado
  tags: [String],                  // spam | linguagem-inapropriada | etc.
  
  // Auditoria
  data_acao: Date,                 // Timestamp da ação
  ip_origem: String,               // IP do moderador
  user_agent: String,              // Navegador/cliente
  
  // Revisão por outro moderador
  revisado: Boolean,               // Foi revisado?
  revisado_por: ObjectId,          // Quem revisou
  resultado_revisao: String,       // confirmado | revertido | escalado
  comentario_revisao: String
}
```

#### Métodos Úteis

```javascript
// Marcar como revisada
await atividade.marcar_como_revisada(
  moderadorId,
  "confirmado",
  "Aprovado pela revisão"
)

// Converter para formato legível
const tempo = atividade.tempo_formatado()  // "0h5m"
```

#### Statics

```javascript
// Horas de um moderador em um período
const horas = await AtividadeModeracacao.calcular_horas_moderador(
  moderadorId,
  dataInicio,
  dataFim
)

// Relatório de horas do mês
const relatorio = await AtividadeModeracacao.relatorio_horas_mes()

// Ações pendentes de revisão
const pendentes = await AtividadeModeracacao.pendentes_revisao()

// Histórico de ações sobre um objeto
const historico = await AtividadeModeracacao.historico_objeto(
  objetoId,
  "postagem"
)

// Estatísticas gerais
const stats = await AtividadeModeracacao.estatisticas_gerais()
```

---

## Padrões de Design MongoDB

### 1. Attribute Pattern (Customização)

**Uso:** Campos opcionais que variam por documento

**Exemplo:** Campo `customizacao` do Usuario

```javascript
customizacao: {
  cor_fundo: "#E8F4F8",      // Cores personalizadas
  cor_botoes: "#0066CC",     // Para cada usuário
  banner_url: "...",
  tema: "light",
  medalhas: [...]            // Array de conquistas
}
```

**Vantagem:** Permite personalização sem alterar schema

---

### 2. Bucket Pattern (Estatísticas)

**Uso:** Denormalizar dados frequentemente acessados

**Exemplo:** Campo `stats` de Postagem

```javascript
stats: {
  likes: 42,
  usuarios_que_curtiram: [ObjectId, ObjectId, ...],  // Para validar duplicatas
  comentarios_count: 15,
  shares: 5,
  visualizacoes: 234
}
```

**Vantagem:** Acesso rápido sem agregações

---

### 3. TTL Index (Time-To-Live)

**Uso:** Deletar automaticamente documentos após X dias

**Exemplo:** Rascunhos expiram em 14 dias

```javascript
// No schema:
excluir_em: Date   // Preenchido automaticamente se rascunho

// No MongoDB:
db.postagens.createIndex(
  { excluir_em: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { "config.eh_rascunho": true }
  }
)
```

**Vantagem:** Limpeza automática sem cron jobs

---

### 4. Polimorfismo

**Uso:** Um schema para vários tipos de dados

**Exemplo:** Postagem com tipo audio/imagem/texto

```javascript
tipo: "audio",
conteudo: {
  url: "...",
  duracao_segundos: 3600,
  metadados: {
    artista: "João",
    genero: "Educacional"
  }
}

// vs

tipo: "imagem",
conteudo: {
  url: "...",
  dimensoes: { largura: 1920, altura: 1080 },
  metadados: {
    tecnica: "Aquarela",
    material: "Papel"
  }
}
```

**Vantagem:** Flexibilidade sem múltiplas coleções

---

## Como Usar

### Instalação

```bash
# Instalar dependências
npm install

# Instalar MongoDB localmente (opcional)
# No Windows: https://www.mongodb.com/try/download/community
# macOS: brew install mongodb-community
```

### Conectar ao Banco

```javascript
const db = require('./db/connection');

// Conectar
await db.conectar();

// ... usar os modelos

// Desconectar
await db.desconectar();
```

### Variáveis de Ambiente

Crie um arquivo `.env`:

```
MONGODB_URI=mongodb://localhost:27017/if-rede
NODE_ENV=development
```

---

## Exemplos de Código

### Criar Usuário

```javascript
const { Usuario } = require('./models');

const usuario = await Usuario.create({
  senha: await bcrypt.hash('minha-senha', 10),
  perfil: {
    nome: "João Silva",
    email: "joao@ifc.edu.br",
    matricula: "20201234",
    status_vinculo: "estudante"
  }
});
```

### Criar Postagem (Rascunho)

```javascript
const postagem = await Postagem.create({
  autor_id: usuarioId,
  titulo: "Meu Poema",
  tipo: "texto",
  subtipo: "Poema",
  conteudo: {
    texto_longo: "Lorem ipsum...",
    sensivel: false
  },
  config: {
    eh_rascunho: true,  // ← Vai expirar em 14 dias
    visibilidade: "todos"
  }
});
```

### Publicar Rascunho

```javascript
await postagem.publicar();
// Remove eh_rascunho: true
// Define status_moderacao: "pendente"
// Remove excluir_em (para não expirar mais)
```

### Buscar Postagens de um Autor

```javascript
const posts = await Postagem.postagem_publica_por_autor(usuarioId);
// Retorna posts publicados (não rascunhos)
// Não retorna bloqueados
```

### Registrar Atividade de Moderação

```javascript
const atividade = await AtividadeModeracacao.create({
  moderador_id: moderadorId,
  moderador_nome: "Maria Costa",
  moderador_matricula: "20211456",
  tipo_acao: "postagem_aprovada",
  objeto_tipo: "postagem",
  objeto_id: postagemId,
  tempo_estimado_minutos: 5
});
```

### Relatório de Horas

```javascript
// Horas do moderador neste mês
const relatorio = await AtividadeModeracacao.relatorio_horas_mes();

// Resultado:
[
  {
    _id: ObjectId,
    moderador_nome: "Maria Costa",
    total_minutos: 120,    // 2 horas
    total_acoes: 24
  }
]
```

### Curtir Postagem

```javascript
await postagem.adicionarCurtida(usuarioId);
// Incrementa stats.likes
// Adiciona usuarioId em usuarios_que_curtiram
```

---

## Índices e Performance

### Índices Criados Automaticamente

#### Usuarios

```javascript
{ 'perfil.email': 1 }          // Busca por email (UNIQUE)
{ 'perfil.matricula': 1 }      // Busca por matrícula (UNIQUE)
{ 'perfil.nome': 'text' }      // Busca de texto
{ 'perfil.status_vinculo': 1 } // Filtro por tipo
{ 'configuracoes.mod_voluntario': 1 } // Encontrar moderadores
```

#### Postagens

```javascript
{ excluir_em: 1 }                         // TTL para rascunhos
{ autor_id: 1, 'config.eh_rascunho': -1 } // Posts do autor
{ tipo: 1, 'config.eh_rascunho': -1 }     // Posts por tipo
{ createdAt: -1, 'config.eh_rascunho': -1 } // Timeline
{ 'config.visibilidade': 1 }              // Filtro por visibilidade
{ titulo: 'text', descricao: 'text' }    // Busca full-text
```

#### AtividadeModeração

```javascript
{ moderador_id: 1, data_acao: -1 }    // Relatório por moderador
{ data_acao: -1 }                     // Timeline
{ tipo_acao: 1 }                      // Filtro por tipo
{ objeto_id: 1, objeto_tipo: 1 }      // Histórico por objeto
```

### Dicas de Performance

1. **Use projeções** para retornar apenas campos necessários
   ```javascript
   Postagem.find({}, { titulo: 1, autor_id: 1, _id: 0 })
   ```

2. **Limite resultados** para paginação
   ```javascript
   Postagem.find({}).limit(20).skip(20)
   ```

3. **Aggregate** para cálculos complexos
   ```javascript
   Postagem.aggregate([
     { $match: { ... } },
     { $group: { _id: "$tipo", count: { $sum: 1 } } }
   ])
   ```

---

## Sistema de Moderação

### Fluxo de Moderação

```
Usuário publica postagem
         ↓
status_moderacao: "pendente"
         ↓
Moderador revisa (AtividadeModeracacao criada)
         ↓
postagem.publicar() ou postagem.bloquear()
         ↓
status_moderacao: "aprovado" ou "rejeitado"
         ↓
Postagem visível ou bloqueada no feed
```

### Tipos de Ações

```
comentario_aprovado       - Aprova comentário pendente
comentario_rejeitado      - Rejeita comentário
postagem_aprovada         - Aprova postagem
postagem_rejeitada        - Rejeita postagem
postagem_bloqueada        - Bloqueia postagem existente
usuario_suspenso          - Suspende usuário
usuario_remover_suspensao - Remove suspensão
filtro_palavras_acionado  - Acionou filtro automático
conteudo_sensivel_marcado - Marcou como sensível
investigacao_aberta       - Investigação de denúncia
investigacao_fechada      - Fechou investigação
```

### Cálculo de Horas Complementares

Cada ação tem um tempo estimado (padrão):

| Ação | Tempo |
|------|-------|
| Comentário aprovado | 2 min |
| Comentário rejeitado | 3 min |
| Postagem aprovada | 5 min |
| Postagem rejeitada | 8 min |
| Postagem bloqueada | 10 min |
| Usuário suspenso | 15 min |
| Investigação aberta | 20 min |

---

## Regras Especiais por Tipo de Vínculo

### Estudante
- ✅ Sem limites de postagem
- ✅ Todos os tipos de conteúdo
- ✅ Pode ser moderador voluntário

### Egresso
- ⚠️ Máximo 2 postagens por semana
- ✅ Acesso leitura completo
- ⚠️ Moderação mais rigorosa

### Servidor
- ✅ Sem limites
- ✅ Acesso administrativo
- ✅ Pode moderar

---

## Troubleshooting

### Problema: Rascunhos não expiram

**Solução:** Verificar se o índice TTL foi criado
```javascript
// No MongoDB Shell:
db.postagens.getIndexes()

// Procure por:
{
  "key": { "excluir_em": 1 },
  "name": "ttl_rascunhos_14_dias",
  "expireAfterSeconds": 0
}
```

### Problema: Moderadores não aparecem

**Solução:** Verificar se `mod_voluntario: true`
```javascript
const mods = await Usuario.find({ 'configuracoes.mod_voluntario': true })
```

### Problema: Curtidas duplicadas

**Solução:** Usar `usuarios_que_curtiram` como validação
```javascript
if (!postagem.stats.usuarios_que_curtiram.includes(usuarioId)) {
  // Não foi curtida ainda
}
```

---

## Próximos Passos

1. **Implementar autenticação** (JWT)
2. **Criar routes Express** para CRUD
3. **Adicionar validação** (middleware)
4. **Testes unitários** (Jest)
5. **Documentação API** (Swagger)
6. **Frontend** (React/Vue)

---

## Licença

MIT

---

**Última atualização:** 17 de Abril, 2026
