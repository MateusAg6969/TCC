/**
 * ============================================================================
 * ROUTES: PREFERÊNCIAS
 * ============================================================================
 * Rotas para preferências do usuário.
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const preferenciasController = require('../controllers/preferencias.controller');

const router = express.Router();

// GET /preferencias/minhas-preferencias - Obter preferências
router.get('/minhas-preferencias', authMiddleware, preferenciasController.obterMinhasPreferencias);

// PUT /preferencias/atualizar - Atualizar preferências
router.put('/atualizar', authMiddleware, preferenciasController.atualizarPreferencias);

module.exports = router;
