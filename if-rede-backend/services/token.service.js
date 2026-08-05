/**
 * ============================================================================
 * SERVIÇO: GERENCIAMENTO DE TOKENS JWT
 * ============================================================================
 * O que faz: Gera e valida os tokens de Acesso (short-lived) e Refresh (long-lived).
 * Suporte a Lembre de Mim: Ajusta a expiração dos tokens de acordo com a escolha
 * do usuário no login (permanecer conectado por 30 dias ou apenas na sessão atual).
 * ============================================================================
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'if-rede-dev-secret';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'if-rede-dev-refresh-secret';

/**
 * Gera o Access Token JWT para autenticação rápida nas rotas protegidas.
 * 
 * @param {Object} usuario Documento do usuário no Mongoose.
 * @param {boolean} [rememberMe=false] Se verdadeiro, estende o tempo de validade do token.
 * @returns {string} Token JWT assinado.
 */
function gerarAccessToken(usuario, rememberMe = false) {
  return jwt.sign(
    {
      sub: String(usuario._id),
      email: usuario.perfil.email,
      vinculo: usuario.perfil.status_vinculo,
      mod_voluntario: Boolean(usuario.configuracoes?.mod_voluntario),
      admin: Boolean(usuario.configuracoes?.admin),
    },
    JWT_SECRET,
    // Se "Lembre de mim" estiver ativo, dura 7 dias; caso contrário, 15 minutos padrão.
    { expiresIn: rememberMe ? '7d' : '15m' }
  );
}

/**
 * Gera o Refresh Token JWT para renovação do Access Token sem exigir re-login.
 * 
 * @param {Object} usuario Documento do usuário no Mongoose.
 * @param {boolean} [rememberMe=false] Se verdadeiro, o token dura 30 dias; se falso, 1 dia.
 * @returns {string} Refresh Token JWT assinado.
 */
function gerarRefreshToken(usuario, rememberMe = false) {
  return jwt.sign({ sub: String(usuario._id) }, JWT_REFRESH_SECRET, {
    // Se "Lembre de mim" estiver ativo, a sessão persiste por 30 dias; caso contrário 1 dia.
    expiresIn: rememberMe ? '30d' : '1d',
  });
}

/**
 * Valida a assinatura e expiração de um Access Token.
 * 
 * @param {string} token Access Token JWT.
 * @returns {Object} Payload decodificado do token.
 */
function validarAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Valida a assinatura e expiração de um Refresh Token.
 * 
 * @param {string} token Refresh Token JWT.
 * @returns {Object} Payload decodificado do token.
 */
function validarRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
  gerarAccessToken,
  gerarRefreshToken,
  validarAccessToken,
  validarRefreshToken,
};

