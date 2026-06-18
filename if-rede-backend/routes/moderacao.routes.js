const express = require('express');
const { authMiddleware, moderadorMiddleware } = require('../middleware/auth.middleware');
const moderacaoController = require('../controllers/moderacao.controller');

const router = express.Router();

// Todas as rotas deste router exigem autenticação e privilégios de moderador/admin
router.use(authMiddleware);
router.use(moderadorMiddleware);

/**
 * Rotas de Moderação Administrativa
 */
router.get('/pending', moderacaoController.listarPendentes);
router.patch('/posts/:postId/approve', moderacaoController.aprovarPostagem);
router.patch('/posts/:postId/reject', moderacaoController.rejeitarPostagem);

module.exports = router;
