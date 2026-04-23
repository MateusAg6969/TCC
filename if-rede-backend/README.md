# 🎓 IF REDE - Rede Social Acadêmica

> Plataforma de rede social para o Instituto Federal com suporte a moderação voluntária, horas complementares e conteúdo polimórfico

## 📋 Sumário

- [Visão Geral](#visão-geral)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação Rápida](#instalação-rápida)
- [Arquivos Principais](#arquivos-principais)
- [Como Começar](#como-começar)
- [Padrões MongoDB](#padrões-mongodb)
- [API de Modelos](#api-de-modelos)
- [Suporte e Contribuição](#suporte-e-contribuição)

---

## 🚀 Visão Geral

IF REDE é uma **rede social acadêmica** completa construída com:
- **MongoDB** - Banco NoSQL escalável
- **Mongoose** - ODM type-safe para MongoDB
- **Node.js** - Runtime JavaScript
- **Padrões de Design MongoDB** - Otimizado para escala

### ✨ Funcionalidades Principais

✅ **Usuários Personalizados**
- Suporte a 3 tipos de vínculo (estudante, egresso, servidor)
- Customização visual (cores, banner, medalhas)
- Sistema de privacidade (público/privado)

✅ **Postagens Polimórficas**
- Áudio, imagem e texto em um único schema
- Rascunhos com TTL (expiram em 14 dias automaticamente)
- Visibilidade configurável (todos, seguidores, melhores amigos)

✅ **Moderação Voluntária**
- Log completo de ações de moderadores
- Cálculo automático de horas complementares
- Relatórios por período

✅ **Índices Otimizados**
- Buscas rápidas por tipo de vínculo, autor, data
- TTL Index para limpeza automática
- Índices únicos para segurança

---

## 📁 Estrutura do Projeto

```
if-rede-backend/
├── schemas/
│   ├── usuario.schema.js             # Schema de usuários
│   ├── postagem.schema.js            # Schema de postagens
│   └── atividade-moderacao.schema.js # Log de moderação
├── models/
│   └── index.js                      # Exporta modelos Mongoose
├── db/
│   └── connection.js                 # Conexão e inicialização
├── exemplos-uso.js                   # 14 exemplos práticos
├── DOCUMENTACAO.md                   # Docs completa (10+ páginas)
├── GUIA-TECNICO.js                   # Visão técnica detalhada
├── .env.example                      # Template de variáveis
├── package.json                      # Dependências
└── README.md                          # Este arquivo
```

---

## ⚡ Instalação Rápida

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar banco de dados
```bash
# Copiar template
cp .env.example .env

# Editar .env com seus dados:
# MONGODB_URI=mongodb://localhost:27017/if-rede
```

### 3. Executar exemplos
```bash
npm start
# ou com nodemon (hot reload):
npm run dev
```

---

## 📚 Arquivos Principais

### 🏗️ Schemas (Estrutura)

#### `usuario.schema.js` - 300+ linhas
Define usuários com:
- Perfil (nome, email, matrícula, tipo de vínculo)
- Customização (cores, banner, medalhas)
- Configurações (moderador, melhores amigos, notificações)
- Estatísticas denormalizadas

**Métodos:**
- `estaSuspenso()` - Verifica suspensão
- `ehModerador()` - Verifica se é moderador
- `suspender(data, motivo)` - Suspende usuário
- `registrarAtividade()` - Atualiza última atividade

#### `postagem.schema.js` - 450+ linhas
Define postagens polimórficas com:
- Suporte a 3 tipos (áudio, imagem, texto)
- Conteúdo flexível com metadados
- Config de visibilidade e comentários
- Rascunhos com TTL de 14 dias
- Estatísticas denormalizadas

**Métodos:**
- `publicar()` - Remove rascunho e submete para moderação
- `adicionarCurtida(usuarioId)` - Incrementa likes
- `incrementarVisualizacoes()` - Registra views
- `bloquear(motivo)` - Bloqueia postagem

#### `atividade-moderacao.schema.js` - 350+ linhas
Registra ações de moderadores:
- Tipo de ação (aprovação, rejeição, bloqueio, etc)
- Tempo estimado para cálculo de horas
- Objeto afetado (postagem, comentário, usuário)
- Auditoria completa (IP, user agent, data)

**Métodos:**
- `marcar_como_revisada(por, resultado, comentario)` - Marca revisão
- `tempo_formatado()` - Converte minutos em HHmm

---

### 🔌 Models (`models/index.js`)
```javascript
const { Usuario, Postagem, AtividadeModeracacao } = require('./models')
```

Exporta 3 modelos Mongoose prontos para usar em toda a aplicação.

---

### 🗄️ Conexão (`db/connection.js`)

Gerencia conexão com MongoDB:
```javascript
await db.conectar()    // Conecta e cria índices
await db.desconectar() // Desconecta graciosamente
await db.limpar_banco()// Limpa dados (dev/test)
```

**Features:**
- Criação automática de índices TTL
- Event listeners para debugging
- Graceful shutdown (Ctrl+C)
- Tratamento de erros robusto

---

### 📖 Exemplos (`exemplos-uso.js`)

**14 exemplos práticos** mostrando:
1. Criar usuário
2. Criar moderador
3. Criar rascunho
4. Publicar rascunho
5. Criar postagem de áudio
6. Curtir postagem
7. Registrar visualização
8. Registrar moderação
9. Buscar postagens do usuário
10. Encontrar rascunhos
11. Encontrar moderadores
12. Gerar relatório de horas
13. Suspender usuário
14. Remover suspensão

Execute com:
```bash
npm start
```

---

## 🎯 Como Começar

### Importar modelos
```javascript
const { Usuario, Postagem, AtividadeModeracacao } = require('./models');
const db = require('./db/connection');

// Conectar
await db.conectar();

// Usar modelos...
await Usuario.create({ ... });

// Desconectar
await db.desconectar();
```

### Criar usuário
```javascript
const usuario = await Usuario.create({
  senha: "hashed_password",
  perfil: {
    nome: "João Silva",
    email: "joao@ifc.edu.br",
    matricula: "20201234",
    status_vinculo: "estudante"
  }
});
```

### Criar e publicar postagem
```javascript
const rascunho = await Postagem.create({
  autor_id: usuario._id,
  titulo: "Meu Poema",
  tipo: "texto",
  conteudo: { texto_longo: "..." },
  config: { eh_rascunho: true }
});

// Publicar
await rascunho.publicar();
// TTL é removido para não expirar
// status_moderacao muda para "pendente"
```

### Registrar atividade de moderação
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

// Horas = 5 minutos / 60 = 0.08 horas
```

---

## 🏛️ Padrões MongoDB

### 1. Attribute Pattern
Permite campos opcionais/dinâmicos

```javascript
// Usuario pode ter qualquer combinação de customização
customizacao: {
  cor_fundo: "#FFF",
  cor_botoes: "#000",
  tema: "light",
  medalhas: [...]
}
```

### 2. Bucket Pattern
Denormaliza dados frequentemente acessados

```javascript
stats: {
  likes: 42,
  usuarios_que_curtiram: [ObjectId, ...],
  comentarios_count: 15,
  visualizacoes: 234
}
// Rápido acessar sem aggregation
```

### 3. TTL Index
Auto-delete de documentos antigos

```javascript
// Rascunhos expiram em 14 dias automaticamente
db.postagens.createIndex(
  { excluir_em: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { "config.eh_rascunho": true } }
)
```

### 4. Polimorfismo
Um schema para vários tipos

```javascript
// Mesma coleção para áudio/imagem/texto
postagem = {
  tipo: "audio",
  conteudo: { url: "...", duracao_segundos: 3600 }
}
// vs
postagem = {
  tipo: "imagem",
  conteudo: { url: "...", dimensoes: { ... } }
}
```

---

## 🔧 API de Modelos

### Usuario

**Métodos de Instância:**
```javascript
usuario.estaSuspenso() → Boolean
usuario.ehModerador() → Boolean
usuario.ehEgresso() → Boolean
usuario.suspender(data, motivo) → Promise
usuario.removerSuspensao() → Promise
usuario.registrarAtividade() → Promise
```

**Statics:**
```javascript
Usuario.encontrarModeadores() → [Usuario]
Usuario.encontrarEgressos() → [Usuario]
Usuario.buscarPorTexto(termo) → [Usuario]
```

### Postagem

**Métodos de Instância:**
```javascript
postagem.publicar() → Promise
postagem.voltarParaRascunho() → Promise
postagem.adicionarCurtida(usuarioId) → Promise
postagem.removerCurtida(usuarioId) → Promise
postagem.incrementarComentarios() → Promise
postagem.decrementarComentarios() → Promise
postagem.incrementarVisualizacoes() → Promise
postagem.bloquear(motivo) → Promise
postagem.desbloquear() → Promise
```

**Statics:**
```javascript
Postagem.postagem_publica_por_autor(autorId) → [Postagem]
Postagem.rascunhos_do_usuario(usuarioId) → [Postagem]
Postagem.postagens_bloqueadas() → [Postagem]
Postagem.postagens_pendentes_moderacao() → [Postagem]
Postagem.por_tipo(tipo) → [Postagem]
```

### AtividadeModeración

**Statics:**
```javascript
AtividadeModeracacao.calcular_horas_moderador(id, inicio, fim) → Number
AtividadeModeracacao.relatorio_horas_mes() → [RelatórioDados]
AtividadeModeracacao.pendentes_revisao() → [Atividade]
AtividadeModeracacao.historico_objeto(id, tipo) → [Atividade]
AtividadeModeracacao.estatisticas_gerais() → StatsGerais
```

---

## 📖 Documentação

### 📘 DOCUMENTACAO.md
Documentação técnica completa com:
- Descrição detalhada de cada coleção
- Exemplos de código
- Índices e performance
- Sistema de moderação
- Troubleshooting

**Leia com:** `cat DOCUMENTACAO.md`

### 📗 GUIA-TECNICO.js
Visão arquitetural com diagramas ASCII:
- Relacionamentos entre coleções
- Fluxos de dados
- Índices críticos
- Padrões de design
- Checklist de implementação

**Leia com:** `cat GUIA-TECNICO.js`

### 📚 Comentários nos Schemas
Cada schema possui:
- Explicações sobre cada campo
- Exemplos de uso
- Validações documentadas
- Índices explicados

---

## 🔐 Segurança

✅ **Validação de Tipos:** Toda entrada é validada no schema
✅ **Unique Indexes:** Email e matrícula são únicos
✅ **Imutabilidade:** Campos como `autor_id` não podem ser alterados
✅ **Senhas:** Campo `select: false` para não retornar por padrão
✅ **Enum Validation:** Apenas valores permitidos
✅ **Regex Patterns:** Email, URL, HEX color validados

---

## 🚀 Próximos Passos

1. **Express API**
   ```javascript
   app.post('/usuarios', async (req, res) => {
     const usuario = await Usuario.create(req.body);
     res.json(usuario);
   });
   ```

2. **Autenticação (JWT)**
   ```javascript
   const token = jwt.sign({ userId: usuario._id }, JWT_SECRET);
   ```

3. **Autorização (Middleware)**
   ```javascript
   app.use(verificarModerador); // Apenas moderadores
   ```

4. **Testes (Jest)**
   ```bash
   npm test
   ```

5. **Deploy**
   ```bash
   # Heroku
   git push heroku main
   
   # AWS/Docker
   docker build -t if-rede .
   docker run if-rede
   ```

---

## 📋 Ambiente (variáveis)

Crie arquivo `.env` a partir de `.env.example`:

```bash
MONGODB_URI=mongodb://localhost:27017/if-rede
NODE_ENV=development
JWT_SECRET=sua_chave_secreta
BCRYPT_ROUNDS=10
```

---

## 🤝 Suporte

### Problemas Comuns

**Rascunhos não expiram?**
```javascript
// Verificar índice TTL
db.postagens.getIndexes()
// Procure por: ttl_rascunhos_14_dias
```

**Moderadores não aparecem?**
```javascript
// Verificar query
const mods = await Usuario.find({ 'configuracoes.mod_voluntario': true });
```

**Curtidas duplicadas?**
```javascript
// Usar usuarios_que_curtiram para validação
if (!postagem.stats.usuarios_que_curtiram.includes(usuarioId)) {
  // Curtir...
}
```

---

## 📝 Licença

MIT - Use livremente

---

## 📞 Contato

IF REDE Backend v1.0
Criado em: Abril de 2026

---

**Documentação completa:** [DOCUMENTACAO.md](DOCUMENTACAO.md)  
**Visão técnica:** [GUIA-TECNICO.js](GUIA-TECNICO.js)  
**Exemplos:** [exemplos-uso.js](exemplos-uso.js)
