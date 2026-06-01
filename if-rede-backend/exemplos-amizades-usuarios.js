/**
 * ============================================================================
 * EXEMPLOS DE USO: ROTAS DE AMIZADES E USUÁRIOS
 * ============================================================================
 * Documentação completa de todos os endpoints implementados
 *
 * OBSERVAÇÕES IMPORTANTES:
 * - Todas as rotas autenticadas requerem header: Authorization: Bearer <JWT_TOKEN>
 * - As respostas seguem o padrão: { success, data, message }
 * - Códigos de status: 200 OK, 201 Created, 400 Bad Request, 403 Forbidden, 404 Not Found, 409 Conflict
 */

// ============================================================================
// 1. ROTAS DE AMIZADES (/api/amizades)
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────
// 1.1 ENVIAR SOLICITAÇÃO DE AMIZADE
// ─────────────────────────────────────────────────────────────────────────

// Request:
POST /api/amizades/solicitar
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "amigoId": "507f1f77bcf86cd799439011"
}

// Response 201 Created:
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "usuarioId": "507f1f77bcf86cd799439011",
    "amigoId": "507f1f77bcf86cd799439010",
    "status": "pendente",
    "dataSolicitacao": "2024-01-15T10:00:00.000Z"
  },
  "message": "Solicitação de amizade enviada com sucesso."
}

// Possíveis Erros:
// 400: "Você não pode enviar solicitação para si mesmo."
// 400: "ID do amigo inválido."
// 404: "Usuário destino não encontrado."
// 409: "Já existe uma solicitação ou amizade com este usuário."
// 401: "Token ausente ou inválido."

// ─────────────────────────────────────────────────────────────────────────
// 1.2 ACEITAR SOLICITAÇÃO DE AMIZADE
// ─────────────────────────────────────────────────────────────────────────

// Request:
POST /api/amizades/507f1f77bcf86cd799439012/aceitar
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{}

// Response 200 OK:
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "usuarioId": "507f1f77bcf86cd799439011",
    "amigoId": "507f1f77bcf86cd799439010",
    "status": "aceito",
    "dataResposta": "2024-01-15T10:05:00.000Z"
  },
  "message": "Solicitação de amizade aceita com sucesso."
}

// Possíveis Erros:
// 400: "ID da solicitação inválido."
// 403: "Você não tem permissão para aceitar esta solicitação."
// 404: "Solicitação de amizade não encontrada."
// 409: "Esta solicitação já foi aceita."

// ─────────────────────────────────────────────────────────────────────────
// 1.3 RECUSAR SOLICITAÇÃO DE AMIZADE
// ─────────────────────────────────────────────────────────────────────────

// Request:
POST /api/amizades/507f1f77bcf86cd799439012/recusar
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "motivo": "Não conheço este usuário"
}

// Response 200 OK:
{
  "success": true,
  "data": null,
  "message": "Solicitação recusada com sucesso."
}

// ─────────────────────────────────────────────────────────────────────────
// 1.4 DESFAZER AMIZADE
// ─────────────────────────────────────────────────────────────────────────

// Request:
DELETE /api/amizades/507f1f77bcf86cd799439012
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

// Response 200 OK:
{
  "success": true,
  "data": null,
  "message": "Amizade desfeita com sucesso."
}

// Possíveis Erros:
// 403: "Você não tem permissão para desfazer esta amizade."
// 409: "Apenas amizades ativas podem ser desfeitas."

// ─────────────────────────────────────────────────────────────────────────
// 1.5 LISTAR MEUS AMIGOS (COM PAGINAÇÃO)
// ─────────────────────────────────────────────────────────────────────────

// Request:
GET /api/amizades/meus-amigos?page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Response 200 OK:
{
  "success": true,
  "data": {
    "amigos": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "perfil": {
          "nome": "João Silva",
          "bio": "Estudante de Engenharia"
        },
        "customizacao": {
          "foto_perfil_url": "https://example.com/foto.jpg"
        }
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "perfil": {
          "nome": "Maria Santos",
          "bio": "Administradora"
        },
        "customizacao": {
          "foto_perfil_url": "https://example.com/foto2.jpg"
        }
      }
    ],
    "total": 42,
    "page": 1,
    "pages": 3,
    "limit": 20
  },
  "message": "Amigos carregados com sucesso."
}

// Query Parameters:
// - page: número da página (default: 1)
// - limit: itens por página (default: 20, máximo: 100)

// ─────────────────────────────────────────────────────────────────────────
// 1.6 LISTAR SOLICITAÇÕES PENDENTES
// ─────────────────────────────────────────────────────────────────────────

// Request:
GET /api/amizades/solicitacoes?page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Response 200 OK:
{
  "success": true,
  "data": {
    "solicitacoes": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "amigoId": {
          "_id": "507f1f77bcf86cd799439010",
          "perfil": {
            "nome": "Pedro Costa",
            "bio": "Desenvolvedor"
          },
          "customizacao": {
            "foto_perfil_url": "https://example.com/foto3.jpg"
          }
        },
        "status": "pendente",
        "dataSolicitacao": "2024-01-15T09:00:00.000Z"
      }
    ],
    "total": 5,
    "page": 1,
    "pages": 1,
    "limit": 20
  },
  "message": "Solicitações carregadas com sucesso."
}

// ─────────────────────────────────────────────────────────────────────────
// 1.7 VERIFICAR STATUS DE AMIZADE
// ─────────────────────────────────────────────────────────────────────────

// Request:
GET /api/amizades/verificar/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Response 200 OK (São amigos):
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "status": "aceito",
    "soAmigos": true,
    "temSolicitacaoPendente": false,
    "quemEnviou": null,
    "dataSolicitacao": "2024-01-15T10:00:00.000Z",
    "dataResposta": "2024-01-15T10:05:00.000Z"
  },
  "message": "Status da relação verificado com sucesso."
}

// Response 200 OK (Solicitação pendente):
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "status": "pendente",
    "soAmigos": false,
    "temSolicitacaoPendente": true,
    "quemEnviou": "outro",
    "dataSolicitacao": "2024-01-15T10:00:00.000Z",
    "dataResposta": null
  },
  "message": "Status da relação verificado com sucesso."
}

// Response 200 OK (Nenhuma relação):
{
  "success": true,
  "data": {
    "status": null,
    "soAmigos": false,
    "temSolicitacaoPendente": false,
    "quemEnviou": null
  },
  "message": "Nenhuma relação encontrada."
}

// ============================================================================
// 2. ROTAS DE USUÁRIOS (/api/usuarios)
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────
// 2.1 OBTER PERFIL PÚBLICO DE OUTRO USUÁRIO
// ─────────────────────────────────────────────────────────────────────────

// Request (sem autenticação):
GET /api/usuarios/507f1f77bcf86cd799439011
Content-Type: application/json

// Response 200 OK:
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "perfil": {
      "nome": "João Silva",
      "bio": "Estudante de Engenharia",
      "privacidade": "publico"
    },
    "customizacao": {
      "tema": "claro",
      "foto_perfil_url": "https://example.com/foto.jpg",
      "banner_url": "https://example.com/banner.jpg"
    },
    "stats": {
      "total_postagens": 42,
      "total_pontos": 1500,
      "nivel": 5
    },
    "ativo": true
  },
  "message": "Perfil carregado com sucesso."
}

// Response 200 OK (Perfil privado, não segue):
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "perfil": {
      "nome": "Maria Santos",
      "privacidade": "privado"
    },
    "acesso_restrito": true
  },
  "message": "Perfil privado. Siga o usuário para ver mais informações."
}

// ─────────────────────────────────────────────────────────────────────────
// 2.2 OBTER MEU PERFIL COMPLETO
// ─────────────────────────────────────────────────────────────────────────

// Request (autenticado):
GET /api/usuarios/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

// Response 200 OK:
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439010",
    "perfil": {
      "nome": "João Silva",
      "bio": "Estudante de Engenharia",
      "email": "joao@example.com",
      "privacidade": "publico"
    },
    "customizacao": {
      "tema": "claro",
      "cores": {
        "primaria": "#6A4C93",
        "secundaria": "#556B2F"
      },
      "foto_perfil_url": "https://example.com/foto.jpg",
      "banner_url": "https://example.com/banner.jpg"
    },
    "stats": {
      "total_postagens": 42,
      "total_pontos": 1500,
      "nivel": 5
    },
    "ativo": true,
    "conexoes": {
      "total_amigos": 15,
      "solicitacoes_pendentes": 3
    }
  },
  "message": "Perfil carregado com sucesso."
}

// ─────────────────────────────────────────────────────────────────────────
// 2.3 ATUALIZAR MEU PERFIL
// ─────────────────────────────────────────────────────────────────────────

// Request:
PUT /api/usuarios/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "nome": "João Silva Santos",
  "bio": "Desenvolvedor Full Stack | Estudante de TI",
  "email": "joao.silva@example.com",
  "privacidade": "publico"
}

// Response 200 OK:
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439010",
    "perfil": {
      "nome": "João Silva Santos",
      "bio": "Desenvolvedor Full Stack | Estudante de TI",
      "email": "joao.silva@example.com",
      "privacidade": "publico"
    }
  },
  "message": "Perfil atualizado com sucesso."
}

// Possíveis Erros:
// 400: "Nome deve ser uma string não vazia."
// 400: "Nome não pode exceder 100 caracteres."
// 400: "Bio não pode exceder 500 caracteres."
// 400: "Email inválido."
// 409: "Este email já está em uso."

// ─────────────────────────────────────────────────────────────────────────
// 2.4 ATUALIZAR CUSTOMIZAÇÃO (TEMA E CORES)
// ─────────────────────────────────────────────────────────────────────────

// Request:
PUT /api/usuarios/me/customizacao
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "tema": "escuro",
  "cores": {
    "primaria": "#6A4C93",
    "secundaria": "#556B2F",
    "destaque": "#FF6B6B"
  },
  "foto_perfil_url": "https://example.com/nova-foto.jpg",
  "banner_url": "https://example.com/novo-banner.jpg"
}

// Response 200 OK:
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439010",
    "customizacao": {
      "tema": "escuro",
      "cores": {
        "primaria": "#6A4C93",
        "secundaria": "#556B2F",
        "destaque": "#FF6B6B"
      },
      "foto_perfil_url": "https://example.com/nova-foto.jpg",
      "banner_url": "https://example.com/novo-banner.jpg"
    }
  },
  "message": "Customização atualizada com sucesso."
}

// Possíveis Erros:
// 400: "Tema deve ser \"claro\" ou \"escuro\"."
// 400: "Cor \"primaria\" deve estar no formato #RRGGBB."
// 400: "URL da foto de perfil inválida."
// 400: "URL do banner inválida."

// ============================================================================
// FLUXO DE EXEMPLO: CICLO COMPLETO DE AMIZADE
// ============================================================================

// PASSO 1: Usuário A envia solicitação para Usuário B
POST /api/amizades/solicitar
{
  "amigoId": "507f1f77bcf86cd799439011"  // ID do Usuário B
}
// ✅ Resposta 201: Solicitação criada

// PASSO 2: Usuário B verifica se há solicitações
GET /api/amizades/solicitacoes
// ✅ Resposta 200: Lista contém a solicitação de Usuário A

// PASSO 3: Usuário B verifica o status antes de responder
GET /api/amizades/verificar/507f1f77bcf86cd799439010  // ID do Usuário A
// ✅ Resposta 200: status=pendente, quemEnviou=outro

// PASSO 4: Usuário B aceita a solicitação
POST /api/amizades/507f1f77bcf86cd799439012/aceitar  // ID da amizade
// ✅ Resposta 200: status mudou para "aceito"

// PASSO 5: Ambos listam seus amigos
GET /api/amizades/meus-amigos
// ✅ Resposta 200: Ambos aparecem na lista de amigos

// PASSO 6: Qualquer um pode desfazer a amizade
DELETE /api/amizades/507f1f77bcf86cd799439012
// ✅ Resposta 200: Amizade desfeita, status=recusado

// ============================================================================
// INTEGRAÇÃO COM FRONTEND (EXEMPLO COM JAVASCRIPT)
// ============================================================================

const token = localStorage.getItem('authToken');

// Função auxiliar para fazer requests autenticadas
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`http://localhost:3000${endpoint}`, options);
  return response.json();
}

// Enviar solicitação de amizade
async function enviarSolicitacao(amigoId) {
  const result = await apiRequest('/api/amizades/solicitar', 'POST', {
    amigoId
  });
  console.log(result.message);
}

// Listar amigos
async function listarMeusAmigos() {
  const result = await apiRequest('/api/amizades/meus-amigos?page=1&limit=20');
  console.log(result.data.amigos);
}

// Verificar status de amizade (para botão dinâmico)
async function verificarAmizade(amigoId) {
  const result = await apiRequest(`/api/amizades/verificar/${amigoId}`);
  const { status, quemEnviou } = result.data;

  if (status === null) {
    return 'Adicionar como amigo';
  } else if (status === 'pendente' && quemEnviou === 'outro') {
    return 'Responder solicitação';
  } else if (status === 'pendente' && quemEnviou === 'eu') {
    return 'Cancelar solicitação';
  } else if (status === 'aceito') {
    return 'Desfazer amizade';
  }
}

// ============================================================================
// TESTES COM CURL
// ============================================================================

// Enviar solicitação
curl -X POST http://localhost:3000/api/amizades/solicitar \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"amigoId":"507f1f77bcf86cd799439011"}'

// Listar amigos
curl -X GET "http://localhost:3000/api/amizades/meus-amigos?page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// Obter perfil público
curl -X GET http://localhost:3000/api/usuarios/507f1f77bcf86cd799439011

// Obter meu perfil (autenticado)
curl -X GET http://localhost:3000/api/usuarios/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// Atualizar perfil
curl -X PUT http://localhost:3000/api/usuarios/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"nome":"Novo Nome","bio":"Nova biografia"}'

// ============================================================================
// ESTRUTURA DE ERRO PADRÃO
// ============================================================================

// Erro 401 (Não autenticado):
{
  "success": false,
  "error": "Token ausente ou inválido.",
  "statusCode": 401
}

// Erro 403 (Sem permissão):
{
  "success": false,
  "error": "Você não tem permissão para aceitar esta solicitação.",
  "statusCode": 403
}

// Erro 404 (Não encontrado):
{
  "success": false,
  "error": "Usuário não encontrado.",
  "statusCode": 404
}

// Erro 409 (Conflito):
{
  "success": false,
  "error": "Já existe uma solicitação ou amizade com este usuário.",
  "statusCode": 409
}

// Erro 500 (Erro do servidor):
{
  "success": false,
  "error": "Erro interno do servidor",
  "statusCode": 500
}

module.exports = {};
