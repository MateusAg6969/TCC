const express = require('express');
const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');
const {
  gerarAccessToken,
  gerarRefreshToken,
  validarRefreshToken,
} = require('../services/token.service');
const { inicializarDocumentosPerfil } = require('../middleware/inicializar-perfil.middleware');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { nome, email, matricula, senha, status_vinculo = 'estudante' } = req.body;

    if (!nome || !email || !matricula || !senha) {
      return res.fail('Campos obrigatórios: nome, email, matricula e senha.', 400);
    }

    const senhaHash = await bcrypt.hash(String(senha), 10);

    const usuario = await Usuario.create({
      senha: senhaHash,
      perfil: {
        nome,
        email,
        matricula,
        status_vinculo,
      },
    });

    // Inicializar documentos de perfil
    await inicializarDocumentosPerfil(usuario._id);

    const accessToken = gerarAccessToken(usuario);
    const refreshToken = gerarRefreshToken(usuario);

    return res.success(
      {
        usuario: {
          id: usuario._id,
          nome: usuario.perfil.nome,
          email: usuario.perfil.email,
          status_vinculo: usuario.perfil.status_vinculo,
          // Incluimos este campo no payload para que o frontend saiba
          // imediatamente se deve liberar funcionalidades de moderacao.
          // Entrada: configuracao persistida no documento do usuario.
          // Saida: boolean simples no objeto de sessao.
          mod_voluntario: usuario.configuracoes?.mod_voluntario || false,
        },
        tokens: { accessToken, refreshToken },
      },
      'Usuário criado com sucesso.',
      undefined,
      201
    );
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.fail('Informe email e senha.', 400);
    }

    const usuario = await Usuario.findOne({ 'perfil.email': String(email).toLowerCase() }).select(
      '+senha'
    );

    if (!usuario) {
      return res.fail('Credenciais inválidas.', 401);
    }

    const senhaOk = await bcrypt.compare(String(senha), usuario.senha);

    if (!senhaOk) {
      return res.fail('Credenciais inválidas.', 401);
    }

    if (!usuario.ativo || usuario.estaSuspenso()) {
      return res.fail('Conta inativa ou suspensa.', 403);
    }

    const accessToken = gerarAccessToken(usuario);
    const refreshToken = gerarRefreshToken(usuario);

    return res.success(
      {
        usuario: {
          id: usuario._id,
          nome: usuario.perfil.nome,
          email: usuario.perfil.email,
          status_vinculo: usuario.perfil.status_vinculo,
          mod_voluntario: usuario.configuracoes.mod_voluntario,
        },
        tokens: { accessToken, refreshToken },
      },
      'Login realizado com sucesso.'
    );
  } catch (error) {
    return next(error);
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.fail('Refresh token é obrigatório.', 400);
  }

  try {
    const payload = validarRefreshToken(refreshToken);
    const usuario = await Usuario.findById(payload.sub);

    if (!usuario || !usuario.ativo || usuario.estaSuspenso()) {
      return res.fail('Usuário inválido para refresh.', 401);
    }

    const newAccessToken = gerarAccessToken(usuario);
    const newRefreshToken = gerarRefreshToken(usuario);

    return res.success(
      { tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken } },
      'Token renovado com sucesso.'
    );
  } catch (error) {
    return res.fail('Refresh token inválido.', 401);
  }
});

router.post('/logout', async (req, res) => {
  return res.success(null, 'Logout realizado com sucesso.');
});

module.exports = router;
