# ✨ Boas Práticas e Exemplos de Uso

## 📖 Exemplos Práticos de Integração

### Exemplo 1: Usar ComponenteAmigos em uma página

```tsx
// src/app/meu-painel/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import ListaAmigos from '@/components/Amizades/ListaAmigos';

export default function MeuPainelPage() {
  const { user } = useAuth();

  if (!user) return <div>Não autenticado</div>;

  return (
    <main>
      <h1>Meu Painel</h1>
      <ListaAmigos usuarioId={user.id} />
    </main>
  );
}
```

### Exemplo 2: Usar BuscadorAmigos com Callback

```tsx
'use client';

import { useState } from 'react';
import BuscadorAmigos from '@/components/Amizades/BuscadorAmigos';

export default function PaginaBuscarAmigos() {
  const [amigoAdicionado, setAmigoAdicionado] = useState(false);

  const handleAmigoAdicionado = () => {
    setAmigoAdicionado(true);
    // Mostrar notificação
    setTimeout(() => setAmigoAdicionado(false), 3000);
  };

  return (
    <div>
      {amigoAdicionado && (
        <div className="bg-green-600/20 text-green-400 p-4 rounded">
          ✓ Solicitação enviada com sucesso!
        </div>
      )}
      <BuscadorAmigos onAmigoAdicionado={handleAmigoAdicionado} />
    </div>
  );
}
```

### Exemplo 3: Usar PerfilUsuario com verificação de propriedade

```tsx
// src/app/usuarios/[id]/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import PerfilUsuario from '@/components/PerfisUsuario/PerfilUsuario';
import Link from 'next/link';

export default function PerfilPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();

  const ehPerfilProprio = user?.id === params.id;

  return (
    <main>
      <PerfilUsuario 
        usuarioId={params.id}
        usuarioAtualId={user?.id}
        onAmigoAdicionado={() => {
          // Recarregar solicitações
        }}
      />
      
      {ehPerfilProprio && (
        <Link href="/perfil/editar" className="btn-primary mt-4">
          Editar Perfil
        </Link>
      )}
    </main>
  );
}
```

---

## 🧪 Exemplos de Testes Unitários

### Teste de Hook useAmizades

```typescript
// src/hooks/__tests__/useAmizades.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAmizades } from '../useAmizades';
import * as amizadeService from '@/lib/services/amizadeService';

jest.mock('@/lib/services/amizadeService');

describe('useAmizades', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve carregar amigos com sucesso', async () => {
    const mockAmigos = [
      { _id: '1', perfil: { nome: 'João' } },
      { _id: '2', perfil: { nome: 'Maria' } },
    ];

    jest.spyOn(amizadeService, 'listarAmigos')
      .mockResolvedValue({
        amigos: mockAmigos,
        paginacao: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });

    const { result } = renderHook(() => useAmizades());

    await act(async () => {
      await result.current.carregarAmigos('user-123');
    });

    expect(result.current.amigos).toHaveLength(2);
    expect(result.current.amigos[0].perfil.nome).toBe('João');
  });

  it('deve enviar solicitação de amizade', async () => {
    const mockSolicitacao = {
      _id: '1',
      usuario_origem_id: 'user-123',
      usuario_destino_id: 'user-456',
      status: 'pendente',
    };

    jest.spyOn(amizadeService, 'enviarSolicitacao')
      .mockResolvedValue(mockSolicitacao);

    const { result } = renderHook(() => useAmizades());

    await act(async () => {
      await result.current.enviarSolicitacao('user-456');
    });

    expect(amizadeService.enviarSolicitacao).toHaveBeenCalledWith('user-456');
  });

  it('deve tratar erros ao carregar amigos', async () => {
    jest.spyOn(amizadeService, 'listarAmigos')
      .mockRejectedValue(new Error('Erro de rede'));

    const { result } = renderHook(() => useAmizades());

    await act(async () => {
      try {
        await result.current.carregarAmigos('user-123');
      } catch {
        // Esperado
      }
    });

    expect(result.current.error).toBeTruthy();
  });
});
```

### Teste de Componente CartaoAmigo

```typescript
// src/components/Amizades/__tests__/CartaoAmigo.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import CartaoAmigo from '../CartaoAmigo';

const mockUsuario = {
  _id: '123',
  id: '123',
  perfil: {
    nome: 'João Silva',
    bio: 'Developer',
  },
  customizacao: {
    banner_url: 'https://example.com/avatar.jpg',
  },
};

describe('CartaoAmigo', () => {
  it('deve renderizar dados do amigo', () => {
    render(
      <CartaoAmigo usuario={mockUsuario} />
    );

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('deve chamar onRemover ao clicar botão remover', () => {
    const handleRemover = jest.fn();
    render(
      <CartaoAmigo 
        usuario={mockUsuario} 
        onRemover={handleRemover}
      />
    );

    const btnRemover = screen.getByTitle('Remover amigo');
    fireEvent.click(btnRemover);

    expect(handleRemover).toHaveBeenCalledWith('123');
  });

  it('deve mostrar spinner quando removendo', () => {
    render(
      <CartaoAmigo 
        usuario={mockUsuario} 
        removendo={true}
      />
    );

    // Botão deve estar desabilitado
    const btnRemover = screen.getByTitle('Remover amigo');
    expect(btnRemover).toBeDisabled();
  });
});
```

---

## 🔍 Exemplos de Testes E2E (Cypress)

```typescript
// cypress/e2e/amizades.cy.ts
describe('Sistema de Amizades E2E', () => {
  beforeEach(() => {
    cy.login('usuario@test.com', 'senha123');
    cy.visit('/amizades');
  });

  describe('Buscar e Adicionar Amigo', () => {
    it('deve buscar um usuário e adicionar como amigo', () => {
      // Clicar na aba Buscar
      cy.contains('Buscar').click();

      // Digitar no input de busca
      cy.get('input[placeholder*="buscar"]').type('João');

      // Aguardar resultados
      cy.get('[data-testid="resultado-amigo"]')
        .first()
        .should('be.visible');

      // Clicar em adicionar
      cy.contains('Adicionar como Amigo').click();

      // Verificar feedback
      cy.contains('Solicitação enviada').should('be.visible');
    });
  });

  describe('Gerenciar Solicitações', () => {
    it('deve aceitar uma solicitação de amizade', () => {
      // Clicar em Solicitações
      cy.contains('Solicitações').click();

      // Encontrar uma solicitação
      cy.get('[data-testid="solicitacao-item"]')
        .first()
        .within(() => {
          cy.contains('button', /aceitar|check/i).click();
        });

      // Verificar remoção da lista
      cy.get('[data-testid="solicitacao-item"]')
        .should('have.length.lessThan', 2);
    });

    it('deve recusar uma solicitação de amizade', () => {
      cy.contains('Solicitações').click();

      cy.get('[data-testid="solicitacao-item"]')
        .first()
        .within(() => {
          cy.contains('button', /recusar|x/i).click();
        });

      cy.get('[data-testid="solicitacao-item"]')
        .should('have.length', 0);
    });
  });

  describe('Listar e Remover Amigos', () => {
    it('deve listar amigos com paginação', () => {
      cy.contains('Meus Amigos').click();

      // Verificar cards
      cy.get('[data-testid="card-amigo"]')
        .should('have.length.greaterThan', 0);

      // Clicar próxima página
      cy.contains('button', /próximo|chevron/i).click();

      // Verificar se mudou
      cy.url().should('include', 'page=2');
    });

    it('deve remover um amigo', () => {
      cy.contains('Meus Amigos').click();

      // Clicar em remover
      cy.get('[data-testid="card-amigo"]')
        .first()
        .within(() => {
          cy.contains('button', /remover|trash/i).click();
        });

      // Confirmar na modal
      cy.contains('button', 'Remover').click();

      // Verificar remoção
      cy.contains('amigo removido').should('be.visible');
    });
  });
});
```

---

## 🎨 Guia de Styling

### Padrão de Classes Tailwind

```tsx
// ✅ Bom: Classes bem organizadas
<div className="
  bg-if-card rounded-main border border-if-olive/30
  p-4 flex items-center gap-3
  hover:shadow-card transition-all duration-200
">
  
// ❌ Evitar: Classes desorganizadas
<div className="bg-if-card p-4 flex border border-if-olive/30 rounded-main items-center gap-3 transition-all duration-200 hover:shadow-card">
```

### Cores Consistentes

```tsx
// Texto
className="text-if-text"           // Padrão
className="text-if-olive"          // Secundário
className="text-if-olive/70"       // Com transparência

// Background
className="bg-if-bg"               // Fundo principal
className="bg-if-card"             // Cards
className="bg-purple-600"          // Ações principais
className="bg-purple-600/20"       // Hover leve

// Borders
className="border border-if-olive/30"    // Cards
className="border-2 border-purple-600"   // Foco
```

### Estados Interativos

```tsx
// Hover
className="hover:bg-purple-700"

// Focus (Inputs)
className="focus:outline-none focus:ring-2 focus:ring-purple-600"

// Disabled
className="disabled:opacity-50 disabled:cursor-not-allowed"

// Active/Selected
className="border-b-2 border-b-purple-600"
```

---

## 🚨 Tratamento de Erros Comuns

### Erro: "Can't perform a React state update on an unmounted component"

```tsx
// ❌ Problema
useEffect(() => {
  carregarDados();
}, []);

// ✅ Solução
useEffect(() => {
  let active = true;

  const carregar = async () => {
    const dados = await fetch('/api');
    if (active) {
      setDados(dados);
    }
  };

  carregar();

  return () => {
    active = false;
  };
}, []);
```

### Erro: "Hydration mismatch"

```tsx
// ❌ Problema
export default function Componente() {
  const [mounted, setMounted] = useState(false);
  // Renderiza diferente no server vs client
}

// ✅ Solução - Use useEffect
export default function Componente() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <ComponenteQuePrecisaDoClient />;
}
```

### Erro: "Exceeded quota"

```tsx
// ❌ Problema - Requisições duplicadas
const [amigos, setAmigos] = useState([]);

useEffect(() => {
  carregarAmigos(); // Chamado múltiplas vezes
}, []); // Falta dependência

// ✅ Solução - Usar useCallback
const carregarAmigos = useCallback(async () => {
  const dados = await amizadeService.listarAmigos('id');
  setAmigos(dados);
}, []);

useEffect(() => {
  carregarAmigos();
}, [carregarAmigos]);
```

---

## 📋 Checklist de Código Limpo

- [ ] Nomes de variáveis descritivos
- [ ] Funções com responsabilidade única
- [ ] Máximo 300 linhas por arquivo
- [ ] Comentários apenas para lógica complexa
- [ ] Tratamento de erros em todos os async
- [ ] Loading states visíveis
- [ ] Estados vazios tratados
- [ ] Validações client-side presentes
- [ ] TypeScript tipado corretamente
- [ ] Props documentadas com JSDoc

---

## 🔒 Checklist de Segurança

- [ ] Token armazenado em httpOnly cookie
- [ ] Validação de entrada em formulários
- [ ] Sanitização de output (XSS)
- [ ] CSRF tokens se necessário
- [ ] Rate limiting no backend
- [ ] Autenticação verificada em páginas protegidas
- [ ] Permissões verificadas (só edit próprio)
- [ ] Senhas hashidas (backend)
- [ ] HTTPS em produção
- [ ] Variables de ambiente não hardcoded

---

## 📈 Checklist de Performance

- [ ] Componentes não re-renderizam desnecessariamente
- [ ] Images otimizadas
- [ ] Código dividido entre client/server
- [ ] Lazy loading onde apropriado
- [ ] Cache implementado nos hooks
- [ ] Debounce em buscas/inputs
- [ ] Paginação para listas grandes
- [ ] Sem memory leaks (cleanup em useEffect)
- [ ] Bundle size monitorado
- [ ] Network requests minimizadas

---

## 🧩 Padrões de Componentes Reutilizáveis

### Pattern: Container + Presentational

```tsx
// Container (com lógica)
export default function ListaAmigosContainer({ usuarioId }) {
  const { amigos, loading } = useAmizades();

  useEffect(() => {
    carregarAmigos(usuarioId);
  }, [usuarioId]);

  return <ListaAmigosView amigos={amigos} loading={loading} />;
}

// Presentational (apenas UI)
export function ListaAmigosView({ amigos, loading }) {
  if (loading) return <Spinner />;
  return <div>{amigos.map(a => <Card {...a} />)}</div>;
}
```

### Pattern: Composition

```tsx
// Composição de modais
<ModalWrapper isOpen={isOpen} onClose={handleClose}>
  <ModalHeader title="Confirmação" />
  <ModalBody>Tem certeza?</ModalBody>
  <ModalFooter>
    <Button>Cancelar</Button>
    <Button variant="primary">Confirmar</Button>
  </ModalFooter>
</ModalWrapper>
```

---

## 📚 Referências e Recursos

- [React Best Practices](https://react.dev/learn)
- [Next.js App Router Patterns](https://nextjs.org/docs/app/building-your-application/routing)
- [Tailwind CSS Guidelines](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)

---

**Última Atualização**: Janeiro 2025  
**Versão**: 1.0  
**Status**: Pronto para Desenvolvimento
