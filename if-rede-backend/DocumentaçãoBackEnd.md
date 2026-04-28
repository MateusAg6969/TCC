# Documentação Back-End.md
*IF REDE – Rede Social Acadêmica (Backend MongoDB)*
*Versão: 1.0.0 – 17 abr 2026*

---

## 1️ Visão Geral

IF REDE é uma rede social acadêmica construída com **Node.js** + **Express**, persiste dados em **MongoDB** usando **Mongoose** e adota quatro padrões de design MongoDB:

| Padrão | Onde é usado | Benefício |
|--------|--------------|-----------|
| **Attribute Pattern** | `customizacao` (Usuario) • `metadados` (Postagem) | Campos opcionais/dinâmicos sem necessidade de migrações. |
| **Bucket Pattern** | `stats` (Usuario & Postagem) • `atividade_moderacao` (agregação de horas) | Dados frequentemente consultados são denormalizados → consultas rápidas. |
| **TTL Index** | `excluir_em` (Postagem) | Rascunhos expiram automaticamente após **14 dias**. |
| **Polimorfismo** | `tipo + conteudo` (Postagem) | Um único schema suporta **áudio**, **imagem** ou **texto**. |

> **Objetivo da consolidação** – eliminar a fragmentação de documentação (README, DOCUMENTACAO, GUIA‑TECNICO, INDICE, FRONTEND‑START, Postman) e oferecer um ponto único de referência para desenvolvedores, revisores e alunos de TCC.

---

## 2️ Estrutura de Diretórios

```
if-rede-backend/
├─ schemas/                     # Definições de schemas Mongoose
│   ├─ usuario.schema.js
│   ├─ postagem.schema.js
│   └─ atividade-moderacao.schema.js
├─ models/                      # Exporta modelos (Usuario, Postagem, AtividadeModeracao)
│   └─ index.js
├─ db/
│   └─ connection.js            # Conexão, criação automática de índices, graceful shutdown
├─ exemplos-uso.js              # 14 exemplos práticos (criar usuário, rascunho, moderação, etc.)
├─ docs/
│   ├─ FRONTEND-START.md        # Contrato de API, endpoints essenciais, fluxo de auth
│   └─ if-rede-api.postman_collection.json
├─ README.md                    # Visão geral rápida
├─ DOCUMENTACAO.md              # Este documento (consolidação)
├─ GUIA-TECNICO.js              # Diagramas ASCII de arquitetura e fluxos
├─ INDICE.js                    # Lista de arquivos e métricas (linhas, propósito)
└─ package.json
```

---

## 3️ Modelos de Dados

### 3.1 Usuario (`schemas/usuario.schema.js`)

| Campo | Tipo | Descrição | Validação | Índice |
|-------|------|-----------|-----------|--------|
| **senha** | `String` (select = false) | Hash bcrypt; nunca retornada. | ≥ 8 caracteres. | – |
| **perfil** | Sub‑documento | Dados pessoais e acadêmicos. | `nome`: 3‑100 caract., trim.<br>`email`: único, regex, lowercase.<br>`matricula`: única, 6‑10 dígitos.<br>`bio`: ≤ 500 caract.<br>`status_vinculo`: enum (`estudante`, `egresso`, `servidor`).<br>`privacidade`: enum (`publico`, `privado`). | `perfil.email` (único)<br>`perfil.matricula` (único) |
| **customizacao** | Sub‑documento (Attribute Pattern) | Personalização visual. | `cor_fundo`, `cor_botoes`: HEX (`^#[0-9A-Fa-f]{6}$`).<br>`banner_url`: URL válida.<br>`tema`: `light` / `dark`. | – |
| **configuracoes** | Sub‑documento | Controle de conta e moderação. | `mod_voluntario`: Boolean.<br>`melhores_amigos`: ≤ 20 IDs.<br>`permitir_mensagens`: Boolean.<br>`notificacoes.{likes,comentarios,seguidores,reposts}`: Boolean.<br>`egresso_limitado`: Boolean (auto = true quando `status_vinculo === 'egresso'`). | `configuracoes.mod_voluntario` |
| **stats** (Bucket Pattern) | Sub‑documento | Contadores denormalizados para desempenho. | `total_seguidores`, `total_seguindo`, `total_postagens`, `total_moderacoes`: `Number ≥ 0`. | – |
| **ativo** | `Boolean` | Controle de ativação da conta. | default = true. | – |
| **ultima_atividade** | `Date` | Timestamp da última ação relevante. | default = `Date.now`. | – |
| **suspenso_ate** | `Date` | Data até a qual o usuário está suspenso. | null = não suspenso. | – |
| **suspensao_motivo** | `String` | Motivo da suspensão (texto livre). | default = '' | – |
| **timestamps** | – | Campos `createdAt` / `updatedAt` automáticos. | – | – |

#### Métodos de Instância

| Método | Descrição | Retorno |
|--------|-----------|---------|
| `estaSuspenso()` | Verifica se a data atual < `suspenso_ate`. | `Boolean` |
| `ehModerador()` | Retorna `configuracoes.mod_voluntario`. | `Boolean` |
| `ehEgresso()` | Retorna `perfil.status_vinculo === 'egresso'`. | `Boolean` |
| `suspender(dataFim, motivo?)` | Define `suspenso_ate` e `suspensao_motivo`; salva. | `Promise<Usuario>` |
| `removerSuspensao()` | Zera `suspenso_ate` e `suspensao_motivo`; salva. | `Promise<Usuario>` |
| `registrarAtividade()` | Atualiza `ultima_atividade` para `Date.now`; salva. | `Promise<Usuario>` |

#### Métodos estáticos (`statics`)

| Método | Descrição |
|--------|-----------|
| `encontrarModeradores()` | Lista usuários ativos com `mod_voluntario: true`. |
| `encontrarEgressos()` | Lista usuários cujo `perfil.status_vinculo === 'egresso'`. |
| `buscarPorTexto(termo)` | Busca full‑text em `perfil.nome` / `perfil.bio` usando índice `text`. |

#### Observações de Segurança

- **Senha** nunca é retornada (`select: false`).
- **Índices únicos** garantem consistência de e‑mail e matrícula.
- **Validações regex** evitam inserções mal‑formadas.
- **Campos imutáveis** (`createdAt`, `senha`) não podem ser alterados via `findOneAndUpdate` sem `new:true`.

---

### 3.2 Postagem (`schemas/postagem.schema.js`)

| Campo | Tipo | Descrição | Validação |
|-------|------|-----------|-----------|
| **autor_id** | `ObjectId` → `Usuario` | Referência ao autor; **imutável**. | required. |
| **titulo** | `String` | Título da postagem. | 3‑200 caract., trim. |
| **descricao** | `String` | Breve descrição. | ≤ 500 caract. |
| **tipo** | `String` (enum) | `audio`, `imagem`, `texto`. | required. |
| **subtipo** | `String` | Classificação livre (ex.: "Poema"). | ≤ 50 caract. |
| **subtipo_tag_id** | `ObjectId` → `TagSubtipo` | Tag taxonômica opcional. | index. |
| **conteudo** | Sub‑documento (polimorfismo) | `url` (obrigatório), `arquivo` (nome_original, nome_servidor, mimetype, tamanho_bytes), `texto_longo`, `sensivel`, `dimensoes`, `duracao_segundos`, `metadados` (campo flexível). |
| **config** | Sub‑documento | `eh_rascunho` (default true), `visibilidade` (enum: `todos`, `seguidores`, `melhores_amigos`), `comentarios_ativos`, `comentarios_moderados`, `requer_permissao`, `permissao_de`. |
| **repost_info** | Sub‑documento | `original_id`, `comentario_repost`, `repost_count`. |
| **stats** (Bucket) | Sub‑documento | `likes`, `usuarios_que_curtiram` (array de IDs), `comentarios_count`, `shares`, `visualizacoes`. |
| **tags** | `[String]` | ≤ 20 tags livres. |
| **categorias** | `[String]` (enum) | `projetos`, `eventos`, `artes`, `tecnologia`, `acesso-inclusivo`, `geral`. |
| **excluir_em** | `Date` | **TTL**: data de expiração quando `config.eh_rascunho === true`. |
| **denuncias** | Sub‑documento | `total`, `motivos[]` (usuario_id, motivo, data), `bloqueado`, `motivo_bloqueio`. |
| **status_moderacao** | `String` (enum) | `pendente`, `aprovado`, `rejeitado`, `em_revisao`. |
| **moderado_por** | `ObjectId` → `Usuario` | Moderador que aprovou/rejeitou. |
| **timestamps** | – | `createdAt`, `updatedAt`. |

#### Índices críticos (criados em `db/connection.js`)

| Índice | Propósito |
|--------|-----------|
| `excluir_em` (TTL) | Deleta rascunhos imediatamente ao atingir a data (partial filter `{ 'config.eh_rascunho': true }`). |
| `{ autor_id: 1, 'config.eh_rascunho': -1 }` | Busca postagens por autor, excluindo rascunhos. |
| `{ tipo: 1, 'config.eh_rascunho': -1 }` | Busca por tipo de conteúdo. |
| `{ createdAt: -1, 'config.eh_rascunho': -1 }` | Timeline (feed). |
| `{ 'config.visibilidade': 1, 'config.eh_rascunho': -1, createdAt: -1 }` | Feed filtrado por visibilidade. |
| `{ titulo: 'text', descricao: 'text' }` | Busca full‑text. |
| `{ tags: 1 }` | Busca rápida por hashtags. |
| `{ categorias: 1 }` | Filtro por categoria institucional. |
| `{ status_moderacao: 1 }` | Listar postagens pendentes de moderação. |
| `{ 'denuncias.bloqueado': 1 }` | Encontrar posts bloqueados. |

#### Métodos de Instância

| Método | Descrição | Retorno |
|--------|-----------|---------|
| `publicar()` | Remove flag `eh_rascunho`, limpa `excluir_em`, define `status_moderacao = 'pendente'`. | `Promise<Postagem>` |
| `voltarParaRascunho()` | Reativa rascunho, define novo TTL (14 dias). | `Promise<Postagem>` |
| `adicionarCurtida(usuarioId)` | Caso ainda não curtiu, adiciona ao array e incrementa `likes`. | `Promise<Postagem>` |
| `removerCurtida(usuarioId)` | Remove do array e decrementa `likes`. | `Promise<Postagem>` |
| `incrementarComentarios()` / `decrementarComentarios()` | Atualiza `comentarios_count`. | `Promise<Postagem>` |
| `incrementarVisualizacoes()` | Incrementa `visualizacoes`. | `Promise<Postagem>` |
| `bloquear(motivo?)` | Marca `denuncias.bloqueado = true`, define `motivo_bloqueio`, `status_moderacao = 'rejeitado'`. | `Promise<Postagem>` |
| `desbloquear()` | Reverte bloqueio. | `Promise<Postagem>` |

#### Métodos estáticos

| Método | Descrição |
|--------|-----------|
| `postagem_publica_por_autor(autorId)` | Busca postagens **não‑rascunho** e **não bloqueadas** de um autor. |
| `rascunhos_do_usuario(usuarioId)` | Lista rascunhos (TTL ativo). |
| `postagens_bloqueadas()` | Retorna todas as postagens com `denuncias.bloqueado = true`. |
| `postagens_pendentes_moderacao()` | Retorna postagens `status_moderacao = 'pendente'`. |
| `por_tipo(tipo)` | Busca postagens públicas de um determinado tipo (`audio`, `imagem`, `texto`). |

#### Observações de Segurança

- **Visibilidade** controla quem pode ler a postagem (`todos`, `seguidores`, `melhores_amigos`).
- **Propriedade** (`autor_id`) é imutável – impede troca de dono.
- **TTL** garante limpeza automática de rascunhos, evitando acúmulo de lixo.
- **Denúncias** e **status_moderacao** são auditáveis; alterações são registradas em `atividade_moderacao`.

---

### 3.3 Atividade Moderacao (`schemas/atividade-moderacao.schema.js`)

| Campo | Tipo | Descrição | Validação |
|-------|------|-----------|-----------|
| **moderador_id** | `ObjectId` → `Usuario` | Identificador do moderador (imutável). | required. |
| **moderador_nome** | `String` | Snapshot do nome (imutável). | required. |
| **moderador_matricula** | `String` | Snapshot da matrícula (imutável). | required. |
| **tipo_acao** | `String` (enum) | Tipo de ação (ex.: `comentario_aprovado`, `postagem_bloqueada`, `usuario_suspenso`). | required, imutável. |
| **descricao** | `String` | Texto livre (≤ 500 caract., imutável). |
| **objeto_tipo** | `String` (enum: `postagem`, `comentario`, `usuario`) | Tipo do objeto afetado. |
| **objeto_id** | `ObjectId` | ID do objeto afetado. |
| **objeto_snapshot** | `Mixed` | Dados do objeto no momento da ação (imutável). |
| **tempo_estimado_minutos** | `Number` | Tempo previsto (1‑120 min). Valor default automático por `tipo_acao`. |
| **horas** | `Number` (getter) | `tempo_estimado_minutos / 60` (2 decimais). |
| **resultado** | `String` (enum: `sucesso`, `parcial`, `erro`, `sem_acao`) | Resultado da ação. |
| **motivo_rejeicao** | `String` | Motivo da rejeição/bloqueio (≤ 300 caract.). |
| **tags** | `[String]` (enum) | Categorias (spam, discurso-odio, direitos-autorais, etc.). |
| **data_acao** | `Date` | Data/hora da ação (default = now). |
| **ip_origem**, **user_agent** | `String` | Dados opcionais de auditoria. |
| **revisado** | `Boolean` | Flag de revisão. |
| **revisado_por** | `ObjectId` → `Usuario` | Moderador que revisou. |
| **resultado_revisao** | `String` (enum: `confirmado`, `revertido`, `escalado`) | Resultado da revisão. |
| **comentario_revisao** | `String` | Texto da revisão (≤ 500 caract.). |

#### Índices (performance de relatórios)

| Índice | Uso |
|--------|-----|
| `{ moderador_id: 1, data_acao: -1 }` | Relatório de horas por moderador. |
| `{ data_acao: -1 }` | Cálculo de horas em intervalo. |
| `{ tipo_acao: 1 }` | Agrupamento por tipo de ação. |
| `{ objeto_id: 1, objeto_tipo: 1 }` | Histórico de um objeto específico. |
| `{ revisado: 1, resultado_revisao: 1 }` | Ações que precisam revisão. |
| `{ resultado: 1 }` | Filtrar por sucesso/erro. |
| `{ tags: 1 }` | Análise de categorias de infração. |

#### Métodos de Instância

| Método | Descrição |
|--------|-----------|
| `marcar_como_revisada(revisadoPor, resultado, comentario?)` | Define `revisado = true`, grava `revisado_por`, `resultado_revisao`, `comentario_revisao`. |
| `tempo_formatado()` | Converte `tempo_estimado_minutos` para `"XhYm"`. |

#### Métodos estáticos

| Método | Descrição |
|--------|-----------|
| `calcular_horas_moderador(moderadorId, dataInicio, dataFim)` | Agrega `tempo_estimado_minutos` → total de horas no período. |
| `relatorio_horas_mes()` | Total de minutos e ações por moderador no último mês. |
| `pendentes_revisao()` | Lista ações ainda não revisadas. |
| `historico_objeto(objetoId, objetoTipo)` | Histórico completo de um post/comentário/usuário. |
| `estatisticas_gerais()` | Total de ações, minutos, distribuição por tipo, moderadores ativos. |

#### Observações de Segurança

- **Imutabilidade** garante integridade da trilha de auditoria.
- **TTL** não se aplica – registros são permanentes.
- **Tags** padronizadas facilitam relatórios e políticas de compliance.

---

## 4️ API REST (rotas)

| Rota | Método | Auth? | Descrição | Middleware(s) |
|------|--------|-------|-----------|---------------|
| **/health** | `GET` | ❌ | Health‑check (retorna `service` e `now`). | `responseMiddleware` |
| **/auth/register** | `POST` | ❌ | Cria usuário; valida `email`, `matricula`, `senha`. | `validation`, `bcrypt` |
| **/auth/login** | `POST` | ❌ | Gera **JWT** (`accessToken` 15 min) + **Refresh** (`refreshToken` 7 dias). | `bcrypt` |
| **/auth/refresh** | `POST` | ❌ | Renova `accessToken` usando `refreshToken`. | — |
| **/usuarios/me** | `GET` | ✅ | Dados do usuário autenticado. | `authMiddleware` |
| **/usuarios/:id** | `GET` | ✅ | Dados públicos de outro usuário (visibilidade). | `authMiddleware` |
| **/usuarios/:id/seguir** | `POST` / `DELETE` | ✅ | Segue / deixa de seguir; verifica limites (egresso ≤ 2 posts/semana). | `authMiddleware`, `ownershipCheck` |
| **/postagens** | `POST` | ✅ | Cria postagem (padrão **rascunho**). | `authMiddleware`, `uploadMiddleware`, `validation` |
| **/postagens/feed** | `GET` | ✅ | Feed paginado; filtra por `visibilidade`. | `authMiddleware`, `rateLimit` |
| **/postagens/:id** | `PATCH` / `DELETE` | ✅ | Atualiza / exclui; **ownership** (autor ou moderador). | `authMiddleware`, `ownershipCheck` |
| **/postagens/:id/curtir** | `POST` / `DELETE` | ✅ | Like / unlike; impede duplicidade. | `authMiddleware` |
| **/comentarios** | `POST` | ✅ | Cria comentário; pode exigir `moderador` se `config.comentarios_moderados`. | `authMiddleware` |
| **/comentarios/postagem/:postId** | `GET` | ✅ | Lista comentários (paginado). | `authMiddleware` |
| **/comentarios/moderacao/pendentes** | `GET` | ✅ (moderador) | Lista comentários aguardando aprovação. | `authMiddleware`, `moderatorCheck` |
| **/comentarios/:id/aprovar** | `PATCH` | ✅ (moderador) | Aprova comentário; registra `atividade_moderacao`. | `authMiddleware`, `moderatorCheck` |
| **/comentarios/:id/rejeitar** | `PATCH` | ✅ (moderador) | Rejeita comentário; registra ação. | `authMiddleware`, `moderatorCheck` |
| **/filtro-palavras** | `POST` | ✅ (moderador) | Aciona filtro de palavras proibidas; cria log. | `authMiddleware`, `moderatorCheck` |
| **/tags** | `GET` | ✅ | Lista tags disponíveis. | `authMiddleware` |

### Middlewares críticos

| Middleware | Função |
|------------|--------|
| `helmet()` | Headers de segurança (CSP, X‑Frame‑Options, etc.). |
| `cors({ origin: <env‑list>, credentials: true })` | Restrição de origens (deve ser configurada; fallback a **nenhuma origem** se `CORS_ORIGINS` ausente). |
| `express-rate-limit` | Limita requisições por IP (config: `RATE_LIMIT_POR_MINUTO`). |
| `authMiddleware` | Verifica JWT, anexa `req.user`. |
| `ownershipCheck` | Garante que `req.user.id === recurso.autor_id` **ou** o usuário é moderador voluntário. |
| `moderatorCheck` | Rejeita acesso se `!req.user.configuracoes.mod_voluntario`. |
| `responseMiddleware` | Padroniza respostas: `{ ok, message, data, meta }`. |
| `errorMiddleware` | Captura exceções, registra stack, devolve `{ ok:false, error:{ message, details } }`. |
| `uploadMiddleware` (multer) | Salva arquivos em `uploads/`, grava metadados no sub‑documento `conteudo`. |

---

## 5️ Fluxo de Moderação & Cálculo de Horas Complementares

1. **Ação do moderador** → cria documento `atividade_moderacao`.
2. **tempo_estimado_minutos** é preenchido automaticamente por tipo de ação (ex.: `postagem_bloqueada = 10 min).
3. **horas** = `tempo_estimado_minutos / 60`.
4. **Relatórios** (mês corrente) são gerados via `atividadeModeracaoSchema.statics.relatorio_horas_mes()`.
5. **TTL de rascunhos** (`excluir_em`) garante que rascunhos expirados nunca sejam moderados.
6. **Limites por vínculo**:
   - **Egressos** → `configuracoes.egresso_limitado` = `true`; limite de **2 postagens/semana** (verificado no controller `postagens.controller.js`).
   - **Estudantes/Servidores** → sem restrição.

---

## 6️ Segurança & Boas‑Práticas

| Aspecto | Implementação |
|---------|----------------|
| **Autenticação** | JWT **Access** (15 min) + **Refresh** (7 dias) + `httpOnly` cookie (future). |
| **Autorização** | `ownershipCheck` + `moderatorCheck`. |
| **Rate‑limit** | 100 req/min (configurável via `.env`). |
| **CORS** | Deve sempre ter `CORS_ORIGINS` definido; caso contrário, **nenhuma origem** é aceita. |
| **Helmet** | Habilita CSP, X‑Content‑Type‑Options, Referrer‑Policy, etc. |
| **Validação de entrada** | Schemas Mongoose + validações específicas (regex, enum, limites). |
| **Logs de auditoria** | `atividade_moderacao` e `errorMiddleware` registram stack e IP. |
| **Proteção contra injeção** | Todos os campos são parametrizados via Mongoose; nenhum `eval` ou concatenação de queries. |
| **TLS/HTTPS** | Recomendado em produção (reverse‑proxy Nginx/Traefik). |
| **Uploads** | Salvos em `uploads/` sem execução; apenas URLs são retornadas. |

---

## 7️ Contrato para o Frontend

- **Formato padrão de resposta** (definido em `docs/FRONTEND-START.md`):

```json
{
  "ok": true,
  "message": "...",
  "data": {},
  "meta": {}
}
```

- **Erros** seguem o mesmo modelo, porém `ok: false` e campo `error`.

- **Configuração global do Axios** (exemplo):

```js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

- **Cores da marca** (usadas nos componentes):
  - **Primária**: `#1E40AF` (Roxo).
  - **Destaque/Sucesso**: `#4D7C0F` (Oliva).

- **Telas prontas para iniciar** (conforme `FRONTEND-START.md`):
  1. Login / Cadastro.
  2. Perfil próprio (`/usuarios/me`).
  3. Perfil público/privado.
  4. Feed com paginação.
  5. Criação de postagem.
  6. Curtir postagem.
  7. Comentar postagem.
  8. Painel de moderação.

---

## 8️ Diagrama UML (texto simplificado)

```
+-------------------+      1   *    +-------------------+
|      Usuario      |<------------|      Postagem     |
+-------------------+            +-------------------+
| _id               |            | _id               |
| perfil            |            | autor_id (ref)    |
| customizacao      |            | titulo            |
| configuracoes     |            | conteudo (polim.) |
| stats             |            | config            |
+-------------------+            | stats             |
                                 | tags, categorias  |
                                 +-------------------+

+-------------------+      1   *    +-------------------+
|   AtividadeMod   |<------------|      Usuario      |
+-------------------+            +-------------------+
| moderador_id (ref)|            | _id               |
| tipo_acao         |            | ...               |
| objeto_tipo       |            +-------------------+
| objeto_id (ref)   |
| tempo_estimado... |
+-------------------+
```

---

## 9️ Conclusão

Este documento consolida toda a documentação técnica do backend, facilitando:

- **Onboarding** de novos desenvolvedores.
- **Revisão de arquitetura** para o TCC.
- **Manutenção** (índices, TTL, políticas de moderação).
- **Integração** direta com o frontend (contrato de API, cores, exemplos de Axios).

**Próximos passos sugeridos**

1. Revisar o README para incluir este link ao `DOCUMENTACAO_MESTRE_BACKEND.md`.
2. Garantir que `CORS_ORIGINS` esteja definido no `.env` antes de abrir o repo para outros desenvolvedores.
3. Implementar scripts de CI que validem a criação dos índices TTL no container de teste.

---