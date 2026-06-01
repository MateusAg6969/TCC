/**
 * ============================================================================
 * ROUTES: PERFIL
 * ============================================================================
 * Rotas para operações de perfil do usuário.
 */

const express = require('express');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth.middleware');
const perfilController = require('../controllers/perfil.controller');

const router = express.Router();

// GET /perfil/meu-perfil - Obter perfil completo (autenticado)
router.get('/meu-perfil', authMiddleware, perfilController.obterMeuPerfil);

// GET /perfil/:id/badges - Obter badges
router.get('/:id/badges', perfilController.obterBadges);

// GET /perfil/:id/estatisticas - Obter estatísticas
router.get('/:id/estatisticas', perfilController.obterEstatisticas);

// GET /perfil/:id - Obter perfil público
router.get('/:id', optionalAuthMiddleware, perfilController.obterPerfilPublico);

// PUT /perfil/atualizar - Atualizar perfil (autenticado)
router.put('/atualizar', authMiddleware, perfilController.atualizarPerfil);

// PUT /perfil/atualizar-customizacao - Atualizar customização visual
router.put(
  '/atualizar-customizacao',
  authMiddleware,
  perfilController.atualizarCustomizacao
);

// GET /perfil/:id/badges - Obter badges
router.get('/:id/badges', perfilController.obterBadges);

// GET /perfil/:id/estatisticas - Obter estatísticas
router.get('/:id/estatisticas', perfilController.obterEstatisticas);

module.exports = router;
