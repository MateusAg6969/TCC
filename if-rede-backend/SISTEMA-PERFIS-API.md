# 📘 SISTEMA DE PERFIS - DOCUMENTAÇÃO DA API

## 📋 Visão Geral

O sistema de perfis oferece funcionalidades completas para gerenciar perfis de usuários, incluindo:
- Visualização e edição de perfis
- Configurações de privacidade
- Preferências personalizadas
- Conexões sociais (amigos)
- Badges e realizações

---

## 🔐 Autenticação

Todas as rotas autenticadas exigem um header:

```
Authorization: Bearer <token_jwt>
```

---

## 📊 ENDPOINTS

### PERFIL

#### 1. Obter Meu Perfil (Autenticado)
```http
GET /perfil/meu-perfil
Authorization: Bearer <token>
```

**Resposta 200:**
```json
{
  "data": {
    "usuario": {
      "_id": "648a1b2c3d4e5f6g7h8i9j0",
      "perfil": {
        "nome": "João Silva",
        "email": "joao@example.com",
        "bio": "Desenvolvedor Full Stack",
        "status_vinculo": "estudante",
        "privacidade": "publico"
      },
      "customizacao": {
        "cor_fundo": "#FFFFFF",
        "cor_botoes": "#1E40AF",
        "tema": "light"
      },
      "stats": {
        "total_seguidores": 150,
        "total_seguindo": 80,
        "total_postagens": 42,
        "total_moderacoes": 0
      }
    },
    "privacidade": { ... },
    "preferencias": { ... },
    "conexoes": { ... },
    "badges": { ... }
  },
  "message": "Perfil carregado com sucesso."
}
```

---

#### 2. Obter Perfil Público
```http
GET /perfil/:id
```

**Parâmetros:**
- `id` (string) - ID do usuário

**Resposta 200:**
```json
{
  "data": {
    "_id": "648a1b2c3d4e5f6g7h8i9j0",
    "perfil": { ... },
    "customizacao": { ... },
    "stats": { ... }
  },
  "message": "Perfil carregado com sucesso."
}
```

---

#### 3. Atualizar Perfil (Autenticado)
```http
PUT /perfil/atualizar
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "nome": "João Silva Updated",
  "bio": "Desenvolvedor Full Stack com 5 anos de experiência",
  "website": "https://joaosilva.com",
  "localizacao": "São Paulo, Brasil",
  "ocupacao": "Desenvolvedor Sênior"
}
```

**Resposta 200:**
```json
{
  "data": {
    "_id": "648a1b2c3d4e5f6g7h8i9j0",
    "perfil": {
      "nome": "João Silva Updated",
      "bio": "Desenvolvedor Full Stack com 5 anos de experiência"
    },
    "customizacao": { ... }
  },
  "message": "Perfil atualizado com sucesso."
}
```

---

#### 4. Atualizar Customização Visual (Autenticado)
```http
PUT /perfil/atualizar-customizacao
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "cor_fundo": "#F3F4F6",
  "cor_botoes": "#7C3AED",
  "tema": "dark"
}
```

**Resposta 200:**
```json
{
  "data": {
    "cor_fundo": "#F3F4F6",
    "cor_botoes": "#7C3AED",
    "tema": "dark",
    "banner_url": ""
  },
  "message": "Customização atualizada com sucesso."
}
```

---

#### 5. Obter Badges
```http
GET /perfil/:id/badges
```

**Resposta 200:**
```json
{
  "data": {
    "badges": [
      {
        "badge_id": "primeira-postagem",
        "nome_badge": "Primeira Postagem",
        "descricao": "Fez sua primeira postagem",
        "icone": "https://...",
        "data_concedida": "2024-01-15T10:00:00Z"
      }
    ],
    "pontos": 150,
    "nivel_usuario": 2,
    "total_posts": 42,
    "total_comentarios": 23,
    "total_likes": 89
  }
}
```

---

#### 6. Obter Estatísticas
```http
GET /perfil/:id/estatisticas
```

**Resposta 200:**
```json
{
  "data": {
    "stats": {
      "total_seguidores": 150,
      "total_seguindo": 80,
      "total_postagens": 42,
      "total_moderacoes": 0
    },
    "badges": 2,
    "pontos": 150
  }
}
```

---

### PRIVACIDADE

#### 1. Obter Minhas Configurações de Privacidade (Autenticado)
```http
GET /privacidade/minha-privacidade
Authorization: Bearer <token>
```

**Resposta 200:**
```json
{
  "data": {
    "usuario_id": "648a1b2c3d4e5f6g7h8i9j0",
    "perfil_publico": true,
    "quem_pode_mensagear": "todos",
    "quem_pode_comentar_posts": "todos",
    "mostrar_email_publicamente": false,
    "mostrar_localizacao": false,
    "mostrar_data_nascimento": false,
    "mostrar_ultimo_login": false,
    "permitir_indexar_buscador": true,
    "bloqueados": []
  }
}
```

---

#### 2. Atualizar Privacidade (Autenticado)
```http
PUT /privacidade/atualizar
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "perfil_publico": true,
  "quem_pode_mensagear": "amigos",
  "quem_pode_comentar_posts": "todos",
  "mostrar_email_publicamente": false,
  "mostrar_localizacao": true,
  "permitir_indexar_buscador": true
}
```

**Resposta 200:**
```json
{
  "data": { ... },
  "message": "Configurações de privacidade atualizadas com sucesso."
}
```

---

#### 3. Bloquear Usuário (Autenticado)
```http
POST /privacidade/bloquear/:usuario_id
Authorization: Bearer <token>
```

**Parâmetros:**
- `usuario_id` (string) - ID do usuário a bloquear

**Resposta 200:**
```json
{
  "data": null,
  "message": "Usuário bloqueado com sucesso."
}
```

---

#### 4. Desbloquear Usuário (Autenticado)
```http
DELETE /privacidade/desbloquear/:usuario_id
Authorization: Bearer <token>
```

**Resposta 200:**
```json
{
  "data": null,
  "message": "Usuário desbloqueado com sucesso."
}
```

---

### PREFERÊNCIAS

#### 1. Obter Minhas Preferências (Autenticado)
```http
GET /preferencias/minhas-preferencias
Authorization: Bearer <token>
```

**Resposta 200:**
```json
{
  "data": {
    "usuario_id": "648a1b2c3d4e5f6g7h8i9j0",
    "tema_preferido": "auto",
    "idioma": "pt-BR",
    "tamanho_fonte": 1,
    "notificacoes_email": {
      "novo_mensagem": true,
      "novo_comentario": true,
      "nova_conexao": true,
      "resumo_semanal": false
    },
    "session_timeout": 30,
    "permitir_analytics": true
  }
}
```

---

#### 2. Atualizar Preferências (Autenticado)
```http
PUT /preferencias/atualizar
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "tema_preferido": "dark",
  "idioma": "pt-BR",
  "tamanho_fonte": 1.2,
  "notificacoes_email": {
    "novo_mensagem": true,
    "novo_comentario": false,
    "nova_conexao": true,
    "resumo_semanal": true
  },
  "session_timeout": 60,
  "permitir_analytics": false
}
```

**Resposta 200:**
```json
{
  "data": { ... },
  "message": "Preferências atualizadas com sucesso."
}
```

---

### CONEXÕES (AMIGOS)

#### 1. Solicitar Amizade (Autenticado)
```http
POST /conexoes/:usuario_id/solicitar-amizade
Authorization: Bearer <token>
```

**Resposta 200:**
```json
{
  "data": null,
  "message": "Solicitação de amizade enviada com sucesso."
}
```

---

#### 2. Aceitar Amizade (Autenticado)
```http
POST /conexoes/:usuario_id/aceitar-amizade
Authorization: Bearer <token>
```

**Resposta 200:**
```json
{
  "data": { ... },
  "message": "Amizade aceita com sucesso."
}
```

---

#### 3. Recusar Amizade (Autenticado)
```http
DELETE /conexoes/:usuario_id/recusar-amizade
Authorization: Bearer <token>
```

**Resposta 200:**
```json
{
  "data": null,
  "message": "Solicitação recusada com sucesso."
}
```

---

#### 4. Remover Amizade (Autenticado)
```http
DELETE /conexoes/:usuario_id/remover-amizade
Authorization: Bearer <token>
```

**Resposta 200:**
```json
{
  "data": null,
  "message": "Amizade removida com sucesso."
}
```

---

#### 5. Minhas Conexões (Autenticado)
```http
GET /conexoes/minhas-conexoes?limit=20&page=1
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (number) - Número de resultados por página (padrão: 20, máximo: 100)
- `page` (number) - Número da página (padrão: 1)

**Resposta 200:**
```json
{
  "data": {
    "amigos": [
      {
        "_id": "648a1b2c3d4e5f6g7h8i9j1",
        "perfil": {
          "nome": "Maria Silva"
        },
        "customizacao": {
          "banner_url": "https://..."
        }
      }
    ],
    "total": 42,
    "pagina": 1
  },
  "message": "Amigos carregados com sucesso."
}
```

---

#### 6. Amigos de um Usuário
```http
GET /conexoes/:usuario_id/amigos?limit=20&page=1
```

**Resposta 200:** (mesma estrutura acima)

---

#### 7. Minhas Solicitações (Autenticado)
```http
GET /conexoes/minhas-solicitacoes
Authorization: Bearer <token>
```

**Resposta 200:**
```json
{
  "data": {
    "solicitacoes": [
      {
        "_id": "648a1b2c3d4e5f6g7h8i9j2",
        "perfil": {
          "nome": "Pedro Costa"
        }
      }
    ],
    "total": 3
  },
  "message": "Solicitações carregadas com sucesso."
}
```

---

## ❌ Códigos de Erro

| Status | Mensagem | Causa |
|--------|----------|-------|
| 400 | Bad Request | Dados inválidos no corpo da requisição |
| 401 | Unauthorized | Token não fornecido ou inválido |
| 403 | Forbidden | Acesso negado (usuário suspenso, perfil privado) |
| 404 | Not Found | Recurso não encontrado |
| 500 | Internal Server Error | Erro interno do servidor |

---

## 📝 Exemplo de Fluxo Completo

### 1. Registro (já existente)
```bash
POST /auth/register
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "matricula": "2021001",
  "senha": "senha123456",
  "status_vinculo": "estudante"
}
```
✅ Resposta inclui `accessToken` e `refreshToken`
✅ Documentos de perfil são criados automaticamente

### 2. Atualizar Perfil
```bash
PUT /perfil/atualizar
Authorization: Bearer <accessToken>
{
  "bio": "Desenvolvedor Full Stack",
  "ocupacao": "Estudante"
}
```

### 3. Atualizar Privacidade
```bash
PUT /privacidade/atualizar
Authorization: Bearer <accessToken>
{
  "perfil_publico": true,
  "quem_pode_mensagear": "amigos"
}
```

### 4. Solicitar Amizade
```bash
POST /conexoes/648a1b2c3d4e5f6g7h8i9j1/solicitar-amizade
Authorization: Bearer <accessToken>
```

---

## 🔄 Fluxo de Amizade

```
1. Usuario A → [POST] solicitar-amizade com Usuario B
   ↓
2. Usuario B recebe solicitação em suas "solicitacoes_recebidas"
   ↓
3. Usuario B → [POST] aceitar-amizade ou [DELETE] recusar-amizade
   ↓
4. Se aceitar: ambos aparecem na lista de amigos um do outro
   Se recusar: solicitação é removida
```

---

## 📱 Frontend - Integração

### Hook React para usar a API:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

export function usePerfil(usuarioId?: string) {
  const queryClient = useQueryClient();

  const { data: perfil } = useQuery({
    queryKey: ['perfil', usuarioId],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const url = usuarioId
        ? `/perfil/${usuarioId}`
        : '/perfil/meu-perfil';
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.data;
    }
  });

  const { mutate: atualizar } = useMutation({
    mutationFn: async (dados) => {
      const token = localStorage.getItem('accessToken');
      return axios.put('/perfil/atualizar', dados, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfil'] });
    }
  });

  return { perfil, atualizar };
}
```

---

## 🚀 Deploy

1. Certifique-se de que MongoDB está rodando
2. Defina as variáveis de ambiente em `.env`
3. Execute `npm install`
4. Execute `npm run dev` (desenvolvimento) ou `npm start` (produção)
5. A API estará disponível em `http://localhost:3000`

---

## 📞 Suporte

Para dúvidas sobre a API, consulte:
- [Documentação do Backend](./DocumentaçãoBackEnd.md)
- [Guia Técnico](./GUIA-TECNICO.md)
