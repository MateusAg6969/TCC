const { validarAccessToken } = require('../services/token.service');
const { TokenBlacklist } = require('../models');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.fail('Token ausente ou inválido.', 401);
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = validarAccessToken(token);
    
    // Verifica se o token foi revogado manualmente no logout
    TokenBlacklist.findOne({ token }).then((tokenRevogado) => {
      if (tokenRevogado) {
        return res.fail('Token revogado. Faça login novamente.', 401);
      }
      
      req.usuario = {
        id: payload.sub,
        email: payload.email,
        vinculo: payload.vinculo,
        mod_voluntario: payload.mod_voluntario,
      };
      return next();
    }).catch(err => {
      return next(err);
    });
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
    
    TokenBlacklist.findOne({ token }).then((tokenRevogado) => {
      if (!tokenRevogado) {
        req.usuario = {
          id: payload.sub,
          email: payload.email,
          vinculo: payload.vinculo,
          mod_voluntario: payload.mod_voluntario,
        };
      }
      return next();
    }).catch(() => {
      return next();
    });
  } catch (error) {
    // Ignora token inválido em rotas públicas
    return next();
  }
}

module.exports = {
  authMiddleware,
  moderadorMiddleware,
  optionalAuthMiddleware,
};
