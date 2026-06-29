/**
 * ============================================================================
 * UTILITÁRIO: DISPATCHER DE NOTIFICAÇÕES
 * ============================================================================
 * Funções auxiliares para criar notificações quando eventos ocorrem
 * (likes, comentários, novos seguidores, etc).
 */

const { Notificacao } = require('../models');
const socket = require('../socket');

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
    socket.emitirNotificacao(usuario_id, notificacao);
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
    socket.emitirNotificacao(usuario_id, notificacao);
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
    socket.emitirNotificacao(usuario_id, notificacao);
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
    socket.emitirNotificacao(usuario_id, notificacao);
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
    socket.emitirNotificacao(usuario_id, notificacao);
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
    socket.emitirNotificacao(usuario_id, notificacao);
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
    socket.emitirNotificacao(usuario_id, notificacao);
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
    socket.emitirNotificacao(dados.usuario_id, notificacao);
    return notificacao;
  } catch (erro) {
    console.error('Erro ao criar notificação customizada:', erro);
  }
};

// ============================================================================
// Notificação de Conteúdo Retido para Moderação (Palavras Ofensivas)
// ============================================================================
exports.notificarRetencaoModeracao = async (objetoId, objetoTipo, tituloOuTexto, atorId) => {
  try {
    const { Usuario } = require('../models');
    
    // Buscar todos os administradores e moderadores voluntários ativos
    const destinatarios = await Usuario.find({
      $or: [
        { 'configuracoes.admin': true },
        { 'configuracoes.mod_voluntario': true }
      ],
      ativo: true
    }).select('_id');

    if (destinatarios.length === 0) return;

    const textoTruncado = String(tituloOuTexto || '').substring(0, 30);
    const mensagem = `Conteúdo retido p/ moderação: "${textoTruncado}..."`;

    const notificacoes = [];
    for (const dest of destinatarios) {
      // Evitar que o próprio autor receba a notificação caso seja um admin/mod criando o post
      if (String(dest._id) === String(atorId)) continue;

      const notificacao = new Notificacao({
        usuario_id: dest._id,
        ator_id: atorId,
        tipo: 'tag', // Reutiliza tipo tag para renderização apropriada
        mensagem,
        objeto_id: objetoId,
        objeto_tipo: objetoTipo,
      });

      await notificacao.save();
      socket.emitirNotificacao(dest._id, notificacao);
      notificacoes.push(notificacao);
    }
    return notificacoes;
  } catch (erro) {
    console.error('Erro ao notificar retenção para moderação:', erro);
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

// ============================================================================
// Citações / Marcações (@username)
// ============================================================================

/**
 * Função utilitária para extrair citações no formato @username
 */
function extrairCitacoes(texto) {
  if (!texto) return [];
  const regex = /@([a-z0-9_.-]+)/gi;
  const matches = [...texto.matchAll(regex)];
  return [...new Set(matches.map(m => m[1].toLowerCase()))];
}

/**
 * Notificações de Citação na Bio
 */
exports.notificarCitacaoBio = async (usuario_id, ator_id) => {
  try {
    const notificacao = new Notificacao({
      usuario_id,
      ator_id,
      tipo: 'tag',
      mensagem: 'te marcou na bio',
      objeto_id: ator_id, // Aponta para o próprio ator da bio
      objeto_tipo: 'usuario',
    });

    await notificacao.save();
    socket.emitirNotificacao(usuario_id, notificacao);
    return notificacao;
  } catch (erro) {
    console.error('Erro ao criar notificação de citação na bio:', erro);
  }
};

/**
 * Processar citações em uma postagem e notificar os usuários citados
 */
exports.processarCitacoesPost = async (post, autorId, textoAnterior = '') => {
  try {
    const textoAtual = `${post.titulo || ''} ${post.descricao || ''} ${post.conteudo?.texto_longo || ''}`;
    const citacoesAtuais = extrairCitacoes(textoAtual);
    const citacoesAnteriores = extrairCitacoes(textoAnterior);

    // Filtra apenas as novas citações para evitar spam
    const novasCitacoes = citacoesAtuais.filter(username => !citacoesAnteriores.includes(username));
    if (novasCitacoes.length === 0) return;

    const { Usuario } = require('../models'); // Lazy load

    for (const username of novasCitacoes) {
      const usuarioCitado = await Usuario.findOne({ 
        'perfil.apelido': { $regex: new RegExp(`^${username}$`, 'i') } 
      });
      
      // Não notifica se o usuário citado não existir ou se for o próprio autor da postagem
      if (usuarioCitado && String(usuarioCitado._id) !== String(autorId)) {
        await exports.notificarTag(usuarioCitado._id, autorId, post._id);
      }
    }
  } catch (error) {
    console.error('Erro ao processar citações em postagem:', error);
  }
};

/**
 * Processar citações na bio do usuário e notificar os usuários citados
 */
exports.processarCitacoesBio = async (usuarioAtualizado, bioAnterior = '') => {
  try {
    const bioAtual = usuarioAtualizado.perfil?.bio || '';
    const citacoesAtuais = extrairCitacoes(bioAtual);
    const citacoesAnteriores = extrairCitacoes(bioAnterior);

    // Filtra apenas as novas citações para evitar spam
    const novasCitacoes = citacoesAtuais.filter(username => !citacoesAnteriores.includes(username));
    if (novasCitacoes.length === 0) return;

    const { Usuario } = require('../models'); // Lazy load

    for (const username of novasCitacoes) {
      const usuarioCitado = await Usuario.findOne({ 
        'perfil.apelido': { $regex: new RegExp(`^${username}$`, 'i') } 
      });
      
      // Não notifica se o usuário citado não existir ou se for o próprio usuário da bio
      if (usuarioCitado && String(usuarioCitado._id) !== String(usuarioAtualizado._id)) {
        await exports.notificarCitacaoBio(usuarioCitado._id, usuarioAtualizado._id);
      }
    }
  } catch (error) {
    console.error('Erro ao processar citações na bio:', error);
  }
};
