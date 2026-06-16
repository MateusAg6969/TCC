const express = require('express');
const portfolioController = require('../controllers/portfolio.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Public route to view a user's portfolio
router.get('/usuario/:userId', portfolioController.listarPorUsuario);

// Restricted: Pin/Unpin posts (Requires Auth)
router.patch('/pin', authMiddleware, portfolioController.alternarPin);

module.exports = router;
