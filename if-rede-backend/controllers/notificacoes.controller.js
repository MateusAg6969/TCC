/**
 * ============================================================================
 * CONTROLLERS: NOTIFICACOES
 * ============================================================================
 * Controladores para gerenciar notificações dos usuários.
 */

const { Notificacao } = require('../models');

// ============================================================================
// GET: Listar notificações do usuário autenticado
// ============================================================================
// GET /api/notificacoes
// Query params: pagina (default 1), limite (default 20), filtro (all/nao-lidas)
exports.listarNotificacoes = async (req, res) => {
  try {
    const { pagina = 1, limite = 20, filtro = 'all' } = req.query;
    const usuario_id = req.usuario.id;

    // Validar paginação
    const pag = Math.max(1, parseInt(pagina));
    const lim = Math.min(100, Math.max(1, parseInt(limite)));

    let query = { usuario_id };

    // Aplicar filtro
    if (filtro === 'nao-lidas') {
      query.lida = false;
    }

    // Buscar notificações, total e não lidas em paralelo
    const [notificacoes, total, nao_lidas] = await Promise.all([
      Notificacao.find(query)
        .populate('ator_id', 'perfil.nome perfil.email')
        .sort({ criada_em: -1 })
        .limit(lim)
        .skip((pag - 1) * lim),
      Notificacao.countDocuments(query),
      Notificacao.countDocuments({ usuario_id, lida: false }),
    ]);

    return res.status(200).json({
      sucesso: true,
      dados: notificacoes,
      paginacao: {
        pagina: pag,
        limite: lim,
        total,
        paginas: Math.ceil(total / lim),
      },
      nao_lidas,
    });
  } catch (erro) {
    console.error('Erro ao listar notificações:', erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar notificações',
      erro: erro.message,
    });
  }
};

// ============================================================================
// GET: Contar notificações não lidas
// ============================================================================
// GET /api/notificacoes/nao-lidas/contador
exports.contarNaoLidas = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;

    const nao_lidas = await Notificacao.countDocuments({
      usuario_id,
      lida: false,
    });

    return res.status(200).json({
      sucesso: true,
      nao_lidas,
    });
  } catch (erro) {
    console.error('Erro ao contar notificações não lidas:', erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao contar notificações',
      erro: erro.message,
    });
  }
};

// ============================================================================
// PATCH: Marcar notificação como lida
// ============================================================================
// PATCH /api/notificacoes/:id/lida
exports.marcarComoLida = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.usuario.id;

    const notificacao = await Notificacao.findOne({
      _id: id,
      usuario_id,
    });

    if (!notificacao) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Notificação não encontrada',
      });
    }

    await notificacao.marcarComoLida();

    return res.status(200).json({
      sucesso: true,
      dados: notificacao,
      mensagem: 'Notificação marcada como lida',
    });
  } catch (erro) {
    console.error('Erro ao marcar notificação como lida:', erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao marcar notificação',
      erro: erro.message,
    });
  }
};

// ============================================================================
// PATCH: Marcar todas as notificações como lidas
// ============================================================================
// PATCH /api/notificacoes/marcar-tudo-lido
exports.marcarTudasComoLidas = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;

    const resultado = await Notificacao.updateMany(
      {
        usuario_id,
        lida: false,
      },
      {
        $set: {
          lida: true,
          data_leitura: new Date(),
        },
      }
    );

    return res.status(200).json({
      sucesso: true,
      modificadas: resultado.modifiedCount,
      mensagem: 'Todas as notificações foram marcadas como lidas',
    });
  } catch (erro) {
    console.error('Erro ao marcar todas as notificações:', erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao marcar notificações',
      erro: erro.message,
    });
  }
};

// ============================================================================
// DELETE: Deletar notificação
// ============================================================================
// DELETE /api/notificacoes/:id
exports.deletarNotificacao = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.usuario.id;

    const notificacao = await Notificacao.findOneAndDelete({
      _id: id,
      usuario_id,
    });

    if (!notificacao) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Notificação não encontrada',
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Notificação deletada com sucesso',
    });
  } catch (erro) {
    console.error('Erro ao deletar notificação:', erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao deletar notificação',
      erro: erro.message,
    });
  }
};

// ============================================================================
// DELETE: Deletar todas as notificações
// ============================================================================
// DELETE /api/notificacoes
exports.deletarTodasNotificacoes = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;

    const resultado = await Notificacao.deleteMany({
      usuario_id,
    });

    return res.status(200).json({
      sucesso: true,
      deletadas: resultado.deletedCount,
      mensagem: 'Todas as notificações foram deletadas',
    });
  } catch (erro) {
    console.error('Erro ao deletar todas as notificações:', erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao deletar notificações',
      erro: erro.message,
    });
  }
};

// ============================================================================
// UTILITÁRIO INTERNO: Criar notificação
// ============================================================================
// Função auxiliar para criar notificações quando eventos ocorrem
exports.criarNotificacao = async (dados) => {
  try {
    const notificacao = new Notificacao({
      usuario_id: dados.usuario_id,
      ator_id: dados.ator_id,
      tipo: dados.tipo,
      mensagem: dados.mensagem,
      objeto_id: dados.objeto_id || null,
      objeto_tipo: dados.objeto_tipo || null,
    });

    await notificacao.save();
    return notificacao;
  } catch (erro) {
    console.error('Erro ao criar notificação:', erro);
    throw erro;
  }
};
