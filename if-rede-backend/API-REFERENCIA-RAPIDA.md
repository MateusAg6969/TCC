# 🚀 Referência Rápida de API

## Amizades

### 1. Enviar Solicitação
```bash
POST /api/amizades/solicitar
Authorization: Bearer TOKEN
Content-Type: application/json

{ "amigoId": "507f..." }
```
**Respostas:** 201 (sucesso) | 400 (auto-amizade) | 404 (não encontrado) | 409 (já existe)

---

### 2. Aceitar Solicitação
```bash
POST /api/amizades/:id/aceitar
Authorization: Bearer TOKEN
```
**Respostas:** 200 (sucesso) | 403 (sem permissão) | 409 (status inválido)

---

### 3. Recusar Solicitação
```bash
POST /api/amizades/:id/recusar
Authorization: Bearer TOKEN
Content-Type: application/json

{ "motivo": "..." }  // opcional
```
**Respostas:** 200 (sucesso) | 403 (sem permissão) | 409 (status inválido)

---

### 4. Desfazer Amizade
```bash
DELETE /api/amizades/:id
Authorization: Bearer TOKEN
```
**Respostas:** 200 (sucesso) | 403 (sem permissão) | 409 (não é amigo)

---

### 5. Listar Meus Amigos
```bash
GET /api/amizades/meus-amigos?page=1&limit=20
Authorization: Bearer TOKEN
```
**Retorna:** Lista de amigos + total + páginas

---

### 6. Listar Solicitações Pendentes
```bash
GET /api/amizades/solicitacoes?page=1&limit=20
Authorization: Bearer TOKEN
```
**Retorna:** Lista de solicitações recebidas + total

---

### 7. Verificar Status de Amizade
```bash
GET /api/amizades/verificar/:amigoId
Authorization: Bearer TOKEN
```
**Retorna:** `{ status, soAmigos, temSolicitacaoPendente, quemEnviou }`

---

## Usuários

### 1. Obter Perfil Público
```bash
GET /api/usuarios/:id
```
**Sem autenticação.** Respeita privacidade do usuário.

---

### 2. Obter Meu Perfil
```bash
GET /api/usuarios/me
Authorization: Bearer TOKEN
```
**Retorna:** Perfil completo com email e customizacao

---

### 3. Atualizar Perfil
```bash
PUT /api/usuarios/me
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "nome": "Novo Nome",
  "bio": "Nova bio",
  "email": "novo@email.com",
  "privacidade": "publico"
}
```
**Respostas:** 200 (sucesso) | 400 (dados inválidos) | 409 (email em uso)

---

### 4. Atualizar Customização
```bash
PUT /api/usuarios/me/customizacao
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "tema": "escuro",
  "cores": {
    "primaria": "#6A4C93",
    "secundaria": "#556B2F"
  },
  "foto_perfil_url": "https://...",
  "banner_url": "https://..."
}
```
**Respostas:** 200 (sucesso) | 400 (formato inválido)

---

## Códigos de Status

| Código | Significado |
|--------|------------|
| 200 | OK - Operação bem-sucedida |
| 201 | Created - Recurso criado |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Sem token |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito (ex: amizade já existe) |
| 500 | Server Error - Erro no servidor |

---

## Fluxo de Exemplo

```javascript
// 1. Enviar solicitação
const amizadeResponse = await fetch('/api/amizades/solicitar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ amigoId: '507f...' })
});

// 2. Verificar status
const statusResponse = await fetch(`/api/amizades/verificar/507f...`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await statusResponse.json();
console.log(data.status); // 'pendente'

// 3. Listar solicitações recebidas
const solicitacoesResponse = await fetch('/api/amizades/solicitacoes', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 4. Aceitar
const aceitarResponse = await fetch(`/api/amizades/${amizadeId}/aceitar`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 5. Listar amigos
const amigosResponse = await fetch('/api/amizades/meus-amigos?page=1&limit=20', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Estrutura de Resposta de Sucesso

```json
{
  "success": true,
  "data": {
    "id": "...",
    "...": "dados do recurso"
  },
  "message": "Mensagem descritiva"
}
```

---

## Estrutura de Resposta de Erro

```json
{
  "success": false,
  "error": "Mensagem do erro",
  "statusCode": 400
}
```

---

## Notas Importantes

- ✅ Todos os endpoints de modificação (`POST`, `PUT`, `DELETE`) requerem JWT
- ✅ O JWT é extraído do header `Authorization: Bearer <token>`
- ✅ IDs devem ser ObjectIds válidos (24 caracteres hexadecimais)
- ✅ Paginação: máximo 100 items por página
- ✅ Auto-amizade é prevenida
- ✅ Duplicatas são detectadas
- ✅ Todas as ações são registradas em auditoria

---

## Exemplos cURL

```bash
# Enviar solicitação
curl -X POST http://localhost:3000/api/amizades/solicitar \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amigoId":"507f1f77bcf86cd799439011"}'

# Listar amigos
curl -X GET "http://localhost:3000/api/amizades/meus-amigos?page=1&limit=20" \
  -H "Authorization: Bearer TOKEN"

# Obter perfil público (sem autenticação)
curl http://localhost:3000/api/usuarios/507f1f77bcf86cd799439011

# Atualizar perfil
curl -X PUT http://localhost:3000/api/usuarios/me \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Novo Nome","bio":"Nova bio"}'
```

---

## Status de Amizade

Quando você chama `GET /api/amizades/verificar/:amigoId`, o retorno pode ser:

```javascript
{
  status: null,                    // Sem relação
  soAmigos: false,
  temSolicitacaoPendente: false,
  quemEnviou: null
}

// OU

{
  status: 'pendente',              // Solicitação pendente
  soAmigos: false,
  temSolicitacaoPendente: true,
  quemEnviou: 'eu' | 'outro'      // Quem enviou
}

// OU

{
  status: 'aceito',                // São amigos
  soAmigos: true,
  temSolicitacaoPendente: false,
  quemEnviou: null
}
```

---

## Buttons no Frontend

Baseado no status, mostrar diferentes botões:

```javascript
function getBotaoText(status) {
  if (status === null) return 'Adicionar como amigo';
  if (status === 'pendente' && quemEnviou === 'outro') return 'Responder';
  if (status === 'pendente' && quemEnviou === 'eu') return 'Cancelar';
  if (status === 'aceito') return 'Desfazer amizade';
  return 'Carregando...';
}
```

---

## Dúvidas Frequentes

**P: Como autenticar?**
R: Adicione o header `Authorization: Bearer SEU_TOKEN` em cada requisição

**P: Posso me adicionar como amigo?**
R: Não, a API retorna erro 400

**P: Posso aceitar minha própria solicitação?**
R: Não, a API valida se você é o destinatário (error 403)

**P: Qual o tamanho máximo de um nome?**
R: 100 caracteres

**P: E a bio?**
R: 500 caracteres

**P: Posso ter múltiplas solicitações pendentes com a mesma pessoa?**
R: Não, a API retorna erro 409

**P: As recusas ficam para sempre?**
R: Não, são automaticamente deletadas após 90 dias (TTL)

---

Para documentação completa, veja: **IMPLEMENTACAO-AMIZADES-E-USUARIOS.md**
