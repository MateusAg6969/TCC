/**
 * ============================================================================
 * CONEXÃO COM MONGODB
 * ============================================================================
 * Arquivo que gerencia a conexão com o banco de dados MongoDB.
 * Também cria índices TTL e outras configurações importantes.
 * 
 * USO:
 * const db = require('./db/connection');
 * await db.conectar();
 */

const mongoose = require('mongoose');
const { Postagem } = require('../models');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

// URL de conexão (use variável de ambiente em produção)
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/if-rede';

// Opções de conexão recomendadas
const opcoes_conexao = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// ============================================================================
// FUNÇÃO PRINCIPAL: CONECTAR AO BANCO
// ============================================================================

/**
 * Conecta ao MongoDB e configura índices
 * @returns {Promise<void>}
 */
async function conectar() {
  try {
    console.log('▶ Conectando ao MongoDB...');
    console.log(`   URI: ${MONGODB_URI}`);

    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI, opcoes_conexao);

    console.log('✓ Conectado ao MongoDB com sucesso!');

    // Criar índices
    await criar_indices();

    // Listar informações da conexão
    const admin = mongoose.connection.db.admin();
    const stats = await admin.serverStatus();
    console.log(`✓ Servidor MongoDB versão: ${stats.version}`);

    return true;
  } catch (erro) {
    console.error('✗ Erro ao conectar ao MongoDB:');
    console.error(`  ${erro.message}`);
    process.exit(1);
  }
}

// ============================================================================
// FUNÇÃO: CRIAR ÍNDICES
// ============================================================================

/**
 * Cria todos os índices necessários para o sistema
 * Chamada automaticamente durante a conexão
 * @returns {Promise<void>}
 */
async function criar_indices() {
  try {
    console.log('▶ Criando índices...');

    // ========================================================================
    // ÍNDICE TTL PARA RASCUNHOS - CRÍTICO PARA FUNCIONALIDADE
    // ========================================================================
    // Este índice apaga automaticamente postagens que:
    // - São rascunhos (config.eh_rascunho: true)
    // - Têm uma data de expiração (excluir_em) atingida
    //
    // O MongoDB cria uma thread em background que verifica este índice
    // a cada 60 segundos e deleta documentos quando a data é atingida.
    //
    // IMPORTANTE:
    // - A verificação não é em tempo real (espera até 60 segundos)
    // - O TTL não é garantido se o servidor estiver sobrecarregado
    // - Use partialFilterExpression para aplicar apenas a rascunhos
    // ========================================================================

    try {
      await Postagem.collection.createIndex(
        { excluir_em: 1 }, // Campo de data
        {
          name: 'ttl_rascunhos_14_dias',
          expireAfterSeconds: 0, // Deleta imediatamente quando a data é atingida
          partialFilterExpression: {
            // Aplica apenas a postagens que são rascunhos
            'config.eh_rascunho': true,
          },
        }
      );
      console.log(
        '  ✓ Índice TTL para rascunhos criado (14 dias de expiração)'
      );
    } catch (e) {
      if (e.code === 85) {
        // Índice já existe com configuração diferente
        console.log('  ℹ Índice TTL já existe, pulando...');
      } else {
        throw e;
      }
    }

    // ========================================================================
    // OUTROS ÍNDICES JÁ DEFINIDOS NOS SCHEMAS
    // ========================================================================
    // Os schemas já definem outros índices via .index()
    // Mongoose cria automaticamente quando conecta
    // Se quiser criar explicitamente:
    // ========================================================================

    console.log(
      '  ✓ Índices criados/verificados (schemas já definem os demais)'
    );
  } catch (erro) {
    console.error('✗ Erro ao criar índices:');
    console.error(`  ${erro.message}`);
  }
}

// ============================================================================
// FUNÇÃO: DESCONECTAR
// ============================================================================

/**
 * Desconecta do MongoDB graciosamente
 * @returns {Promise<void>}
 */
async function desconectar() {
  try {
    console.log('▶ Desconectando do MongoDB...');
    await mongoose.disconnect();
    console.log('✓ Desconectado com sucesso!');
  } catch (erro) {
    console.error('✗ Erro ao desconectar:');
    console.error(`  ${erro.message}`);
    process.exit(1);
  }
}

// ============================================================================
// FUNÇÃO: LIMPAR BANCO DE DADOS (desenvolvimento/testes)
// ============================================================================

/**
 * Remove todas as coleções do banco de dados
 * ⚠️ CUIDADO: Isso deleta tudo! Use apenas em desenvolvimento/testes
 * @returns {Promise<void>}
 */
async function limpar_banco() {
  try {
    console.log('▶ Limpando banco de dados...');

    // Verificação de segurança
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Não é permitido limpar o banco em produção!');
    }

    const colecoes = mongoose.connection.collections;
    for (const key in colecoes) {
      const collection = colecoes[key];
      await collection.deleteMany({});
      console.log(`  ✓ Coleção '${key}' limpa`);
    }

    console.log('✓ Banco de dados limpo!');
  } catch (erro) {
    console.error('✗ Erro ao limpar banco:');
    console.error(`  ${erro.message}`);
  }
}

// ============================================================================
// LISTENERS DE EVENTOS
// ============================================================================

// Evento: Conexão aberta
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose conectado ao MongoDB');
});

// Evento: Desconexão
mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado do MongoDB');
});

// Evento: Erro de conexão
mongoose.connection.on('error', (erro) => {
  console.error('❌ Erro de conexão Mongoose:');
  console.error(`   ${erro.message}`);
});

// Evento: Reconexão
mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose reconectado ao MongoDB');
});

// ============================================================================
// TRATAMENTO DE SINAIS (GRACEFUL SHUTDOWN)
// ============================================================================

// Desconectar quando a aplicação é encerrada (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('\n▶ Encerrando aplicação...');
  await desconectar();
  process.exit(0);
});

// ============================================================================
// EXPORTAR FUNÇÕES
// ============================================================================

module.exports = {
  conectar,
  desconectar,
  limpar_banco,
  MONGODB_URI,
};
