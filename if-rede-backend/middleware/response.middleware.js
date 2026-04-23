function responseMiddleware(req, res, next) {
  res.success = function (data = null, message = 'OK', meta = undefined, status = 200) {
    const payload = { ok: true, message, data };
    if (meta) payload.meta = meta;
    return res.status(status).json(payload);
  };

  res.fail = function (message = 'Erro na requisição.', status = 400, details = undefined) {
    const payload = {
      ok: false,
      error: {
        message,
      },
    };

    if (details !== undefined) {
      payload.error.details = details;
    }

    return res.status(status).json(payload);
  };

  return next();
}

module.exports = {
  responseMiddleware,
};
