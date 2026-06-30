const express = require('express');
const { ConfiguracaoSistema } = require('../models');

const router = express.Router();

router.get('/status', async (req, res, next) => {
  try {
    let config = await ConfiguracaoSistema.findOne();
    if (!config) {
      config = { modo_manutencao: false, changelog: '', changelog_date: null };
    }

    return res.success(
      {
        modo_manutencao: config.modo_manutencao,
        changelog: config.changelog,
        changelog_date: config.changelog_date,
      },
      'Status do sistema retornado com sucesso.'
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
