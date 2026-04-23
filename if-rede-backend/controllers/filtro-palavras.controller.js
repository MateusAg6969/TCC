const { PalavraFiltro } = require('../models');
const { invalidarCachePalavras } = require('../services/palavras-filtro.service');

async function listarPalavras(req, res, next) {
  try {
    const termos = await PalavraFiltro.find().sort({ createdAt: -1 }).lean();
    return res.success(termos, 'Lista de palavras carregada com sucesso.', {
      total: termos.length,
    });
  } catch (error) {
    return next(error);
  }
}

async function criarPalavra(req, res, next) {
  try {
    const { termo, severidade = 'media', ativo = true } = req.body;

    if (!termo) {
      return res.fail('Campo obrigatorio: termo.', 400);
    }

    const novo = await PalavraFiltro.create({
      termo,
      severidade,
      ativo,
      criado_por: req.usuario.id,
    });

    invalidarCachePalavras();

    return res.success(novo, 'Palavra adicionada ao filtro.', undefined, 201);
  } catch (error) {
    if (error?.code === 11000) {
      return res.fail('Este termo ja esta cadastrado no filtro.', 409);
    }
    return next(error);
  }
}

async function atualizarPalavra(req, res, next) {
  try {
    const atualizacao = {};

    if (req.body.ativo !== undefined) {
      atualizacao.ativo = Boolean(req.body.ativo);
    }

    if (req.body.severidade !== undefined) {
      atualizacao.severidade = req.body.severidade;
    }

    const atualizado = await PalavraFiltro.findByIdAndUpdate(req.params.id, atualizacao, {
      new: true,
      runValidators: true,
    });

    if (!atualizado) {
      return res.fail('Termo nao encontrado.', 404);
    }

    invalidarCachePalavras();

    return res.success(atualizado, 'Palavra atualizada com sucesso.');
  } catch (error) {
    return next(error);
  }
}

async function removerPalavra(req, res, next) {
  try {
    const removido = await PalavraFiltro.findByIdAndDelete(req.params.id);

    if (!removido) {
      return res.fail('Termo nao encontrado.', 404);
    }

    invalidarCachePalavras();

    return res.success(null, 'Palavra removida do filtro.');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listarPalavras,
  criarPalavra,
  atualizarPalavra,
  removerPalavra,
};
