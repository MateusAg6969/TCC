const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'if-rede-dev-secret';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'if-rede-dev-refresh-secret';

function gerarAccessToken(usuario) {
  return jwt.sign(
    {
      sub: String(usuario._id),
      email: usuario.perfil.email,
      vinculo: usuario.perfil.status_vinculo,
      mod_voluntario: Boolean(usuario.configuracoes?.mod_voluntario),
      admin: Boolean(usuario.configuracoes?.admin),
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function gerarRefreshToken(usuario) {
  return jwt.sign({ sub: String(usuario._id) }, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
}

function validarAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function validarRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
  gerarAccessToken,
  gerarRefreshToken,
  validarAccessToken,
  validarRefreshToken,
};
