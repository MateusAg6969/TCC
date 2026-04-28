# GUIA RÁPIDO - VISÃO GERAL TÉCNICA

## Resumo visual da arquitetura e relacionamentos do IF REDE

---

## DIAGRAMA DE ESTRUTURA

### IF REDE - ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          IF REDE - ARQUITETURA                              │
└─────────────────────────────────────────────────────────────────────────────┘

                            APLICAÇÃO NODE.JS
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                ┌─────────┐   ┌──────────┐   ┌──────────────┐
                │ Schemas │   │  Models  │   │  Connection  │
                └─────────┘   └──────────┘   └──────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                            MONGOOSE (ODM)
                                    │
                        ┌───────────┼───────────┐
                        │           │           │
                   MONGODB COLLECTIONS:
                        │           │           │
              ┌─────────────┐  ┌──────────┐  ┌─────────────────────┐
              │  usuarios   │  │postagens │  │atividades_moderacao │
              └─────────────┘  └──────────┘  └─────────────────────┘
```

### RELACIONAMENTOS ENTRE COLEÇÕES

| USUARIOS | POSTAGENS | ATIVIDADE_MODERACAO |
|----------|-----------|---------------------|
| _id (PK) | _id (PK) | _id (PK) |
| perfil | autor_id (FK) → | moderador_id (FK) |
| customizacao | conteudo | tipo_acao |
| configuracoes | config | objeto_tipo |
| stats | stats | tempo_estimado_minutos |
| suspenso_ate | repost_info | resultado |
| | status_moderacao | |
| | moderado_por (FK) → usuario_id (ref) | |

**RELACIONAMENTOS ESPECÍFICOS:**

1. **Usuario → Postagem**  
   `usuario._id ← postagem.autor_id`  
   Usuário cria múltiplas postagens

2. **Usuario → AtividadeModeração**  
   `moderador.id ← atividade.moderador_id`  
   Moderador realiza múltiplas ações

3. **Postagem → Postagem (Repost)**  
   `postagem._id ←─ outro_postagem.repost_info.original_id`  
   Um post pode ser repostado múltiplas vezes

4. **Usuario → Usuario (Melhores Amigos)**  
   `usuario._id ←─ outro_usuario.configuracoes.melhores_amigos[]`  
   Relacionamento muitos-para-muitos

---

## FLUXO DE DADOS - CRIAR POSTAGEM

1. **Usuário clica "Nova Postagem"**  
   → Cria documento em POSTAGENS com `config.eh_rascunho: true`

2. **MongoDB cria campo `excluir_em` automaticamente**  
   → TTL Index monitora: cada 60 seg, verifica se data foi atingida

3. **Usuário clica "Publicar"**  
   → `postagem.publicar()`  
   → Muda: `config.eh_rascunho = false`  
   → Muda: `status_moderacao = "pendente"`  
   → Remove: `excluir_em` (para não expirar)

4. **Moderador revisa no painel**  
   → Cria documento em ATIVIDADES_MODERACAO  
   → Registra: tipo_acao, tempo_estimado_minutos, resultado

5. **Moderador aprova/rejeita**  
   → Muda `postagem.status_moderacao = "aprovado"` ou `"rejeitado"`  
   → Se aprovado: postagem aparece no feed  
   → Se rejeitado: usuário notificado

---

## FLUXO DE DADOS - MODERAÇÃO (HORAS)

**CADA AÇÃO DO MODERADOR:**

```
Moderador realiza ação (aprovar, rejeitar, bloquear)
           ↓
Cria AtividadeModeração com:
  - tipo_acao: "postagem_aprovada"
  - tempo_estimado_minutos: 5
  - resultado: "sucesso"
  - data_acao: Date.now()
           ↓
MongoDB armazena no índice temporal
           ↓
Fim do mês (relatório):
           ↓
Query aggregation:
  - Filtra moderador_id e data_acao do mês
  - Sum de tempo_estimado_minutos
  - Converte para horas: minutos / 60
           ↓
RESULTADO: "Maria Costa trabalhou 8.5 horas este mês"
```

---

## ÍNDICES CRÍTICOS

### ÍNDICE TTL (RASCUNHOS)
- **Nome:** `ttl_rascunhos_14_dias`
- **Campo:** `postagens.excluir_em`
- **Ação:** Deleta automaticamente quando data é atingida
- **Filtro:** Aplica apenas se `config.eh_rascunho = true`

**COMO FUNCIONA:**
- MongoDB daemon roda a cada 60 segundos
- Procura documentos onde `excluir_em ≤ agora() AND eh_rascunho = true`
- Deleta-os automaticamente (sem ação manual)

**EXEMPLO:**
- Rascunho criado em: 2026-04-17
- `excluir_em` configurado para: 2026-05-01 (14 dias depois)
- Resultado: 2026-05-01 às 02:00 → Documento deletado

### ÍNDICES DE PERFORMANCE

**USUARIOS:**
- `{ 'perfil.email': 1, unique: true }` → Login rápido
- `{ 'perfil.matricula': 1, unique: true }` → Busca por matrícula
- `{ 'configuracoes.mod_voluntario': 1 }` → Encontrar moderadores
- `{ 'perfil.nome': 'text' }` → Busca full-text

**POSTAGENS:**
- `{ autor_id: 1, 'config.eh_rascunho': -1 }` → Posts do usuário
- `{ tipo: 1, 'config.eh_rascunho': -1 }` → Posts por tipo
- `{ createdAt: -1, 'config.eh_rascunho': -1 }` → Timeline

**ATIVIDADES_MODERACAO:**
- `{ moderador_id: 1, data_acao: -1 }` → Relatórios por moderador
- `{ data_acao: -1 }` → Timeline de ações

---

## PADRÕES DE DESIGN APLICADOS

### 1. ATTRIBUTE PATTERN
- **Usado em:** customizacao (Usuario), metadados (Postagem)
- **Permite:** Campos opcionais/dinámicos por documento
- **Vantagem:** Flexibilidade sem schema migrations

**Exemplo:**
```javascript
Usuario 1:
  customizacao: {
    cor_fundo: "#FFF",
    cor_botoes: "#000",
    tema: "dark"
  }

Usuario 2:
  customizacao: {
    cor_fundo: "#000",
    tema: "light"
    // sem cor_botoes
  }
```

### 2. BUCKET PATTERN
- **Usado em:** stats (Usuario, Postagem)
- **Permite:** Denormalizar dados frequentemente acessados
- **Vantagem:** Acesso rápido sem agregações

**Exemplo:**
```javascript
stats: {
  likes: 42,
  usuarios_que_curtiram: [ObjectId, ...],
  comentarios_count: 15,
  visualizacoes: 234
}
```

### 3. TTL INDEX
- **Usado em:** excluir_em (Postagem)
- **Permite:** Auto-delete de documentos antigos
- **Vantagem:** Limpeza automática sem cron jobs

### 4. POLIMORFISMO
- **Usado em:** tipo + conteudo (Postagem)
- **Permite:** Um schema para vários tipos de dados
- **Vantagem:** Sem múltiplas coleções

**Exemplo:**
```javascript
// tipo: "audio"
conteudo: { url: "...", duracao_segundos: 3600, ... }

// tipo: "imagem"
conteudo: { url: "...", dimensoes: { ... }, ... }
```

---

## SEGURANÇA E VALIDAÇÃO

### VALIDAÇÃO NO SCHEMA
✓ Tipos forçados (String, Number, Boolean, Date, ObjectId)  
✓ Campos obrigatórios (required: true)  
✓ Limites de tamanho (minlength, maxlength)  
✓ Padrões regex (email, hexcolor, URL)  
✓ Enums (apenas valores permitidos)  
✓ Índices UNIQUE (matricula, email)

**EXEMPLO:**
```javascript
email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  match: [/^[\w\.-]+@\w+\.\w+$/, 'Email inválido']
}
```

### IMUTABILIDADE
✓ `autor_id` (Postagem) → immutable: true  
✓ `tipo_acao` (AtividadeModeração) → immutable: true  

Uma vez criado, não pode ser alterado

### SENHAS
✓ Nunca retornar no find: `select: false`  
✓ Hash com bcrypt (não plaintext!)  
✓ Comparar com `bcrypt.compare()`

---

## REGRAS POR TIPO DE VÍNCULO

### ESTUDANTE
✓ Sem limites de postagem  
✓ Todos os tipos de conteúdo  
✓ Pode ser moderador voluntário  
✓ Acesso público ao perfil  
✓ Sem suspensão por limite

### EGRESSO
⚠️ Máximo 2 postagens por semana  
⚠️ Moderação mais rigorosa  
✓ Acesso leitura completo  
✗ Não pode ser moderador  
✓ Perfil público

### SERVIDOR
✓ Sem limites  
✓ Acesso administrativo  
✓ Pode moderar  
✓ Sempre confiável  
✗ Moderação mínima

---

## CHECKLIST DE IMPLEMENTAÇÃO

### BANCO DE DADOS
✓ Schemas criados (usuario, postagem, atividade_moderacao)  
✓ Validações implementadas  
✓ Índices configurados  
✓ TTL para rascunhos  
✓ Relacionamentos (refs)

### MODELOS
✓ Métodos de instância (publicar, curtir, etc)  
✓ Métodos estáticos (buscar, filtrar, etc)  
✓ Getters (horas formatadas, etc)

### CONEXÃO
✓ Conectar ao MongoDB  
✓ Criar índices automaticamente  
✓ Tratamento de erros  
✓ Graceful shutdown

### TODO (Próximos Passos)
◻ API REST (Express routes)  
◻ Autenticação JWT  
◻ Autorização (middleware)  
◻ Testes (Jest)  
◻ Documentação API (Swagger)  
◻ Frontend (React/Vue)  
◻ Deploy (Heroku/AWS)

---

**FIM DO GUIA TÉCNICO**