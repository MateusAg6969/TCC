const express = require('express');
const medalhasController = require('../controllers/medalhas.controller');
const { authMiddleware, adminMiddleware, moderadorMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Public / Auth routes
router.get('/', medalhasController.listarTodas);
router.get('/usuario/:userId', medalhasController.listarPorUsuario);

// Restricted: Badge Assignment & Management (Admin / Moderator)
router.post('/:badgeId/atribuir/:userId', authMiddleware, moderadorMiddleware, medalhasController.atribuir);
router.delete('/:badgeId/remover/:userId', authMiddleware, moderadorMiddleware, medalhasController.removerDeUsuario);

// Restricted: System Badge Definition (Admin Only)
router.post('/', authMiddleware, adminMiddleware, medalhasController.criarMedalha);
router.delete('/:id', authMiddleware, adminMiddleware, medalhasController.excluirMedalha);

module.exports = router;
