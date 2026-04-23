const { validarAccessToken } = require('../services/token.service');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.fail('Token ausente ou inválido.', 401);
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = validarAccessToken(token);
    req.usuario = {
      id: payload.sub,
      email: payload.email,
      vinculo: payload.vinculo,
      mod_voluntario: payload.mod_voluntario,
    };
    return next();
  } catch (error) {
    return res.fail('Token expirado ou inválido.', 401);
  }
}

function moderadorMiddleware(req, res, next) {
  if (!req.usuario?.mod_voluntario) {
    return res.fail('Acesso permitido apenas para moderadores.', 403);
  }
  return next();
}

function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = validarAccessToken(token);
    req.usuario = {
      id: payload.sub,
      email: payload.email,
      vinculo: payload.vinculo,
      mod_voluntario: payload.mod_voluntario,
    };
  } catch (error) {
    // Ignora token inválido em rotas públicas
  }

  return next();
}

module.exports = {
  authMiddleware,
  moderadorMiddleware,
  optionalAuthMiddleware,
};
