/**
 * Middleware para tratamento de rotas não encontradas (404).
 * O que faz: Captura requisições para rotas inexistentes.
 * Tratamento defensivo: Garante que res.fail existe antes de invocar, utilizando res.status().json() como fallback.
 */
function notFoundMiddleware(req, res) {
  if (typeof res.fail === 'function') {
    return res.fail('Rota não encontrada.', 404);
  }
  return res.status(404).json({ ok: false, error: { message: 'Rota não encontrada.' } });
}

/**
 * Middleware global de tratamento de erros.
 * O que faz: Captura erros disparados nas rotas/middlewares e formata a resposta.
 * Tratamento defensivo: Verifica se res.fail é uma função para evitar TypeError.
 */
function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  // Função utilitária para envio defensivo da resposta de erro
  const sendError = (msg, status = 500, details = undefined) => {
    if (typeof res.fail === 'function') {
      return res.fail(msg, status, details);
    }
    const payload = { ok: false, error: { message: msg } };
    if (details !== undefined) payload.error.details = details;
    return res.status(status).json(payload);
  };

  if (error?.name === 'ValidationError') {
    const detalhes = Object.values(error.errors).map((e) => e.message);
    return sendError('Erro de validação.', 400, detalhes);
  }

  if (error?.code === 11000) {
    return sendError('Registro duplicado.', 409, error.keyValue);
  }

  const status = error.status || 500;
  return sendError(error.message || 'Erro interno do servidor.', status);
}

module.exports = {
  notFoundMiddleware,
  errorMiddleware,
};
