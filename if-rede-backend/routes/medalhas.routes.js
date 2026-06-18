const express = require('express');
const medalhasController = require('../controllers/medalhas.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Public / Auth routes
router.get('/', medalhasController.listarTodas);
router.get('/usuario/:userId', medalhasController.listarPorUsuario);

// Restricted: Badge Assignment (Simulating admin/system trigger)
router.post('/:badgeId/atribuir/:userId', authMiddleware, medalhasController.atribuir);

module.exports = router;
