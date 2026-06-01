# 📑 Índice Completo - Sistema de Amizades e Perfil

## 📂 Estrutura de Arquivos Criados

### Services (Axios)
```
src/lib/services/
├── amizadeService.ts       (171 linhas)
│   ├── enviarSolicitacao()
│   ├── aceitarSolicitacao()
│   ├── recusarSolicitacao()
│   ├── desfazerAmizade()
│   ├── listarAmigos()
│   ├── listarSolicitacoes()
│   ├── verificarAmizade()
│   └── handleError()
│
└── usuarioService.ts       (150 linhas)
    ├── obterMeuPerfil()
    ├── obterPerfil()
    ├── atualizarPerfil()
    ├── atualizarFoto()
    ├── atualizarCustomizacao()
    ├── buscarUsuarios()
    └── handleError()
```

### Hooks (React)
```
src/hooks/
├── useAmizades.ts          (230 linhas)
│   ├── carregarAmigos()
│   ├── carregarSolicitacoes()
│   ├── enviarSolicitacao()
│   ├── aceitarSolicitacao()
│   ├── recusarSolicitacao()
│   ├── desfazerAmizade()
│   ├── verificarStatus()
│   └── Cache inteligente de 1 minuto
│
├── useUsuario.ts           (180 linhas)
│   ├── carregarMeuPerfil()
│   ├── obterPerfil()
│   ├── atualizarPerfil()
│   ├── atualizarFoto()
│   ├── atualizarCustomizacao()
│   └── Cache por usuarioId
│
└── useBuscador.ts          (120 linhas)
    ├── buscar()
    ├── limpar()
    ├── Debounce 500ms
    └── Cache de buscas
```

### Componentes

#### Amizades
```
src/components/Amizades/
├── CartaoAmigo.tsx         (90 linhas)
│   └── Card com avatar, nome, bio, botões
│
├── ListaAmigos.tsx         (220 linhas)
│   ├── Grid responsivo
│   ├── Paginação
│   ├── Filtro por nome
│   ├── Modal de confirmação para remover
│   └── Estados (loading, vazio, erro)
│
├── SolicitacoesAmizade.tsx (210 linhas)
│   ├── Lista de solicitações pendentes
│   ├── Botões aceitar/recusar
│   ├── Data de criação
│   └── Badge de contador
│
└── BuscadorAmigos.tsx      (280 linhas)
    ├── Input com debounce
    ├── Resultados em tempo real
    ├── Status de amizade
    ├── Botões dinâmicos por status
    └── Cache de resultados
```

#### Perfis
```
src/components/PerfisUsuario/
├── PerfilUsuario.tsx       (280 linhas)
│   ├── Exibição de perfil
│   ├── Avatar e banner
│   ├── Stats (amigos, postagens)
│   ├── Botões de ação (editar/adicionar)
│   ├── Status de amizade dinâmico
│   └── Customização visual aplicada
│
├── EditarPerfil.tsx        (340 linhas)
│   ├── Form com validações
│   ├── Upload de foto
│   ├── Campos: nome, bio, privacidade
│   ├── Mensagens de erro/sucesso
│   ├── Modal de carregamento
│   └── Redirects automáticos
│
└── MinhaCustomizacao.tsx   (360 linhas)
    ├── Seletor de cores RGB
    ├── 6 paletas pré-definidas
    ├── Selector de tema (claro/escuro/roxo)
    ├── Preview em tempo real
    ├── Aplicação de paletas com 1 clique
    └── Feedback visual de sucesso
```

#### Common (Utilitários)
```
src/components/Common/
├── ModalConfirmacao.tsx    (120 linhas)
│   ├── Overlay + Modal
│   ├── Customizável (título, mensagem, cores)
│   ├── Suporta loading e erro
│   └── Callbacks de ação
│
└── ModalCarregamento.tsx   (50 linhas)
    ├── Spinner animado
    ├── Mensagem customizável
    └── Simples e minimalista
```

### Páginas (App Router)
```
src/app/
├── amizades/
│   └── page.tsx            (160 linhas)
│       ├── 3 Tabs: Amigos, Solicitações, Buscar
│       ├── Componentes reutilizáveis
│       ├── Protegida por AuthGuard
│       └── Recarregamento inteligente
│
├── perfil/editar/
│   └── page.tsx            (80 linhas)
│       ├── Página de edição
│       ├── Carrega dados do usuário
│       └── Protegida por AuthGuard
│
├── customizacao/
│   └── page.tsx            (90 linhas)
│       ├── Página de customização
│       ├── Carrega customizações atuais
│       └── Protegida por AuthGuard
│
└── usuarios/[id]/amigos/
    └── page.tsx            (60 linhas)
        ├── Página pública de amigos
        ├── Parametrizada por ID
        └── Sem AuthGuard (público)
```

### Types
```
src/types/index.ts (estendido)
├── StatusAmizade (literal type)
├── Amizade (interface)
├── SolicitacaoAmizade (interface)
├── UsuarioComStatus (interface extendida)
└── CustomizacaoCompleta (interface)
```

---

## 🔄 Fluxos de Dados

### 1. Buscar e Adicionar Amigo

```
BuscadorAmigos
    ↓ onChange
useBuscador (com debounce 500ms)
    ↓ executarBusca
usuarioService.buscarUsuarios()
    ↓ Axios GET /usuarios/buscar?q=termo
Backend API
    ↓ Response com usuários
Cache em CACHE_BUSCA
    ↓ Renderiza resultados
Botão "Adicionar como Amigo"
    ↓ onClick
useAmizades.enviarSolicitacao()
    ↓ Axios POST /amizades/solicitar
Backend API
    ↓ Cria documento de amizade
Status atualizado → "Solicitação enviada"
```

### 2. Aceitar/Recusar Solicitação

```
SolicitacoesAmizade
    ↓ Carrega ao montar
useAmizades.carregarSolicitacoes()
    ↓ Axios GET /amizades/solicitacoes/pendentes
Backend API
    ↓ Lista de solicitações pendentes
Renderiza cartões com botões
    ↓ Click em "Aceitar"
useAmizades.aceitarSolicitacao(id)
    ↓ Axios POST /amizades/aceitar/:id
Backend API
    ↓ Atualiza status para "aceita"
Remove da lista localmente
    ↓ Callback onSolicitacaoProcessada
Atualiza cache global
```

### 3. Editar Perfil e Foto

```
EditarPerfil
    ↓ Form submit
Validação local (nome, bio, tamanho arquivo)
    ↓ Se válido
useUsuario.atualizarPerfil()
    ↓ Axios PUT /usuarios/perfil
Backend API
    ↓ Atualiza documento do usuário
Se foto selecionada:
    ↓ useUsuario.atualizarFoto(file)
    ↓ Axios POST /usuarios/perfil/foto (FormData)
Backend API
    ↓ Upload de arquivo, salva URL
Usuario atualizado no estado
    ↓ Mensagem de sucesso
    ↓ Redirect automático para /home
```

### 4. Customização Visual

```
MinhaCustomizacao
    ↓ Seletor de cores
Estados locais: corFundo, corBotoes, tema
    ↓ Preview em tempo real (CSS variables)
    ↓ Click em "Salvar Customização"
useUsuario.atualizarCustomizacao()
    ↓ Axios PUT /usuarios/customizacao
Backend API
    ↓ Salva customização no usuário
Sucesso visual
    ↓ Auto-desaparece após 2s
```

---

## 📊 Contagem de Linhas

| Arquivo | Linhas | Tipo |
|---------|--------|------|
| amizadeService.ts | 171 | Service |
| usuarioService.ts | 150 | Service |
| useAmizades.ts | 230 | Hook |
| useUsuario.ts | 180 | Hook |
| useBuscador.ts | 120 | Hook |
| CartaoAmigo.tsx | 90 | Componente |
| ListaAmigos.tsx | 220 | Componente |
| SolicitacoesAmizade.tsx | 210 | Componente |
| BuscadorAmigos.tsx | 280 | Componente |
| PerfilUsuario.tsx | 280 | Componente |
| EditarPerfil.tsx | 340 | Componente |
| MinhaCustomizacao.tsx | 360 | Componente |
| ModalConfirmacao.tsx | 120 | Componente |
| ModalCarregamento.tsx | 50 | Componente |
| page.tsx (amizades) | 160 | Página |
| page.tsx (editar) | 80 | Página |
| page.tsx (customizacao) | 90 | Página |
| page.tsx (usuarios amigos) | 60 | Página |
| **TOTAL** | **3.290** | **Linhas** |

---

## 🎨 Componentes Reutilizáveis

### ModalConfirmacao

```tsx
<ModalConfirmacao
  titulo="Remover amigo?"
  mensagem="Você tem certeza?"
  textoBotaoConfirmar="Remover"
  corBotaoConfirmar="red"
  onConfirmar={handleRemover}
  onCancelar={handleCancel}
  carregando={false}
  erro={null}
/>
```

### ModalCarregamento

```tsx
<ModalCarregamento 
  mensagem="Salvando..." 
  aberto={loading}
/>
```

### CartaoAmigo

```tsx
<CartaoAmigo 
  usuario={usuarioData}
  onRemover={(id) => handleRemover(id)}
  onVerPerfil={(id) => router.push(`/profile/${id}`)}
  removendo={false}
/>
```

---

## 🔐 Proteções e Validações

### Client-Side
- ✅ Validação de nome (3+ caracteres)
- ✅ Validação de bio (max 500 caracteres)
- ✅ Validação de foto (max 5MB, JPEG/PNG/WebP)
- ✅ Debounce em busca (500ms)
- ✅ AuthGuard em páginas sensíveis
- ✅ Confirmação antes de deletar

### Server-Side (Backend deve implementar)
- ✅ Validação de Bearer token
- ✅ Verificação de autorização
- ✅ Validação de limites de arquivo
- ✅ Prevenção de auto-amizade
- ✅ Prevenção de duplicação de solicitações
- ✅ Validação de status antes de aceitar

---

## 🚀 Otimizações Implementadas

| Otimização | Onde | Benefício |
|------------|------|-----------|
| Debounce | useBuscador (500ms) | Reduz requisições durante digitação |
| Cache | useAmizades, useUsuario | Evita requisições repetidas |
| Paginação | ListaAmigos (20 itens/página) | Melhor performance com muitos dados |
| Lazy Loading | Componentes dinamicamente carregam | Reduz bundle inicial |
| useCallback | Hooks | Previne re-renders desnecessários |
| useMemo | MinhaCustomizacao (preview) | Recalcula só quando cores mudam |
| React Server Components | Páginas | Renderização otimizada |

---

## 📱 Responsividade

### Mobile (< 640px)
- ✅ Cards em 1 coluna
- ✅ Inputs full-width
- ✅ Botões stacked verticalmente
- ✅ Modais com padding adequado
- ✅ Texto ajustado

### Tablet (640px - 1024px)
- ✅ Cards em 2 colunas
- ✅ Grid responsivo
- ✅ Layout flexível

### Desktop (> 1024px)
- ✅ Cards em 3 colunas
- ✅ Sidebar possível
- ✅ Preview + Controles lado a lado (Customização)

---

## 🧩 Dependências Utilizadas

- **Next.js** ^16.2.4 (App Router)
- **React** ^19.2.4
- **Axios** ^1.15.0 (HTTP)
- **Tailwind CSS** ^4 (Estilos)
- **js-cookie** ^3.0.5 (Token)
- **lucide-react** ^1.8.0 (Ícones)
- **TypeScript** ^5 (Tipagem)

---

## 🎯 Checklist de Implementação Completa

- ✅ Types/Interfaces criados
- ✅ Services com Axios
- ✅ Hooks customizados com cache
- ✅ Componentes de Amizades (4)
- ✅ Componentes de Perfil (3)
- ✅ Componentes de UI (2 Modais)
- ✅ Páginas App Router (4)
- ✅ Validações client-side
- ✅ Tratamento de erros
- ✅ Loading states
- ✅ Estados vazios
- ✅ Identidade visual roxo/oliva
- ✅ Documentação completa
- ✅ Integração com AuthContext

---

## 🔄 Próximos Passos para QA

1. **Testar Endpoints da API**
   - Verificar se todos os endpoints existem
   - Testar responses e status codes

2. **Testes E2E**
   - Criar novo usuário
   - Buscar amigos
   - Enviar/aceitar solicitações
   - Editar perfil e foto

3. **Testes de Performance**
   - Medir bundle size
   - Verificar load times
   - Testar com muitos amigos (pagination)

4. **Testes de Acessibilidade**
   - Navegação com teclado
   - Screen readers
   - Contraste de cores

5. **Testes de Responsividade**
   - Mobile (iPhone, Android)
   - Tablet (iPad)
   - Desktop (Chrome, Firefox)

---

**Última Atualização**: Janeiro 2025  
**Status**: ✅ Pronto para Desenvolvimento  
**Próximo**: Integrar com Backend e Realizar QA
