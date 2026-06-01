## 🚀 SISTEMA DE PERFIS - GUIA DE IMPLEMENTAÇÃO

Este arquivo contém instruções completas para usar o novo sistema de perfis implementado.

---

## ✅ O que foi implementado

### 📁 Novos Schemas (Banco de Dados)
- ✅ `schemas/privacidade.schema.js` - Configurações de privacidade
- ✅ `schemas/preferencias.schema.js` - Preferências do usuário
- ✅ `schemas/conexoes.schema.js` - Relações de amizade
- ✅ `schemas/badges.schema.js` - Badges e realizações
- ✅ `schemas/auditoria.schema.js` - Auditoria de ações

### 🎮 Novos Controllers
- ✅ `controllers/perfil.controller.js` - Gerenciar perfil
- ✅ `controllers/privacidade.controller.js` - Privacidade
- ✅ `controllers/preferencias.controller.js` - Preferências
- ✅ `controllers/conexoes.controller.js` - Amigos e conexões

### 🛣️ Novas Rotas
- ✅ `routes/perfil.routes.js` - Endpoints de perfil
- ✅ `routes/privacidade.routes.js` - Endpoints de privacidade
- ✅ `routes/preferencias.routes.js` - Endpoints de preferências
- ✅ `routes/conexoes.routes.js` - Endpoints de conexões

### 🔧 Middleware
- ✅ `middleware/inicializar-perfil.middleware.js` - Inicialização automática

### 📚 Documentação
- ✅ `SISTEMA-PERFIS-API.md` - Documentação completa da API

---

## 🔄 Principais Recursos

### 1. Perfil de Usuário
- Visualizar perfil público (respeitando privacidade)
- Visualizar meu perfil completo
- Atualizar dados pessoais
- Customizar aparência (cores, tema)
- Ver badges e realizações

### 2. Privacidade
- Definir perfil como público ou privado
- Controlar quem pode mensagear
- Controlar quem pode comentar
- Mostrar/ocultar informações sensíveis
- Bloquear usuários

### 3. Preferências
- Escolher tema (claro/escuro/auto)
- Configurar idioma
- Ajustar tamanho da fonte
- Gerenciar notificações por email
- Tempo de sessão

### 4. Conexões Sociais
- Solicitar amizade
- Aceitar/recusar solicitações
- Remover amigos
- Listar amigos
- Ver solicitações pendentes

### 5. Badges e Realizações
- Sistema de pontos
- Níveis de usuário
- Badges conquistadas
- Histórico de atividades

---

## 🚀 Como Usar

### 1. Iniciar o Servidor

```bash
cd if-rede-backend
npm install
npm run dev
```

Esperado: Servidor rodando em `http://localhost:3000`

### 2. Testar com cURL

#### Registrar novo usuário:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "matricula": "2021001",
    "senha": "senha123456",
    "status_vinculo": "estudante"
  }'
```

Resposta esperada:
```json
{
  "data": {
    "usuario": { ... },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  },
  "message": "Usuário criado com sucesso."
}
```

#### Obter meu perfil:
```bash
TOKEN="seu_access_token_aqui"

curl -X GET http://localhost:3000/perfil/meu-perfil \
  -H "Authorization: Bearer $TOKEN"
```

#### Atualizar perfil:
```bash
curl -X PUT http://localhost:3000/perfil/atualizar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva Updated",
    "bio": "Desenvolvedor Full Stack"
  }'
```

#### Atualizar privacidade:
```bash
curl -X PUT http://localhost:3000/privacidade/atualizar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "perfil_publico": true,
    "quem_pode_mensagear": "amigos"
  }'
```

#### Solicitar amizade:
```bash
AMIGO_ID="id_do_usuario_aqui"

curl -X POST http://localhost:3000/conexoes/$AMIGO_ID/solicitar-amizade \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📱 Integração Frontend

### Exemplo React Hook (Next.js):

```typescript
// hooks/usePerfil.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function usePerfil(usuarioId?: string) {
  const queryClient = useQueryClient();

  // GET meu perfil ou perfil público
  const { data: perfil, isLoading } = useQuery({
    queryKey: ['perfil', usuarioId],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const url = usuarioId
        ? `${API_URL}/perfil/${usuarioId}`
        : `${API_URL}/perfil/meu-perfil`;

      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(url, config);
      return response.data.data;
    },
  });

  // PUT atualizar perfil
  const { mutate: atualizar, isPending } = useMutation({
    mutationFn: async (dados) => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(`${API_URL}/perfil/atualizar`, dados, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfil'] });
    },
  });

  return { perfil, isLoading, atualizar, isPending };
}

// Uso:
// const { perfil, atualizar } = usePerfil();
// atualizar({ nome: "Novo Nome" });
```

---

## 🗂️ Estrutura de Arquivos

```
if-rede-backend/
├── schemas/
│   ├── usuario.schema.js          (existente)
│   ├── privacidade.schema.js      (NOVO)
│   ├── preferencias.schema.js     (NOVO)
│   ├── conexoes.schema.js         (NOVO)
│   ├── badges.schema.js           (NOVO)
│   └── auditoria.schema.js        (NOVO)
├── controllers/
│   ├── perfil.controller.js       (NOVO)
│   ├── privacidade.controller.js  (NOVO)
│   ├── preferencias.controller.js (NOVO)
│   └── conexoes.controller.js     (NOVO)
├── routes/
│   ├── perfil.routes.js           (NOVO)
│   ├── privacidade.routes.js      (NOVO)
│   ├── preferencias.routes.js     (NOVO)
│   └── conexoes.routes.js         (NOVO)
├── middleware/
│   └── inicializar-perfil.middleware.js  (NOVO)
├── models/
│   └── index.js                   (ATUALIZADO)
├── app.js                         (ATUALIZADO)
├── auth.routes.js                 (ATUALIZADO)
└── SISTEMA-PERFIS-API.md          (NOVO - Documentação)
```

---

## 🧪 Fluxo de Teste Recomendado

1. **Criar usuário**
   ```bash
   POST /auth/register
   ```
   Guarde o `accessToken`

2. **Obter perfil completo**
   ```bash
   GET /perfil/meu-perfil
   ```

3. **Atualizar perfil**
   ```bash
   PUT /perfil/atualizar
   ```

4. **Obter preferências**
   ```bash
   GET /preferencias/minhas-preferencias
   ```

5. **Atualizar preferências**
   ```bash
   PUT /preferencias/atualizar
   ```

6. **Obter privacidade**
   ```bash
   GET /privacidade/minha-privacidade
   ```

7. **Criar segundo usuário** para testar conexões

8. **Testar amizade**
   ```bash
   POST /conexoes/{userId}/solicitar-amizade
   ```

9. **Aceitar amizade** (com segundo usuário)
   ```bash
   POST /conexoes/{userId}/aceitar-amizade
   ```

10. **Listar amigos**
    ```bash
    GET /conexoes/minhas-conexoes
    ```

---

## 📝 Variáveis de Ambiente

Certifique-se de que `.env` contém:

```env
MONGODB_URI=mongodb://localhost:27017/if-rede
NODE_ENV=development
PORT=3000
JWT_SECRET=sua_chave_secreta_super_segura
JWT_REFRESH_SECRET=sua_chave_refresh_super_segura
```

---

## 🐛 Troubleshooting

### "Connection refused"
- Verifique se MongoDB está rodando: `mongod`
- Verifique a URI em `.env`

### "Token inválido"
- Certifique-se de que está usando o `accessToken` (não `refreshToken`)
- Use formato: `Authorization: Bearer <token>`

### "Usuário não encontrado"
- Verifique o ID do usuário
- Certifique-se de que o usuário foi criado

### "Campos obrigatórios faltando"
- Verifique o body da requisição
- Consulte a documentação em `SISTEMA-PERFIS-API.md`

---

## 📚 Documentação Completa

Para documentação detalhada de todos os endpoints, consulte:
**`SISTEMA-PERFIS-API.md`**

---

## ✨ Próximas Funcionalidades (Futuro)

- [ ] Upload de avatar com multer/S3
- [ ] Sistema de notificações em tempo real
- [ ] Busca de usuários por nome
- [ ] Recomendações de amigos
- [ ] Histórico de atividades
- [ ] Dashboard de moderador
- [ ] Exportar dados de perfil

---

## 👨‍💻 Desenvolvido por

Sistema de Perfis - IF REDE
Projeto TCC

---

**Status:** ✅ Implementado e Testado

Para dúvidas ou melhorias, consulte a documentação ou entre em contato com o time de desenvolvimento.
