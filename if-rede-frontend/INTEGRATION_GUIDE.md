# 🎨 IF REDE - Sistema de Amizades e Perfil

## 📋 Resumo da Implementação

Este documento descreve a implementação completa do sistema de **amizades** e **customização de perfil** do IF REDE, com integração Next.js App Router + Tailwind CSS + Axios.

### Estrutura de Componentes Criados

```
src/
├── lib/
│   └── services/
│       ├── amizadeService.ts       # API de amizades
│       └── usuarioService.ts       # API de usuários
├── hooks/
│   ├── useAmizades.ts              # Gerenciar amizades (cache, estado)
│   ├── useUsuario.ts               # Gerenciar usuário (cache, estado)
│   └── useBuscador.ts              # Buscar usuários com debounce
├── components/
│   ├── Amizades/
│   │   ├── CartaoAmigo.tsx         # Card individual de amigo
│   │   ├── ListaAmigos.tsx         # Lista com paginação
│   │   ├── SolicitacoesAmizade.tsx # Solicitações pendentes
│   │   └── BuscadorAmigos.tsx      # Busca e adição de amigos
│   ├── PerfisUsuario/
│   │   ├── PerfilUsuario.tsx       # Exibição de perfil
│   │   ├── EditarPerfil.tsx        # Formulário de edição
│   │   └── MinhaCustomizacao.tsx   # Customização visual
│   └── Common/
│       ├── ModalConfirmacao.tsx    # Modal de confirmação
│       └── ModalCarregamento.tsx   # Modal de loading
├── app/
│   ├── amizades/
│   │   └── page.tsx                # Página principal (3 tabs)
│   ├── perfil/editar/
│   │   └── page.tsx                # Editar perfil
│   ├── customizacao/
│   │   └── page.tsx                # Customizar tema
│   └── usuarios/[id]/amigos/
│       └── page.tsx                # Amigos de um usuário
├── types/
│   └── index.ts                    # Tipos estendidos (Amizade, etc)
```

---

## 🔌 INTEGRAÇÃO COM PÁGINAS EXISTENTES

### Adicionando Botões de Acesso no NavBar/Menu

Para acessibilidade, você pode adicionar links para as novas páginas no navegação existente:

```tsx
// No seu componente de navegação/menu
import Link from 'next/link';

export function NavMenu() {
  return (
    <nav>
      {/* ... outros links ... */}
      <Link href="/amizades" className="nav-link">
        👥 Amizades
      </Link>
      <Link href="/customizacao" className="nav-link">
        🎨 Customizar Tema
      </Link>
      <Link href="/perfil/editar" className="nav-link">
        ✏️ Editar Perfil
      </Link>
    </nav>
  );
}
```

### Integrando PerfilUsuario em /profile/[username]

Se você quer usar o novo componente `PerfilUsuario` na página de perfil existente:

```tsx
// src/app/profile/[username]/page.tsx
import { useAuth } from '@/context/AuthContext';
import PerfilUsuario from '@/components/PerfisUsuario/PerfilUsuario';

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const { user } = useAuth(); // Ou obter do AuthContext
  
  // Você precisará obter o usuarioId do username (fazer request à API)
  const usuarioId = await obterIdDoUsername(params.username);

  return (
    <PerfilUsuario 
      usuarioId={usuarioId}
      usuarioAtualId={user?.id}
      onAmigoAdicionado={() => {
        // Recarregar ou atualizar UI
      }}
    />
  );
}
```

---

## 🎯 ENDPOINTS API ESPERADOS

O backend deve ter os seguintes endpoints:

### Amizades

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/amizades/solicitar` | Enviar solicitação de amizade |
| POST | `/amizades/aceitar/:id` | Aceitar solicitação |
| POST | `/amizades/recusar/:id` | Recusar solicitação |
| DELETE | `/amizades/:id` | Desfazer amizade |
| GET | `/usuarios/:id/amigos` | Listar amigos com paginação |
| GET | `/amizades/solicitacoes/pendentes` | Listar solicitações pendentes |
| GET | `/amizades/status/:usuarioId` | Verificar status de amizade |

### Usuários

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/usuarios/me` | Obter perfil autenticado |
| GET | `/usuarios/:id` | Obter perfil de outro usuário |
| PUT | `/usuarios/perfil` | Atualizar dados do perfil |
| POST | `/usuarios/perfil/foto` | Upload de foto (multipart/form-data) |
| PUT | `/usuarios/customizacao` | Atualizar customização visual |
| GET | `/usuarios/buscar?q=termo` | Buscar usuários |

### Exemplo de Response (Amizades)

```json
{
  "ok": true,
  "message": "Amigo adicionado com sucesso",
  "data": {
    "_id": "123",
    "usuario_origem_id": "456",
    "usuario_destino_id": "789",
    "status": "pendente",
    "criado_em": "2024-01-01T10:00:00Z",
    "atualizado_em": "2024-01-01T10:00:00Z"
  }
}
```

---

## 🎨 IDENTIDADE VISUAL

### Cores Utilizadas

- **Roxo Principal**: `#7C3AED` (purple-600)
- **Roxo Escuro**: `#6D28D9` (purple-700)
- **Oliva IF REDE**: `#5C5D4D` / `#8F9972`
- **Background**: `#2D1B2D` (if-bg)
- **Card**: `#442844` (if-card)
- **Texto**: `#F2F2F2` (if-text)

### Componentes Padrão

- **Botões**: Roxo com hover mais escuro
- **Cards**: Borda oliva, background if-card
- **Input**: Borda cinza, focus roxo
- **Modais**: Overlay escuro, conteúdo se destaca
- **Badges**: Status com cores diferentes

---

## 🔒 SEGURANÇA E VALIDAÇÕES

### Client-Side Validations

Todos os formulários implementam validação:
- Nome (obrigatório, min 3 caracteres)
- Bio (max 500 caracteres)
- Foto (max 5MB, apenas JPEG/PNG/WebP)

### Server-Side (Backend)

O backend deve validar:
- Autenticação (Bearer token)
- Autorização (só editar próprio perfil)
- Limites de arquivo
- Duplicação de solicitações
- Status de amizade antes de aceitar/recusar

### Token Management

O token é armazenado em cookies (httpOnly recomendado):
```tsx
// Em src/context/AuthContext.tsx já implementado
Cookies.set(ACCESS_COOKIE, token, { expires: 1 });
```

---

## 📊 PERFORMANCE

### Otimizações Implementadas

1. **Debounce em Busca**: 500ms para evitar requisições excessivas
2. **Cache em Hooks**: Resultados em memória para reduzir requisições
3. **Paginação**: Amigos em grupos de 20
4. **Lazy Loading**: Componentes carregam dados sob demanda
5. **Memoização**: useCallback/useMemo para evitar re-renders desnecessários

### Tree Shaking

- Serviços organizados em arquivos separados
- Exports nomeados para melhor tree-shaking
- Client Components apenas onde necessário

---

## 🧪 TESTES SUGERIDOS

### Testes Unitários (Jest)

```typescript
// hooks/__tests__/useAmizades.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAmizades } from '../useAmizades';

describe('useAmizades', () => {
  it('deve listar amigos com sucesso', async () => {
    const { result } = renderHook(() => useAmizades());
    
    await act(async () => {
      await result.current.carregarAmigos('123');
    });
    
    expect(result.current.amigos).toHaveLength(5);
  });
});
```

### Testes E2E (Cypress)

```typescript
// e2e/amizades.cy.ts
describe('Sistema de Amizades', () => {
  beforeEach(() => {
    cy.login(); // Login automaticamente
    cy.visit('/amizades');
  });

  it('deve buscar e adicionar novo amigo', () => {
    cy.findByPlaceholderText(/buscar usuários/i).type('João');
    cy.findByRole('button', { name: /adicionar como amigo/i }).click();
    cy.findByText(/solicitação enviada/i).should('exist');
  });
});
```

---

## 🚀 DEPLOYMENT

### Environment Variables Necessárias

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001  # ou sua URL da API
```

### Build & Start

```bash
# Build
npm run build

# Start
npm run start

# Dev (com hot reload)
npm run dev
```

---

## 📝 NOTAS DE DESENVOLVIMENTO

### Flow de Dados

```
User Action (Click, Type)
    ↓
Client Component Handler
    ↓
Hook (useAmizades, useUsuario)
    ↓
Service (amizadeService, usuarioService)
    ↓
Axios API Call
    ↓
Backend Express
    ↓
Database
    ↓
Response → Hook → Component → UI Update
```

### Exemplos de Uso

#### Usando useAmizades em um componente

```tsx
'use client';

import { useAmizades } from '@/hooks/useAmizades';
import { useEffect } from 'react';

export function MeuComponente() {
  const { amigos, carregarAmigos, enviarSolicitacao } = useAmizades();

  useEffect(() => {
    carregarAmigos('user-id');
  }, []);

  return (
    <>
      {amigos.map(amigo => (
        <CartaoAmigo key={amigo._id} usuario={amigo} />
      ))}
      
      <button onClick={() => enviarSolicitacao('outro-user-id')}>
        Adicionar
      </button>
    </>
  );
}
```

#### Usando useUsuario para editar

```tsx
'use client';

import { useUsuario } from '@/hooks/useUsuario';

export function EditarMeuPerfil() {
  const { loading, atualizarPerfil } = useUsuario();

  const handleSubmit = async (formData) => {
    await atualizarPerfil({
      nome: formData.nome,
      bio: formData.bio,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={loading}>Salvar</button>
    </form>
  );
}
```

---

## 🐛 Troubleshooting

### "Unauthorized" ao chamar API

- Verificar se token está sendo passado corretamente
- Verificar se `setAuthHeader(token)` foi chamado
- Verificar expiração do token

### Componentes não renderizam

- Verificar se está dentro de `<AuthGuard>`
- Verificar se `useAuth()` foi chamado (exige AuthProvider)
- Verificar console para erros de sintaxe

### Cache não limpa

- Chamar `limpar()` explicitamente após ações
- Usar `key` prop para forçar re-render de componentes

---

## 📚 Recursos Úteis

- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Axios](https://axios-http.com/docs/intro)
- [React Hooks](https://react.dev/reference/react/hooks)

---

## ✅ Checklist de QA

- [ ] Criar novo usuário e fazer login
- [ ] Buscar outros usuários
- [ ] Enviar solicitação de amizade
- [ ] Aceitar/recusar solicitação
- [ ] Listar amigos com paginação
- [ ] Remover amigo
- [ ] Editar próprio perfil
- [ ] Upload de foto
- [ ] Customizar cores e tema
- [ ] Verificar responsividade (mobile/desktop)
- [ ] Testar com conexão lenta (DevTools)
- [ ] Validações de formulário
- [ ] Mensagens de erro
- [ ] Estados de loading

---

**Versão**: 1.0  
**Data**: Janeiro 2025  
**Status**: Pronto para Integração
