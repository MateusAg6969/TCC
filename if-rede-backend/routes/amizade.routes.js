/**
 * ============================================================================
 * ROUTES: AMIZADES
 * ============================================================================
 * Rotas RESTful para gerenciar solicitações e amizades entre usuários.
 * 
 * ESTRUTURA:
 * POST   /api/amizades/solicitar           → Enviar solicitação
 * POST   /api/amizades/:id/aceitar         → Aceitar solicitação
 * POST   /api/amizades/:id/recusar         → Recusar solicitação
 * DELETE /api/amizades/:id                 → Desfazer amizade
 * GET    /api/amizades/meus-amigos         → Listar amigos com paginação
 * GET    /api/amizades/solicitacoes        → Listar solicitações pendentes
 * GET    /api/amizades/verificar/:amigoId  → Verificar status da relação
 *
 * AUTENTICAÇÃO:
 * Todas as rotas requerem token JWT válido (authMiddleware)
 * O token é extraído do header: Authorization: Bearer <token>
 *
 * SEGURANÇA:
 * ✓ Cada rota valida ownership do usuário autenticado
 * ✓ IDs são validados como ObjectId
 * ✓ Auto-amizade é prevenida
 * ✓ Duplicatas são detectadas
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const amizadeController = require('../controllers/amizadeController');

const router = express.Router();

// ============================================================================
// 1. ENVIAR SOLICITAÇÃO DE AMIZADE
// ============================================================================
// POST /api/amizades/solicitar
// Body: { amigoId: "507f1f77bcf86cd799439011" }
// Responses:
//   201 Created:
//     {
//       "success": true,
//       "data": {
//         "id": "...",
//         "usuarioId": "...",
//         "amigoId": "...",
//         "status": "pendente",
//         "dataSolicitacao": "2024-01-15T10:00:00Z"
//       },
//       "message": "Solicitação de amizade enviada com sucesso."
//     }
//   400 Bad Request: ID inválido ou auto-amizade
//   404 Not Found: Usuário não encontrado
//   409 Conflict: Amizade já existe
router.post('/solicitar', authMiddleware, amizadeController.enviarSolicitacao);

// ============================================================================
// 2. ACEITAR SOLICITAÇÃO
// ============================================================================
// POST /api/amizades/:id/aceitar
// Params: id = ID do documento Amizade
// Responses:
//   200 OK:
//     {
//       "success": true,
//       "data": {
//         "id": "...",
//         "status": "aceito",
//         "dataResposta": "2024-01-15T10:05:00Z"
//       },
//       "message": "Solicitação de amizade aceita com sucesso."
//     }
//   403 Forbidden: Sem permissão
//   404 Not Found: Amizade não encontrada
//   409 Conflict: Status não é pendente
router.post('/:id/aceitar', authMiddleware, amizadeController.aceitarSolicitacao);

// ============================================================================
// 3. RECUSAR SOLICITAÇÃO
// ============================================================================
// POST /api/amizades/:id/recusar
// Params: id = ID do documento Amizade
// Body: { motivo?: "string" } (opcional)
// Responses:
//   200 OK: Solicitação recusada com sucesso
//   403 Forbidden: Sem permissão
//   404 Not Found: Amizade não encontrada
//   409 Conflict: Status não é pendente
router.post('/:id/recusar', authMiddleware, amizadeController.recusarSolicitacao);

// ============================================================================
// 4. DESFAZER AMIZADE
// ============================================================================
// DELETE /api/amizades/:id
// Params: id = ID do documento Amizade
// Responses:
//   200 OK: Amizade desfeita com sucesso
//   403 Forbidden: Sem permissão (não é um dos amigos)
//   404 Not Found: Amizade não encontrada
//   409 Conflict: Status não é aceito
router.delete('/:id', authMiddleware, amizadeController.desfazerAmizade);

// ============================================================================
// 5. LISTAR AMIGOS COM PAGINAÇÃO
// ============================================================================
// GET /api/amizades/meus-amigos?page=1&limit=20
// Query Params:
//   page: número da página (default: 1)
//   limit: itens por página (default: 20, máximo: 100)
// Responses:
//   200 OK:
//     {
//       "success": true,
//       "data": {
//         "amigos": [
//           {
//             "_id": "...",
//             "perfil": { "nome": "João Silva", "bio": "..." },
//             "customizacao": { "foto_perfil_url": "..." }
//           }
//         ],
//         "total": 42,
//         "page": 1,
//         "pages": 3,
//         "limit": 20
//       },
//       "message": "Amigos carregados com sucesso."
//     }
router.get('/meus-amigos', authMiddleware, amizadeController.listarAmigos);

// ============================================================================
// 6. LISTAR SOLICITAÇÕES PENDENTES
// ============================================================================
// GET /api/amizades/solicitacoes?page=1&limit=20
// Query Params:
//   page: número da página (default: 1)
//   limit: itens por página (default: 20, máximo: 100)
// Responses:
//   200 OK:
//     {
//       "success": true,
//       "data": {
//         "solicitacoes": [
//           {
//             "_id": "...",
//             "amigoId": {
//               "_id": "...",
//               "perfil": { "nome": "Maria Santos" },
//               "customizacao": { "foto_perfil_url": "..." }
//             },
//             "status": "pendente",
//             "dataSolicitacao": "2024-01-15T10:00:00Z"
//           }
//         ],
//         "total": 5,
//         "page": 1,
//         "pages": 1,
//         "limit": 20
//       },
//       "message": "Solicitações carregadas com sucesso."
//     }
router.get('/solicitacoes', authMiddleware, amizadeController.listarSolicitacoes);

// ============================================================================
// 7. VERIFICAR STATUS DE AMIZADE
// ============================================================================
// GET /api/amizades/verificar/:amigoId
// Params:
//   amigoId: ID do outro usuário
// Responses:
//   200 OK:
//     {
//       "success": true,
//       "data": {
//         "status": "aceito" | "pendente" | "recusado" | null,
//         "soAmigos": true | false,
//         "temSolicitacaoPendente": false,
//         "quemEnviou": "eu" | "outro" | null,
//         "id": "...",
//         "dataSolicitacao": "2024-01-15T10:00:00Z",
//         "dataResposta": "2024-01-15T10:05:00Z"
//       },
//       "message": "Status da relação verificado com sucesso."
//     }
//   EXEMPLO: Para mostrar botão dinâmico no frontend:
//     - Se status === null → botão "Adicionar como amigo"
//     - Se status === "pendente" && quemEnviou === "outro" → "Responder solicitação"
//     - Se status === "pendente" && quemEnviou === "eu" → "Cancelar solicitação"
//     - Se status === "aceito" → "Desfazer amizade"
router.get('/verificar/:amigoId', authMiddleware, amizadeController.verificarAmizade);

module.exports = router;
