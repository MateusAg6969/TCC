/**
 * ============================================================================
 * UTILITÁRIO: DISPATCHER DE NOTIFICAÇÕES
 * ============================================================================
 * Funções auxiliares para criar notificações quando eventos ocorrem
 * (likes, comentários, novos seguidores, etc).
 */

const Notificacao = require('../schemas/notificacao.schema');

// ============================================================================
// Notificações de Like
// ============================================================================
exports.notificarLike = async (usuario_id, ator_id, postagem_id) => {
  try {
    const notificacao = new Notificacao({
      usuario_id,
      ator_id,
      tipo: 'like',
      mensagem: 'curtiu sua postagem',
      objeto_id: postagem_id,
      objeto_tipo: 'postagem',
    });

    await notificacao.save();
    return notificacao;
  } catch (erro) {
    console.error('Erro ao criar notificação de like:', erro);
  }
};

// ============================================================================
// Notificações de Like em Comentário
// ============================================================================
// O que faz: Notifica o autor de um comentário que alguém curtiu sua fala.
// Por que: Aumenta o engajamento na seção de comentários.
exports.notificarLikeComentario = async (usuario_id, ator_id, comentario_id) => {
  try {
    const notificacao = new Notificacao({
      usuario_id,
      ator_id,
      tipo: 'like', // Reutiliza tipo like
      mensagem: 'curtiu seu comentário',
      objeto_id: comentario_id,
      objeto_tipo: 'comentario',
    });

    await notificacao.save();
    return notificacao;
  } catch (erro) {
    console.error('Erro ao criar notificação de like no comentário:', erro);
  }
};

// ============================================================================
// Notificações de Comentário
// ============================================================================
exports.notificarComentario = async (usuario_id, ator_id, postagem_id, comentario_id) => {
  try {
    const notificacao = new Notificacao({
      usuario_id,
      ator_id,
      tipo: 'comentario',
      mensagem: 'comentou na sua postagem',
      objeto_id: comentario_id,
      objeto_tipo: 'comentario',
    });

    await notificacao.save();
    return notificacao;
  } catch (erro) {
    console.error('Erro ao criar notificação de comentário:', erro);
  }
};

// ============================================================================
// Notificações de Novo Seguidor
// ============================================================================
exports.notificarNovoSeguidor = async (usuario_id, ator_id) => {
  try {
    const notificacao = new Notificacao({
      usuario_id,
      ator_id,
      tipo: 'seguidor',
      mensagem: 'começou a te seguir',
      objeto_id: ator_id,
      objeto_tipo: 'usuario',
    });

    await notificacao.save();
    return notificacao;
  } catch (erro) {
    console.error('Erro ao criar notificação de seguidor:', erro);
  }
};

// ============================================================================
// Notificações de Repost
// ============================================================================
exports.notificarRepost = async (usuario_id, ator_id, postagem_id) => {
  try {
    const notificacao = new Notificacao({
      usuario_id,
      ator_id,
      tipo: 'repost',
      mensagem: 'compartilhou sua postagem',
      objeto_id: postagem_id,
      objeto_tipo: 'postagem',
    });

    await notificacao.save();
    return notificacao;
  } catch (erro) {
    console.error('Erro ao criar notificação de repost:', erro);
  }
};

// ============================================================================
// Notificações de Tag
// ============================================================================
exports.notificarTag = async (usuario_id, ator_id, postagem_id) => {
  try {
    const notificacao = new Notificacao({
      usuario_id,
      ator_id,
      tipo: 'tag',
      mensagem: 'te marcou em uma postagem',
      objeto_id: postagem_id,
      objeto_tipo: 'postagem',
    });

    await notificacao.save();
    return notificacao;
  } catch (erro) {
    console.error('Erro ao criar notificação de tag:', erro);
  }
};

// ============================================================================
// Notificações de Resposta em Comentário
// ============================================================================
exports.notificarRespostaComentario = async (usuario_id, ator_id, comentario_id) => {
  try {
    const notificacao = new Notificacao({
      usuario_id,
      ator_id,
      tipo: 'resposta',
      mensagem: 'respondeu seu comentário',
      objeto_id: comentario_id,
      objeto_tipo: 'comentario',
    });

    await notificacao.save();
    return notificacao;
  } catch (erro) {
    console.error('Erro ao criar notificação de resposta:', erro);
  }
};

// ============================================================================
// Notificações genéricas
// ============================================================================
exports.criarNotificacaoCustomizada = async (dados) => {
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
    console.error('Erro ao criar notificação customizada:', erro);
  }
};

// ============================================================================
// Remover notificações antigas
// ============================================================================
// Esta função é opcional se você quiser ter mais controle
// O TTL Index do schema já faz isso automaticamente
exports.limparNotificacoesAntigas = async (diasRetencao = 30) => {
  try {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasRetencao);

    const resultado = await Notificacao.deleteMany({
      criada_em: { $lt: dataLimite },
    });

    console.log(`${resultado.deletedCount} notificações antigas removidas`);
    return resultado;
  } catch (erro) {
    console.error('Erro ao limpar notificações antigas:', erro);
  }
};
