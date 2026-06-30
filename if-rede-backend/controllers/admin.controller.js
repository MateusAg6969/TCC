const { Usuario, Postagem, Comentario, Seguidor, Notificacao, UsuarioMedalha, PortfolioItem } = require('../models');

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
  },

  /**
   * Exclui fisicamente um usuário e todos os seus dados e associações em cascata
   */
  async deletarUsuario(req, res, next) {
    try {
      const { id } = req.params;

      if (id === req.usuario.id) {
        return res.fail('Você não pode excluir sua própria conta por este painel.', 403);
      }

      const usuario = await Usuario.findById(id);
      if (!usuario) {
        return res.fail('Usuário não encontrado.', 404);
      }

      if (usuario.configuracoes.admin) {
        return res.fail('Não é possível excluir outro administrador. Remova seus privilégios primeiro.', 403);
      }

      // 1. Encontrar e deletar todas as postagens criadas por ele
      const postagens = await Postagem.find({ autor_id: id });
      const postagemIds = postagens.map(p => p._id);

      // Deletar comentários feitos nas postagens dele
      await Comentario.deleteMany({ postagem_id: { $in: postagemIds } });

      // Deletar as postagens dele
      await Postagem.deleteMany({ autor_id: id });

      // 2. Deletar comentários criados pelo próprio usuário em outras postagens
      await Comentario.deleteMany({ autor_id: id });

      // 3. Remover curtidas dele em outras postagens e comentários
      await Postagem.updateMany(
        { 'stats.usuarios_que_curtiram': id },
        { $pull: { 'stats.usuarios_que_curtiram': id }, $inc: { 'stats.likes': -1 } }
      );
      await Comentario.updateMany(
        { 'stats.usuarios_que_curtiram': id },
        { $pull: { 'stats.usuarios_que_curtiram': id }, $inc: { 'stats.likes': -1 } }
      );

      // 4. Deletar as relações de seguidor (tanto quem ele segue quanto quem o segue)
      await Seguidor.deleteMany({
        $or: [{ seguidor_id: id }, { seguido_id: id }]
      });

      // 5. Deletar notificações enviadas para ele ou geradas por ações dele
      await Notificacao.deleteMany({
        $or: [{ usuario_id: id }, { ator_id: id }]
      });

      // 6. Deletar conquistas de medalhas
      await UsuarioMedalha.deleteMany({ usuario_id: id });

      // 7. Deletar itens do portfólio
      await PortfolioItem.deleteMany({ usuario_id: id });

      // 8. Por fim, deletar o usuário
      await Usuario.deleteOne({ _id: id });

      return res.success(null, 'Usuário e todos os seus dados associados foram excluídos com sucesso.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtém as configurações globais do sistema (modo manutenção)
   */
  async obterConfiguracoesSistema(req, res, next) {
    try {
      const { ConfiguracaoSistema } = require('../models');
      let config = await ConfiguracaoSistema.findOne();
      if (!config) {
        config = await ConfiguracaoSistema.create({ modo_manutencao: false });
      }
      return res.success(config, 'Configurações do sistema carregadas com sucesso.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Atualiza as configurações globais do sistema
   */
  async atualizarConfiguracoesSistema(req, res, next) {
    try {
      const { modo_manutencao, changelog } = req.body;
      if (typeof modo_manutencao !== 'boolean') {
        return res.fail('O campo modo_manutencao é obrigatório e deve ser booleano.', 400);
      }

      const { ConfiguracaoSistema } = require('../models');
      let config = await ConfiguracaoSistema.findOne();
      if (!config) {
        config = new ConfiguracaoSistema();
      }

      config.modo_manutencao = modo_manutencao;
      
      // Se não for manutenção e tiver changelog, salva
      if (!modo_manutencao && changelog && changelog.trim().length > 0) {
        config.changelog = changelog.trim();
        config.changelog_date = new Date();
      }

      config.atualizado_por = req.usuario.id;
      await config.save();

      // Invalidar o cache do middleware imediatamente
      const { invalidarCacheManutencao } = require('../middleware/manutencao.middleware');
      invalidarCacheManutencao(modo_manutencao);

      return res.success(config, `Modo de manutenção ${modo_manutencao ? 'ativado' : 'desativado'} com sucesso.`);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = adminController;
