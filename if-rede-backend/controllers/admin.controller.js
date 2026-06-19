const { Usuario } = require('../models');

const adminController = {
  /**
   * Lista todos os usuários do sistema com paginação e pesquisa opcional
   */
  async listarUsuarios(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const search = req.query.search || '';

      let filter = {};
      if (search) {
        filter = {
          $or: [
            { 'perfil.nome': { $regex: search, $options: 'i' } },
            { 'perfil.email': { $regex: search, $options: 'i' } },
            { 'perfil.matricula': { $regex: search, $options: 'i' } }
          ]
        };
      }

      const total = await Usuario.countDocuments(filter);
      const usuarios = await Usuario.find(filter)
        .select('_id perfil.nome perfil.email perfil.status_vinculo configuracoes.mod_voluntario configuracoes.admin ativo suspenso_ate suspensao_motivo createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.success(
        usuarios,
        'Lista de usuários carregada com sucesso.',
        {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Altera os papéis (roles) de um usuário (Admin ou Moderador)
   */
  async alterarPapelUsuario(req, res, next) {
    try {
      const { id } = req.params;
      const { admin, mod_voluntario } = req.body;

      if (id === req.usuario.id) {
        return res.fail('Você não pode alterar seus próprios privilégios.', 403);
      }

      const usuario = await Usuario.findById(id);
      if (!usuario) {
        return res.fail('Usuário não encontrado.', 404);
      }

      if (typeof admin === 'boolean') {
        usuario.configuracoes.admin = admin;
      }
      
      if (typeof mod_voluntario === 'boolean') {
        usuario.configuracoes.mod_voluntario = mod_voluntario;
      }

      await usuario.save();

      return res.success(
        {
          id: usuario._id,
          admin: usuario.configuracoes.admin,
          mod_voluntario: usuario.configuracoes.mod_voluntario
        },
        'Papéis do usuário atualizados com sucesso.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Suspende o acesso de um usuário
   */
  async suspenderUsuario(req, res, next) {
    try {
      const { id } = req.params;
      const { dias, motivo } = req.body;

      if (!dias || dias <= 0) {
        return res.fail('A quantidade de dias deve ser maior que zero.', 400);
      }

      if (id === req.usuario.id) {
        return res.fail('Você não pode suspender a si mesmo.', 403);
      }

      const usuario = await Usuario.findById(id);
      if (!usuario) {
        return res.fail('Usuário não encontrado.', 404);
      }

      if (usuario.configuracoes.admin) {
        return res.fail('Não é possível suspender outro administrador. Remova seus privilégios primeiro.', 403);
      }

      const dataFim = new Date();
      dataFim.setDate(dataFim.getDate() + parseInt(dias));

      await usuario.suspender(dataFim, motivo || 'Violação das regras da plataforma.');

      return res.success(
        {
          id: usuario._id,
          suspenso_ate: usuario.suspenso_ate,
          suspensao_motivo: usuario.suspensao_motivo
        },
        `Usuário suspenso até ${dataFim.toLocaleDateString()}.`
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove a suspensão de um usuário
   */
  async removerSuspensaoUsuario(req, res, next) {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findById(id);
      if (!usuario) {
        return res.fail('Usuário não encontrado.', 404);
      }

      await usuario.removerSuspensao();

      return res.success(
        { id: usuario._id },
        'Suspensão removida com sucesso.'
      );
    } catch (error) {
      next(error);
    }
  }
};

module.exports = adminController;
