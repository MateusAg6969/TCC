const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

// Todas as rotas deste roteador exigem autenticação e privilégios de administrador
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * Rotas de Administração Global
 */
router.get('/users', adminController.listarUsuarios);
router.patch('/users/:id/role', adminController.alterarPapelUsuario);
router.patch('/users/:id/suspend', adminController.suspenderUsuario);
router.patch('/users/:id/unsuspend', adminController.removerSuspensaoUsuario);
router.delete('/users/:id', adminController.deletarUsuario);

module.exports = router;
