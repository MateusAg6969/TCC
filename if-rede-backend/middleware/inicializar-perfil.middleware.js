/**
 * ============================================================================
 * MIDDLEWARE: INICIALIZAR PERFIL
 * ============================================================================
 * Middleware que cria automaticamente os documentos de perfil
 * quando um novo usuário é criado.
 */

const { Privacidade, Preferencias, Conexoes, Badges, Auditoria } = require('../models');

/**
 * Inicializa documentos de perfil para novo usuário
 * @param {String} usuarioId - ID do usuário
 */
async function inicializarDocumentosPerfil(usuarioId) {
  try {
    // Criar privacidade
    await Privacidade.create({ usuario_id: usuarioId });

    // Criar preferências
    await Preferencias.create({ usuario_id: usuarioId });

    // Criar conexões
    await Conexoes.create({ usuario_id: usuarioId });

    // Criar badges
    await Badges.create({ usuario_id: usuarioId });

    console.log(`✅ Documentos de perfil inicializados para usuário ${usuarioId}`);
  } catch (erro) {
    console.error(`❌ Erro ao inicializar documentos de perfil: ${erro.message}`);
    // Não falhar a criação do usuário se houver erro aqui
  }
}

module.exports = { inicializarDocumentosPerfil };
