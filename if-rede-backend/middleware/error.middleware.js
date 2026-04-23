function notFoundMiddleware(req, res) {
  return res.fail('Rota não encontrada.', 404);
}

function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error?.name === 'ValidationError') {
    const detalhes = Object.values(error.errors).map((e) => e.message);
    return res.fail('Erro de validação.', 400, detalhes);
  }

  if (error?.code === 11000) {
    return res.fail('Registro duplicado.', 409, error.keyValue);
  }

  const status = error.status || 500;
  return res.fail(error.message || 'Erro interno do servidor.', status);
}

module.exports = {
  notFoundMiddleware,
  errorMiddleware,
};
