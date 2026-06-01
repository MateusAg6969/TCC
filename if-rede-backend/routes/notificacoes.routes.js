/**
 * ============================================================================
 * ROUTES: NOTIFICACOES
 * ============================================================================
 * Endpoints para gerenciar notificações dos usuários.
 * Requer autenticação (middleware verificaToken).
 */

const express = require('express');
const router = express.Router();
const { verificaToken } = require('../middleware/auth.middleware');
const {
  listarNotificacoes,
  contarNaoLidas,
  marcarComoLida,
  marcarTudasComoLidas,
  deletarNotificacao,
  deletarTodasNotificacoes,
} = require('../controllers/notificacoes.controller');

// ============================================================================
// Middleware: Verificar autenticação em todas as rotas
// ============================================================================
router.use(verificaToken);

// ============================================================================
// GET: Listar notificações
// ============================================================================
// GET /api/notificacoes
// Query params: pagina, limite, filtro (all|nao-lidas)
router.get('/', listarNotificacoes);

// ============================================================================
// GET: Contar notificações não lidas
// ============================================================================
// GET /api/notificacoes/nao-lidas/contador
router.get('/nao-lidas/contador', contarNaoLidas);

// ============================================================================
// PATCH: Marcar notificação como lida
// ============================================================================
// PATCH /api/notificacoes/:id/lida
router.patch('/:id/lida', marcarComoLida);

// ============================================================================
// PATCH: Marcar todas como lidas
// ============================================================================
// PATCH /api/notificacoes/marcar-tudo-lido
router.patch('/marcar-tudo-lido', marcarTudasComoLidas);

// ============================================================================
// DELETE: Deletar notificação
// ============================================================================
// DELETE /api/notificacoes/:id
router.delete('/:id', deletarNotificacao);

// ============================================================================
// DELETE: Deletar todas as notificações
// ============================================================================
// DELETE /api/notificacoes
router.delete('/', deletarTodasNotificacoes);

module.exports = router;
