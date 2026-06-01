/**
 * ============================================================================
 * ROUTES: CONEXÕES
 * ============================================================================
 * Rotas para gerenciar conexões e amizades.
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const conexoesController = require('../controllers/conexoes.controller');

const router = express.Router();

// POST /conexoes/:usuario_id/solicitar-amizade - Solicitar amizade
router.post(
  '/:usuario_id/solicitar-amizade',
  authMiddleware,
  conexoesController.solicitarAmizade
);

// POST /conexoes/:usuario_id/aceitar-amizade - Aceitar solicitação
router.post(
  '/:usuario_id/aceitar-amizade',
  authMiddleware,
  conexoesController.aceitarAmizade
);

// DELETE /conexoes/:usuario_id/recusar-amizade - Recusar solicitação
router.delete(
  '/:usuario_id/recusar-amizade',
  authMiddleware,
  conexoesController.recusarAmizade
);

// DELETE /conexoes/:usuario_id/remover-amizade - Remover amizade
router.delete(
  '/:usuario_id/remover-amizade',
  authMiddleware,
  conexoesController.removerAmizade
);

// GET /conexoes/minhas-conexoes - Meus amigos
router.get('/minhas-conexoes', authMiddleware, conexoesController.minhasConexoes);

// GET /conexoes/:usuario_id/amigos - Amigos de outro usuário
router.get('/:usuario_id/amigos', conexoesController.obterAmigos);

// GET /conexoes/minhas-solicitacoes - Solicitações recebidas
router.get('/minhas-solicitacoes', authMiddleware, conexoesController.minhasSolicitacoes);

module.exports = router;
