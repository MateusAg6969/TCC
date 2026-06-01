/**
 * ===========================================================================
 * CONTROLLER: auth.controller
 * ===========================================================================
 * Responsável pelos endpoints de autenticação: login, logout e registro.
 * Este arquivo implementa apenas o método `register`, que cria um novo usuário
 * utilizando o schema `Usuario`, gera o hash da senha via `auth.service` e
 * devolve um JWT.
 * ===========================================================================
 */

const { Usuario } = require('../models');
const authService = require('../services/auth.service');
const { validationResult } = require('express-validator'); // opcional, caso use validators

/**
 * Register a new user.
 * Expected body: { nome, email, matricula, senha }
 */
exports.register = async (req, res) => {
  // Caso você tenha middlewares de validação, capture os erros aqui
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nome, email, matricula, senha } = req.body;

  // Validação mínima (pode ser reforçada com express-validator)
  if (!nome || !email || !matricula || !senha) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  try {
    // Verifica duplicidade de e‑mail ou matrícula
    const existe = await Usuario.findOne({
      $or: [{ 'perfil.email': email }, { 'perfil.matricula': matricula }],
    });
    if (existe) {
      return res.status(409).json({ error: 'Email ou matrícula já em uso' });
    }

    // Hash da senha
    const senhaHash = await authService.hashPassword(senha);

    // Cria usuário
    const novoUsuario = await Usuario.create({
      senha: senhaHash,
      perfil: {
        nome,
        email,
        matricula,
        bio: '',
        status_vinculo: 'estudante',
        privacidade: 'publico',
      },
      // Valores padrão de customização e configuracoes (pode ser ajustado)
      customizacao: {
        cor_fundo: '#E8F4F8',
        cor_botoes: '#0066CC',
        medalhas: [],
      },
      configuracoes: {
        mod_voluntario: false,
        melhores_amigos: [],
        notificacoes: { likes: true, comentarios: true },
        egresso_limitado: false,
        permitir_mensagens: true,
      },
    });

    // Gera JWT contendo o ID do usuário
    const token = authService.generateToken({ id: novoUsuario._id });

    return res.status(201).json({ token, usuario: novoUsuario });
  } catch (err) {
    console.error('Erro no registro:', err);
    return res.status(500).json({ error: 'Erro interno ao registrar usuário' });
  }
};
