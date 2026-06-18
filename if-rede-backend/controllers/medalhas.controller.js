const { Medalha, UsuarioMedalha, Usuario } = require('../models');

/**
 * Controller para gestão de Medalhas e Gamificação
 */
const medalhasController = {
  /**
   * Atribui uma medalha a um usuário
   * Rota: POST /usuarios/:userId/medalhas/:badgeId
   */
  async atribuir(req, res, next) {
    try {
      const { userId, badgeId } = req.params;

      // Verificar se usuário existe
      const usuario = await Usuario.findById(userId);
      if (!usuario) {
        return res.fail('Usuário não encontrado.', 404);
      }

      // Verificar se medalha existe
      const medalha = await Medalha.findById(badgeId);
      if (!medalha) {
        return res.fail('Medalha não encontrada.', 404);
      }

      // Verificar duplicidade
      const jaPossui = await UsuarioMedalha.findOne({
        usuario_id: userId,
        medalha_id: badgeId
      });

      if (jaPossui) {
        return res.fail('O usuário já conquistou esta medalha.', 409);
      }

      const conquista = await UsuarioMedalha.create({
        usuario_id: userId,
        medalha_id: badgeId
      });

      return res.success(conquista, 'Medalha atribuída com sucesso!', undefined, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Lista todas as medalhas disponíveis no sistema
   */
  async listarTodas(req, res, next) {
    try {
      const medalhas = await Medalha.find().sort({ nome: 1 });
      return res.success(medalhas, 'Lista de medalhas carregada.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Lista medalhas de um usuário específico
   */
  async listarPorUsuario(req, res, next) {
    try {
      const { userId } = req.params;
      
      const conquistas = await UsuarioMedalha.find({ usuario_id: userId })
        .populate('medalha_id')
        .sort({ awarded_at: -1 });

      return res.success(
        conquistas.map(c => ({
          ...c.medalha_id.toObject(),
          awarded_at: c.awarded_at
        })),
        'Medalhas do usuário carregadas.'
      );
    } catch (error) {
      next(error);
    }
  }
};

module.exports = medalhasController;
