/**
 * ===========================================================================
 * SERVICE: auth.service
 * ===========================================================================
 * Funções auxiliares de autenticação usadas pelos controladores.
 * - hashPassword: gera hash bcrypt da senha em texto‑plano.
 * - comparePassword: compara texto‑plano com hash armazenado.
 * - generateToken: cria JWT contendo o ID do usuário.
 * - verifyToken: valida JWT e devolve o payload.
 * ===========================================================================
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configurações lidas do .env (ou valores padrão)
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

module.exports = {
  /**
   * Gera um hash bcrypt a partir da senha em texto‑plano.
   * @param {string} plainPassword
   * @returns {Promise<string>} hash da senha
   */
  hashPassword: async (plainPassword) => {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
  },

  /**
   * Compara senha em texto‑plano com hash armazenado.
   * @param {string} plainPassword
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  comparePassword: async (plainPassword, hash) => {
    return await bcrypt.compare(plainPassword, hash);
  },

  /**
   * Cria um JWT contendo o ID do usuário.
   * @param {{ id: string }} payload Dados que serão codificados no token
   * @returns {string} token JWT
   */
  generateToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  /**
   * Verifica um JWT e devolve o payload decodificado.
   * @param {string} token
   * @returns {{ id: string }} payload decodificado
   * @throws se o token for inválido ou expirado
   */
  verifyToken: (token) => {
    return jwt.verify(token, JWT_SECRET);
  },
};
