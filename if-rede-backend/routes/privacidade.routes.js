/**
 * ============================================================================
 * ROUTES: PRIVACIDADE
 * ============================================================================
 * Rotas para configurações de privacidade do usuário.
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const privacidadeController = require('../controllers/privacidade.controller');

const router = express.Router();

// GET /privacidade/minha-privacidade - Obter configurações
router.get('/minha-privacidade', authMiddleware, privacidadeController.obterMinhaPrivacidade);

// PUT /privacidade/atualizar - Atualizar configurações
router.put('/atualizar', authMiddleware, privacidadeController.atualizarPrivacidade);

// POST /privacidade/bloquear/:usuario_id - Bloquear usuário
router.post('/bloquear/:usuario_id', authMiddleware, privacidadeController.bloquearUsuario);

// DELETE /privacidade/desbloquear/:usuario_id - Desbloquear usuário
router.delete('/desbloquear/:usuario_id', authMiddleware, privacidadeController.desbloquearUsuario);

module.exports = router;
