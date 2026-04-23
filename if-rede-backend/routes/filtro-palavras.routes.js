const express = require('express');
const { authMiddleware, moderadorMiddleware } = require('../middleware/auth.middleware');
const {
  listarPalavras,
  criarPalavra,
  atualizarPalavra,
  removerPalavra,
} = require('../controllers/filtro-palavras.controller');

const router = express.Router();

router.get('/', authMiddleware, moderadorMiddleware, listarPalavras);

router.post('/', authMiddleware, moderadorMiddleware, criarPalavra);

router.patch('/:id', authMiddleware, moderadorMiddleware, atualizarPalavra);

router.delete('/:id', authMiddleware, moderadorMiddleware, removerPalavra);

module.exports = router;
