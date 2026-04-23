# Frontend Start Guide

## Base URL
- Local: `http://localhost:3000`

## Contrato padrão de resposta

### Sucesso
```json
{
  "ok": true,
  "message": "...",
  "data": {},
  "meta": {}
}
```

### Erro
```json
{
  "ok": false,
  "error": {
    "message": "...",
    "details": {}
  }
}
```

## Fluxo recomendado de autenticação
1. `POST /auth/register` ou `POST /auth/login`
2. Salvar `accessToken` em memória (state/store).
3. Salvar `refreshToken` em cookie httpOnly no backend (futuro) ou localStorage temporário no MVP.
4. Em 401, chamar `POST /auth/refresh` e repetir a requisição.
5. Limpar sessão no logout (frontend + backend quando existir blacklist).

## Endpoints essenciais para começar telas

### Health
- `GET /health`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`

### Usuário
- `GET /usuarios/me`
- `GET /usuarios/:id`
- `POST /usuarios/:id/seguir`
- `DELETE /usuarios/:id/seguir`
- `GET /usuarios/:id/seguidores`
- `GET /usuarios/:id/seguindo`

### Postagens
- `POST /postagens`
- `GET /postagens/feed?page=1&limit=10`
- `GET /postagens/usuario/:usuarioId?page=1&limit=10`
- `PATCH /postagens/:id`
- `DELETE /postagens/:id`
- `POST /postagens/:id/curtir`
- `DELETE /postagens/:id/curtir`

### Comentários
- `POST /comentarios`
- `GET /comentarios/postagem/:postagemId`
- `GET /comentarios/moderacao/pendentes` (moderador)
- `PATCH /comentarios/:id/aprovar` (moderador)
- `PATCH /comentarios/:id/rejeitar` (moderador)

## Headers
- Para rotas protegidas: `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

## Telas que já podem ser iniciadas
1. Login/Cadastro
2. Perfil próprio (`/usuarios/me`)
3. Perfil público/privado
4. Feed com paginação
5. Criar postagem
6. Curtir postagem
7. Comentar postagem
8. Painel de moderação de comentários

## Gap conhecido (próxima fase)
1. Upload real de mídia (S3/Cloudinary)
2. Logout com blacklist de refresh token
3. Recuperação de senha
4. Notificações
5. Busca global
