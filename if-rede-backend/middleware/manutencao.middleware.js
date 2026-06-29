const { ConfiguracaoSistema } = require('../models');

let cacheModoManutencao = {
  ativo: false,
  ultimaVerificacao: 0
};

// Middleware para verificar modo de manutenção de forma global e interceptar usuários comuns
exports.verificarManutencao = async (req, res, next) => {
  try {
    const path = req.path;

    // Liberar rotas essenciais para que o administrador possa fazer login e desativar o modo de manutenção
    if (
      path.startsWith('/auth/login') ||
      path.startsWith('/auth/refresh') ||
      path.startsWith('/auth/logout') ||
      path.startsWith('/admin/configuracoes-sistema')
    ) {
      return next();
    }

    // Usar cache de 5 segundos para diminuir o overhead de queries no MongoDB
    const agora = Date.now();
    if (agora - cacheModoManutencao.ultimaVerificacao > 5000) {
      let config = await ConfiguracaoSistema.findOne();
      if (!config) {
        config = await ConfiguracaoSistema.create({ modo_manutencao: false });
      }
      cacheModoManutencao.ativo = config.modo_manutencao;
      cacheModoManutencao.ultimaVerificacao = agora;
    }

    // Se o modo de manutenção estiver ligado
    if (cacheModoManutencao.ativo) {
      // Verificar se há token e se o usuário é admin ou moderador voluntário
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
          
          // Libera acesso se for administrador ou moderador
          if (decoded && (decoded.admin === true || decoded.mod_voluntario === true)) {
            return next();
          }
        } catch (e) {
          // Token inválido/expirado, segue adiante para o fluxo normal de erro nas rotas protegidas
        }
      }

      // Bloquear com status 503 Service Unavailable
      return res.status(503).json({
        ok: false,
        error: {
          code: 'MAINTENANCE_MODE',
          message: 'O sistema está em manutenção para a implementação de novas funções e melhorias. Por favor, tente novamente mais tarde.'
        }
      });
    }

    next();
  } catch (error) {
    console.error('Erro no middleware de manutenção:', error);
    next();
  }
};

// Invalida o cache do middleware para atualizar o status instantaneamente
exports.invalidarCacheManutencao = (novoStatus) => {
  cacheModoManutencao.ativo = novoStatus;
  cacheModoManutencao.ultimaVerificacao = Date.now();
};
