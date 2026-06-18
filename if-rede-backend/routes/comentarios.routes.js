const express = require('express');
const { authMiddleware, moderadorMiddleware } = require('../middleware/auth.middleware');
const comentariosController = require('../controllers/comentarios.controller');

const router = express.Router();

// Public / Auth routes
router.get('/postagem/:postagemId', comentariosController.listarPorPostagem);
router.post('/', authMiddleware, comentariosController.criar);
router.post('/:id/curtir', authMiddleware, comentariosController.curtir);
router.delete('/:id/curtir', authMiddleware, comentariosController.descurtir);

// Restricted: Pedagogical Highlights (PROFESSOR/ORIENTADOR validated in controller)
router.patch('/:id/highlight', authMiddleware, comentariosController.toggleHighlight);

// Restricted: Moderation
router.patch('/:id/aprovar', authMiddleware, moderadorMiddleware, comentariosController.aprovar);
router.patch('/:id/rejeitar', authMiddleware, moderadorMiddleware, comentariosController.rejeitar);

module.exports = router;
