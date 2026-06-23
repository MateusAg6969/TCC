const express = require('express');
const bcrypt = require('bcryptjs');
const { Usuario, TokenBlacklist } = require('../models');
const {
  gerarAccessToken,
  gerarRefreshToken,
  validarRefreshToken,
} = require('../services/token.service');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { nome, apelido, email, senha, status_vinculo = 'estudante' } = req.body;

    if (!nome || !email || !senha) {
      return res.fail('Campos obrigatórios: nome, email e senha.', 400);
    }

    const senhaHash = await bcrypt.hash(String(senha), 10);

    const usuario = await Usuario.create({
      senha: senhaHash,
      email_confirmado: true, // Força a confirmação automática
      perfil: {
        nome,
        apelido: apelido || '',
        email,
        matricula: '',
        status_vinculo,
      },
    });

    const accessToken = gerarAccessToken(usuario);
    const refreshToken = gerarRefreshToken(usuario);

    return res.success(
      {
        usuario: {
          id: usuario._id,
          nome: usuario.perfil.nome,
          apelido: usuario.perfil.apelido,
          email: usuario.perfil.email,
          status_vinculo: usuario.perfil.status_vinculo,
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

    // 1. Validação de Entrada: Verifica se os campos básicos foram enviados.
    if (!email || !senha) {
      return res.fail('Informe email e senha.', 400);
    }

    // 2. Busca do Usuário: Localiza pelo email normalizado (lowercase).
    // O que faz: Utilizamos .select('+senha') pois o campo senha é oculto por padrão no schema.
    const usuario = await Usuario.findOne({ 'perfil.email': String(email).toLowerCase() }).select(
      '+senha'
    );

    // 3. Verificação de Existência: Se não encontrar, retorna erro genérico por segurança.
    if (!usuario) {
      console.warn(`Tentativa de login falhou: usuário ${email} não encontrado.`);
      return res.fail('Credenciais inválidas.', 401);
    }

    // 4. Validação de Senha: Compara o hash do banco com a senha enviada usando bcrypt.
    const senhaOk = await bcrypt.compare(String(senha), usuario.senha);

    if (!senhaOk) {
      console.warn(`Tentativa de login falhou: senha incorreta para ${email}.`);
      return res.fail('Credenciais inválidas.', 401);
    }

    // 5. Verificação de Status: Bloqueia acesso se a conta estiver inativa ou suspensa.
    if (!usuario.ativo || usuario.estaSuspenso()) {
      return res.fail('Conta inativa ou suspensa.', 403);
    }

    // Bloqueia acesso se o e-mail não estiver confirmado (desativado temporariamente)
    // if (usuario.email_confirmado === false) {
    //   return res.fail('Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.', 403);
    // }

    // 6. Geração de Tokens: Cria Access Token (curta duração) e Refresh Token (longa duração).
    // Fluxo: O Access Token carrega os claims (mod_voluntario, vinculo) para o middleware.
    const accessToken = gerarAccessToken(usuario);
    const refreshToken = gerarRefreshToken(usuario);

    // 7. Resposta de Sucesso: Retorna dados do perfil e tokens.
    // O que faz: Garante que mod_voluntario esteja presente para liberar a UI de moderação no front.
    return res.success(
      {
        usuario: {
          id: usuario._id,
          nome: usuario.perfil.nome,
          apelido: usuario.perfil.apelido,
          email: usuario.perfil.email,
          status_vinculo: usuario.perfil.status_vinculo,
          mod_voluntario: Boolean(usuario.configuracoes?.mod_voluntario),
        },
        tokens: { accessToken, refreshToken },
      },
      'Login realizado com sucesso.'
    );
  } catch (error) {
    // Log de erro para diagnóstico no servidor
    console.error('Erro crítico no processo de login:', error);
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
    
    // Verifica se o refreshToken foi revogado
    const tokenRevogado = await TokenBlacklist.findOne({ token: refreshToken });
    if (tokenRevogado) {
      return res.fail('Refresh token revogado. Faça login novamente.', 401);
    }

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

router.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const { refreshToken } = req.body;
    
    // Revoga o access token atual se ele for enviado
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.replace('Bearer ', '').trim();
      try {
        const decodedAccess = require('jsonwebtoken').decode(accessToken);
        if (decodedAccess && decodedAccess.exp) {
          const expDate = new Date(decodedAccess.exp * 1000);
          // Adiciona à blacklist usando updateOne com upsert para evitar erro de duplicidade se já existir
          await TokenBlacklist.updateOne(
            { token: accessToken },
            { $set: { expiraEm: expDate } },
            { upsert: true }
          );
        }
      } catch (e) {
        console.error('Erro ao revogar access token:', e);
      }
    }

    // Revoga o refresh token se ele for enviado
    if (refreshToken) {
      try {
        const decodedRefresh = require('jsonwebtoken').decode(refreshToken);
        if (decodedRefresh && decodedRefresh.exp) {
          const expDate = new Date(decodedRefresh.exp * 1000);
          await TokenBlacklist.updateOne(
            { token: refreshToken },
            { $set: { expiraEm: expDate } },
            { upsert: true }
          );
        }
      } catch (e) {
        console.error('Erro ao revogar refresh token:', e);
      }
    }

    return res.success(null, 'Logout realizado com sucesso.');
  } catch (error) {
    return next(error);
  }
});

router.get('/verify/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const usuario = await Usuario.findOne({ token_verificacao: token });

    if (!usuario) {
      return res.fail('Token de verificação inválido ou expirado.', 400);
    }

    usuario.email_confirmado = true;
    usuario.token_verificacao = null;
    await usuario.save();

    return res.success(null, 'E-mail confirmado com sucesso!');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
