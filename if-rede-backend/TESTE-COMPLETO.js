#!/usr/bin/env node

/**
 * ============================================================================
 * TESTE COMPLETO - SISTEMA DE PERFIS
 * ============================================================================
 * Script para testar 100% do sistema de perfis implementado
 * 
 * INSTRUÇÕES:
 * 1. Certifique-se que MongoDB está rodando: mongod
 * 2. Inicie o servidor: npm run dev
 * 3. Em outro terminal, execute: node TESTE-COMPLETO.js
 * 4. Copie e execute cada comando cURL que o script gera
 */

const API_URL = 'http://localhost:3000';
let accessToken = null;
let usuarioId1 = null;
let usuarioId2 = null;

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    TESTE COMPLETO - SISTEMA DE PERFIS                      ║
║                                                                            ║
║  Este script guia você através de todos os testes para garantir que        ║
║  o sistema de perfis está funcionando 100%                                 ║
╚════════════════════════════════════════════════════════════════════════════╝

⚠️  PRÉ-REQUISITOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ MongoDB rodando em: mongodb://localhost:27017
  ✅ Servidor Express rodando em: http://localhost:3000
  ✅ Terminal com acesso a: curl (ou Postman)

🧪 TESTES A EXECUTAR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [1] Health Check
  [2] Registro de Usuário
  [3] Login
  [4] Perfil Completo
  [5] Atualizar Perfil
  [6] Customizar Aparência
  [7] Privacidade
  [8] Preferências
  [9] Badges
  [10] Perfil Público de Outro Usuário
  [11] Bloquear Usuário
  [12] Conexões Sociais (Amizades)
  [13] Auditoria

═══════════════════════════════════════════════════════════════════════════════
`);

// ============================================================================
// TESTES
// ============================================================================

const testes = [
  {
    numero: 1,
    nome: 'Health Check',
    descricao: 'Verificar se o servidor está rodando',
    metodo: 'GET',
    url: '/health',
    body: null,
    esperado: 'Status 200 e { status: "OK" }'
  },
  {
    numero: 2,
    nome: 'Registrar Primeiro Usuário',
    descricao: 'Criar usuário para testes',
    metodo: 'POST',
    url: '/auth/register',
    body: {
      nome: 'João Silva',
      email: 'joao@test.ifrede.com',
      matricula: '2024001',
      senha: 'Senha@123456',
      status_vinculo: 'estudante'
    },
    esperado: 'Status 201 com accessToken',
    salvarToken: true,
    salvarId: true
  },
  {
    numero: 3,
    nome: 'Login',
    descricao: 'Fazer login com as credenciais',
    metodo: 'POST',
    url: '/auth/login',
    body: {
      email: 'joao@test.ifrede.com',
      senha: 'Senha@123456'
    },
    esperado: 'Status 200 com tokens',
    requerAutenticacao: false
  },
  {
    numero: 4,
    nome: 'Obter Meu Perfil Completo',
    descricao: 'Obter dados completos do perfil autenticado',
    metodo: 'GET',
    url: '/perfil/meu-perfil',
    body: null,
    esperado: 'Status 200 com perfil, privacidade, preferências, conexões e badges',
    requerAutenticacao: true
  },
  {
    numero: 5,
    nome: 'Atualizar Perfil',
    descricao: 'Atualizar dados pessoais',
    metodo: 'PUT',
    url: '/perfil/atualizar',
    body: {
      nome: 'João Silva Atualizado',
      bio: 'Desenvolvedor Full Stack apaixonado por tecnologia',
      ocupacao: 'Estudante de Desenvolvimento'
    },
    esperado: 'Status 200 com dados atualizados',
    requerAutenticacao: true
  },
  {
    numero: 6,
    nome: 'Customizar Aparência',
    descricao: 'Atualizar cores e tema',
    metodo: 'PUT',
    url: '/perfil/atualizar-customizacao',
    body: {
      cor_fundo: '#F3F4F6',
      cor_botoes: '#7C3AED',
      tema: 'dark'
    },
    esperado: 'Status 200 com customização atualizada',
    requerAutenticacao: true
  },
  {
    numero: 7,
    nome: 'Obter Configurações de Privacidade',
    descricao: 'Obter configurações de privacidade',
    metodo: 'GET',
    url: '/privacidade/minha-privacidade',
    body: null,
    esperado: 'Status 200 com configurações de privacidade',
    requerAutenticacao: true
  },
  {
    numero: 8,
    nome: 'Atualizar Privacidade',
    descricao: 'Modificar configurações de privacidade',
    metodo: 'PUT',
    url: '/privacidade/atualizar',
    body: {
      perfil_publico: true,
      quem_pode_mensagear: 'amigos',
      mostrar_email_publicamente: false,
      mostrar_localizacao: true
    },
    esperado: 'Status 200 com configurações atualizadas',
    requerAutenticacao: true
  },
  {
    numero: 9,
    nome: 'Obter Preferências',
    descricao: 'Obter preferências do usuário',
    metodo: 'GET',
    url: '/preferencias/minhas-preferencias',
    body: null,
    esperado: 'Status 200 com preferências',
    requerAutenticacao: true
  },
  {
    numero: 10,
    nome: 'Atualizar Preferências',
    descricao: 'Modificar preferências',
    metodo: 'PUT',
    url: '/preferencias/atualizar',
    body: {
      tema_preferido: 'dark',
      idioma: 'pt-BR',
      tamanho_fonte: 1.2,
      notificacoes_email: {
        novo_mensagem: true,
        novo_comentario: false,
        nova_conexao: true,
        resumo_semanal: false
      }
    },
    esperado: 'Status 200 com preferências atualizadas',
    requerAutenticacao: true
  },
  {
    numero: 11,
    nome: 'Obter Badges',
    descricao: 'Obter badges e pontos',
    metodo: 'GET',
    url: '/perfil/:id/badges',
    body: null,
    esperado: 'Status 200 com badges',
    requerAutenticacao: false,
    usarId: true
  },
  {
    numero: 12,
    nome: 'Obter Estatísticas',
    descricao: 'Obter estatísticas do perfil',
    metodo: 'GET',
    url: '/perfil/:id/estatisticas',
    body: null,
    esperado: 'Status 200 com estatísticas',
    requerAutenticacao: false,
    usarId: true
  },
  {
    numero: 13,
    nome: 'Registrar Segundo Usuário',
    descricao: 'Criar segundo usuário para testes de conexão',
    metodo: 'POST',
    url: '/auth/register',
    body: {
      nome: 'Maria Santos',
      email: 'maria@test.ifrede.com',
      matricula: '2024002',
      senha: 'Senha@654321',
      status_vinculo: 'estudante'
    },
    esperado: 'Status 201 com novo usuário',
    requerAutenticacao: false,
    salvarId2: true
  },
  {
    numero: 14,
    nome: 'Solicitar Amizade',
    descricao: 'Solicitar amizade para segundo usuário',
    metodo: 'POST',
    url: '/conexoes/:id2/solicitar-amizade',
    body: null,
    esperado: 'Status 200 - Solicitação enviada',
    requerAutenticacao: true,
    usarId2: true
  },
  {
    numero: 15,
    nome: 'Listar Minhas Conexões',
    descricao: 'Listar meus amigos',
    metodo: 'GET',
    url: '/conexoes/minhas-conexoes',
    body: null,
    esperado: 'Status 200 com lista de amigos',
    requerAutenticacao: true
  },
  {
    numero: 16,
    nome: 'Listar Solicitações',
    descricao: 'Listar solicitações de amizade recebidas',
    metodo: 'GET',
    url: '/conexoes/minhas-solicitacoes',
    body: null,
    esperado: 'Status 200 com solicitações',
    requerAutenticacao: true
  },
  {
    numero: 17,
    nome: 'Ver Perfil Público',
    descricao: 'Visualizar perfil público sem autenticação',
    metodo: 'GET',
    url: '/perfil/:id',
    body: null,
    esperado: 'Status 200 com dados públicos',
    requerAutenticacao: false,
    usarId: true
  },
  {
    numero: 18,
    nome: 'Bloquear Usuário',
    descricao: 'Bloquear um usuário',
    metodo: 'POST',
    url: '/privacidade/bloquear/:id2',
    body: null,
    esperado: 'Status 200 - Usuário bloqueado',
    requerAutenticacao: true,
    usarId2: true
  },
  {
    numero: 19,
    nome: 'Desbloquear Usuário',
    descricao: 'Desbloquear um usuário',
    metodo: 'DELETE',
    url: '/privacidade/desbloquear/:id2',
    body: null,
    esperado: 'Status 200 - Usuário desbloqueado',
    requerAutenticacao: true,
    usarId2: true
  }
];

// ============================================================================
// EXIBIR TESTES
// ============================================================================

console.log(`\n🧪 LISTA DE TESTES A EXECUTAR:\n`);

testes.forEach(teste => {
  console.log(`${String(teste.numero).padStart(2, '0')}. ${teste.nome}`);
  console.log(`    📝 ${teste.descricao}`);
  
  if (teste.metodo === 'GET') {
    console.log(`    🔗 ${teste.metodo} ${API_URL}${teste.url}`);
  } else {
    console.log(`    🔗 ${teste.metodo} ${API_URL}${teste.url}`);
    if (teste.body) {
      console.log(`    📋 Body: ${JSON.stringify(teste.body).substring(0, 60)}...`);
    }
  }
  
  if (teste.requerAutenticacao) {
    console.log(`    🔐 Requer: Authorization: Bearer <token>`);
  }
  
  console.log(`    ✅ Esperado: ${teste.esperado}\n`);
});

// ============================================================================
// INSTRUÇÕES PARA EXECUTAR
// ============================================================================

console.log(`
═══════════════════════════════════════════════════════════════════════════════

⚡ COMO EXECUTAR OS TESTES:

OPÇÃO 1: USAR cURL (Terminal)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Copie e execute cada comando abaixo em seu terminal:

TESTE 1 - Health Check:
┌────────────────────────────────────────────────────────────────────────────┐
│ curl http://localhost:3000/health                                          │
└────────────────────────────────────────────────────────────────────────────┘
Esperado: {"status":"OK","service":"if-rede-backend","now":"2026-05-19..."}


TESTE 2 - Registrar Primeiro Usuário:
┌────────────────────────────────────────────────────────────────────────────┐
│ curl -X POST http://localhost:3000/auth/register \\                        │
│   -H "Content-Type: application/json" \\                                    │
│   -d '{                                                                    │
│     "nome": "João Silva",                                                 │
│     "email": "joao@test.ifrede.com",                                      │
│     "matricula": "2024001",                                               │
│     "senha": "Senha@123456",                                              │
│     "status_vinculo": "estudante"                                         │
│   }'                                                                       │
└────────────────────────────────────────────────────────────────────────────┘
Esperado: Status 201 com accessToken e refreshToken
⚠️  GUARDE O accessToken! Você precisará dele para os próximos testes.


TESTE 3 - Login:
┌────────────────────────────────────────────────────────────────────────────┐
│ curl -X POST http://localhost:3000/auth/login \\                           │
│   -H "Content-Type: application/json" \\                                    │
│   -d '{                                                                    │
│     "email": "joao@test.ifrede.com",                                      │
│     "senha": "Senha@123456"                                               │
│   }'                                                                       │
└────────────────────────────────────────────────────────────────────────────┘
Esperado: Status 200 com tokens


TESTE 4 - Obter Meu Perfil:
┌────────────────────────────────────────────────────────────────────────────┐
│ TOKEN="seu_access_token_aqui"                                             │
│ curl http://localhost:3000/perfil/meu-perfil \\                           │
│   -H "Authorization: Bearer \$TOKEN"                                       │
└────────────────────────────────────────────────────────────────────────────┘
Esperado: Status 200 com perfil completo, privacidade, preferências, badges


TESTE 5 - Atualizar Perfil:
┌────────────────────────────────────────────────────────────────────────────┐
│ TOKEN="seu_access_token_aqui"                                             │
│ curl -X PUT http://localhost:3000/perfil/atualizar \\                     │
│   -H "Authorization: Bearer \$TOKEN" \\                                    │
│   -H "Content-Type: application/json" \\                                    │
│   -d '{                                                                    │
│     "nome": "João Silva Atualizado",                                      │
│     "bio": "Desenvolvedor Full Stack"                                     │
│   }'                                                                       │
└────────────────────────────────────────────────────────────────────────────┘
Esperado: Status 200 com dados atualizados


TESTE 6 - Customizar Aparência:
┌────────────────────────────────────────────────────────────────────────────┐
│ TOKEN="seu_access_token_aqui"                                             │
│ curl -X PUT http://localhost:3000/perfil/atualizar-customizacao \\        │
│   -H "Authorization: Bearer \$TOKEN" \\                                    │
│   -H "Content-Type: application/json" \\                                    │
│   -d '{                                                                    │
│     "cor_fundo": "#F3F4F6",                                               │
│     "cor_botoes": "#7C3AED",                                              │
│     "tema": "dark"                                                        │
│   }'                                                                       │
└────────────────────────────────────────────────────────────────────────────┘
Esperado: Status 200 com customização atualizada


TESTE 7 - Obter Privacidade:
┌────────────────────────────────────────────────────────────────────────────┐
│ TOKEN="seu_access_token_aqui"                                             │
│ curl http://localhost:3000/privacidade/minha-privacidade \\               │
│   -H "Authorization: Bearer \$TOKEN"                                       │
└────────────────────────────────────────────────────────────────────────────┘
Esperado: Status 200 com configurações de privacidade


TESTE 8 - Atualizar Privacidade:
┌────────────────────────────────────────────────────────────────────────────┐
│ TOKEN="seu_access_token_aqui"                                             │
│ curl -X PUT http://localhost:3000/privacidade/atualizar \\                │
│   -H "Authorization: Bearer \$TOKEN" \\                                    │
│   -H "Content-Type: application/json" \\                                    │
│   -d '{                                                                    │
│     "perfil_publico": true,                                               │
│     "quem_pode_mensagear": "amigos"                                       │
│   }'                                                                       │
└────────────────────────────────────────────────────────────────────────────┘
Esperado: Status 200 com configurações atualizadas


TESTE 9 - Obter Preferências:
┌────────────────────────────────────────────────────────────────────────────┐
│ TOKEN="seu_access_token_aqui"                                             │
│ curl http://localhost:3000/preferencias/minhas-preferencias \\             │
│   -H "Authorization: Bearer \$TOKEN"                                       │
└────────────────────────────────────────────────────────────────────────────┘
Esperado: Status 200 com preferências


TESTE 10 - Atualizar Preferências:
┌────────────────────────────────────────────────────────────────────────────┐
│ TOKEN="seu_access_token_aqui"                                             │
│ curl -X PUT http://localhost:3000/preferencias/atualizar \\               │
│   -H "Authorization: Bearer \$TOKEN" \\                                    │
│   -H "Content-Type: application/json" \\                                    │
│   -d '{                                                                    │
│     "tema_preferido": "dark",                                             │
│     "tamanho_fonte": 1.2                                                  │
│   }'                                                                       │
└────────────────────────────────────────────────────────────────────────────┘
Esperado: Status 200 com preferências atualizadas


TESTE 11 - Registrar Segundo Usuário:
┌────────────────────────────────────────────────────────────────────────────┐
│ curl -X POST http://localhost:3000/auth/register \\                        │
│   -H "Content-Type: application/json" \\                                    │
│   -d '{                                                                    │
│     "nome": "Maria Santos",                                               │
│     "email": "maria@test.ifrede.com",                                     │
│     "matricula": "2024002",                                               │
│     "senha": "Senha@654321"                                               │
│   }'                                                                       │
└────────────────────────────────────────────────────────────────────────────┘
Esperado: Status 201 - Novo usuário criado
⚠️  GUARDE TAMBÉM ESTE ID!


TESTE 12 - Solicitar Amizade:
┌────────────────────────────────────────────────────────────────────────────┐
│ TOKEN="token_joao_aqui"                                                   │
│ ID_MARIA="id_maria_aqui"                                                  │
│ curl -X POST http://localhost:3000/conexoes/\$ID_MARIA/solicitar-amizade \\│
│   -H "Authorization: Bearer \$TOKEN"                                       │
└────────────────────────────────────────────────────────────────────────────┘
Esperado: Status 200 - Solicitação enviada


TESTE 13 - Listar Minhas Conexões:
┌────────────────────────────────────────────────────────────────────────────┐
│ TOKEN="seu_access_token_aqui"                                             │
│ curl http://localhost:3000/conexoes/minhas-conexoes \\                    │
│   -H "Authorization: Bearer \$TOKEN"                                       │
└────────────────────────────────────────────────────────────────────────────┘
Esperado: Status 200 com lista de amigos


TESTE 14 - Ver Perfil Público:
┌────────────────────────────────────────────────────────────────────────────┐
│ ID="id_do_usuario_aqui"                                                   │
│ curl http://localhost:3000/perfil/\$ID                                    │
└────────────────────────────────────────────────────────────────────────────┘
Esperado: Status 200 com dados públicos


═══════════════════════════════════════════════════════════════════════════════

OPÇÃO 2: USAR POSTMAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Abra Postman
2. Crie uma nova Collection: "IF REDE - Sistema de Perfis"
3. Configure a variável \`url\` como: http://localhost:3000
4. Configure a variável \`token\` após o primeiro login
5. Importe os endpoints conforme os testes acima

═══════════════════════════════════════════════════════════════════════════════

📊 CHECKLIST DE SUCESSO:

Execute todos os testes acima e verifique:

[  ] 1. Health Check retorna 200 OK
[  ] 2. Registro retorna 201 e token
[  ] 3. Login retorna 200 e token
[  ] 4. Perfil completo retorna 200
[  ] 5. Atualização de perfil retorna 200
[  ] 6. Customização retorna 200
[  ] 7. Privacidade retorna 200
[  ] 8. Atualização privacidade retorna 200
[  ] 9. Preferências retorna 200
[  ] 10. Atualização preferências retorna 200
[  ] 11. Segundo usuário registrado
[  ] 12. Solicitação de amizade retorna 200
[  ] 13. Lista de conexões retorna 200
[  ] 14. Perfil público retorna 200

═══════════════════════════════════════════════════════════════════════════════

✅ SE TODOS OS TESTES PASSAREM = SISTEMA 100% FUNCIONAL!

═══════════════════════════════════════════════════════════════════════════════
`);

module.exports = { testes };
