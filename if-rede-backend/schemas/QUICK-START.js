/**
 * ============================================================================
 * QUICK START: INICIALIZAR SCHEMAS EM SEU PROJETO
 * ============================================================================
 * 
 * PASSO 1: Copiar arquivos de schema
 * - usuario-otimizado.schema.js → /schemas/
 * - amizade.schema.js → /schemas/
 * 
 * PASSO 2: Copiar arquivo de integração
 * - INTEGRACAO-USUARIO-AMIZADE.js → /services/
 * 
 * PASSO 3: Rodar este script para inicializar modelos
 * 
 * PASSO 4: Usar nos controllers (ver EXEMPLOS-USO.js)
 * 
 * ============================================================================
 */

const mongoose = require('mongoose');

// ============================================================================
// 1. CONECTAR AO MONGODB
// ============================================================================

async function conectar() {
  try {
    const connectionString =
      process.env.MONGO_URI || 'mongodb://localhost:27017/ifrede';

    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Conectado ao MongoDB');
    return true;
  } catch (erro) {
    console.error('✗ Erro ao conectar:', erro.message);
    process.exit(1);
  }
}

// ============================================================================
// 2. CARREGAR SCHEMAS
// ============================================================================

async function carregarSchemas() {
  try {
    const usuarioSchema = require('./usuario-otimizado.schema');
    const amizadeSchema = require('./amizade.schema');

    // Criar modelos
    global.Usuario = mongoose.model('Usuario', usuarioSchema);
    global.Amizade = mongoose.model('Amizade', amizadeSchema);

    console.log('✓ Schemas carregados');
    return { Usuario: global.Usuario, Amizade: global.Amizade };
  } catch (erro) {
    console.error('✗ Erro ao carregar schemas:', erro.message);
    throw erro;
  }
}

// ============================================================================
// 3. CRIAR ÍNDICES
// ============================================================================

async function criarIndices() {
  try {
    console.log('Criando índices...');

    // Índices em usuarios
    await global.Usuario.collection.createIndex(
      { 'perfil.email': 1 },
      { unique: true, sparse: true }
    );
    console.log('  ✓ Index unique: perfil.email');

    await global.Usuario.collection.createIndex(
      { 'perfil.matricula': 1 },
      { unique: true, sparse: true }
    );
    console.log('  ✓ Index unique: perfil.matricula');

    await global.Usuario.collection.createIndex({
      'perfil.nome': 'text',
      'perfil.bio': 'text',
    });
    console.log('  ✓ Index text: perfil.nome, perfil.bio');

    await global.Usuario.collection.createIndex({
      ativo: 1,
      'perfil.status_vinculo': 1,
    });
    console.log('  ✓ Index composto: ativo, status_vinculo');

    await global.Usuario.collection.createIndex(
      { 'stats.total_seguidores': -1, createdAt: -1 },
      { name: 'idx_stats_ranking' }
    );
    console.log('  ✓ Index composto: stats.total_seguidores, createdAt');

    await global.Usuario.collection.createIndex({ ultima_atividade: -1 });
    console.log('  ✓ Index: ultima_atividade');

    await global.Usuario.collection.createIndex(
      { papel: 1, ativo: 1 },
      { name: 'idx_papel_ativo' }
    );
    console.log('  ✓ Index composto: papel, ativo');

    await global.Usuario.collection.createIndex(
      { updatedAt: 1 },
      {
        expireAfterSeconds: 31536000, // 1 ano
        partialFilterExpression: { ativo: false },
      }
    );
    console.log('  ✓ Index TTL: updatedAt (soft delete)');

    // Índices em amizades
    await global.Amizade.collection.createIndex(
      { usuarioId: 1, amigoId: 1, status: 1 },
      { unique: true, sparse: true }
    );
    console.log('  ✓ Index unique: usuarioId, amigoId, status');

    await global.Amizade.collection.createIndex({
      usuarioId: 1,
      status: 1,
      dataSolicitacao: -1,
    });
    console.log('  ✓ Index composto: usuarioId, status, dataSolicitacao');

    await global.Amizade.collection.createIndex({
      amigoId: 1,
      status: 1,
      dataSolicitacao: -1,
    });
    console.log('  ✓ Index composto: amigoId, status, dataSolicitacao');

    await global.Amizade.collection.createIndex(
      { dataSolicitacao: 1 },
      {
        expireAfterSeconds: 7776000, // 90 dias
        partialFilterExpression: { status: 'recusado' },
      }
    );
    console.log('  ✓ Index TTL: dataSolicitacao (recusas)');

    console.log('✓ Todos os índices criados com sucesso');
    return true;
  } catch (erro) {
    console.error('✗ Erro ao criar índices:', erro.message);
    throw erro;
  }
}

// ============================================================================
// 4. VERIFICAR INTEGRIDADE DO BD
// ============================================================================

async function verificarIntegridade() {
  try {
    console.log('Verificando integridade...');

    // Verificar auto-amizades
    const autoAmizades = await global.Amizade.countDocuments({
      $where: 'this.usuarioId === this.amigoId',
    });

    if (autoAmizades > 0) {
      console.warn(`  ⚠ Encontradas ${autoAmizades} auto-amizades!`);
    } else {
      console.log('  ✓ Sem auto-amizades');
    }

    // Verificar referências órfãs
    const amizadesOrfas = await global.Amizade.aggregate([
      {
        $lookup: {
          from: 'usuarios',
          localField: 'usuarioId',
          foreignField: '_id',
          as: 'usuario',
        },
      },
      {
        $match: { usuario: { $size: 0 } },
      },
      { $count: 'total' },
    ]);

    if (amizadesOrfas.length > 0) {
      console.warn(
        `  ⚠ Encontradas ${amizadesOrfas[0].total} amizades com referência órfã`
      );
    } else {
      console.log('  ✓ Sem referências órfãs');
    }

    // Verificar stats
    const usuariosComStatsAltos = await global.Usuario.countDocuments({
      'stats.total_amigos': { $gt: 1000 },
    });

    console.log(`  ✓ ${usuariosComStatsAltos} usuários com stats > 1000`);

    return true;
  } catch (erro) {
    console.error('✗ Erro ao verificar integridade:', erro.message);
    throw erro;
  }
}

// ============================================================================
// 5. EXECUTAR TUDO
// ============================================================================

async function inicializar() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  INICIALIZAÇÃO: USUARIO + AMIZADE SCHEMAS         ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  try {
    // Conectar
    await conectar();

    // Carregar schemas
    await carregarSchemas();

    // Criar índices
    await criarIndices();

    // Verificar integridade
    await verificarIntegridade();

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║  ✓ INICIALIZAÇÃO COMPLETA COM SUCESSO!           ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log('PRÓXIMOS PASSOS:');
    console.log('1. Importar em controllers/services:');
    console.log('   const { Usuario, Amizade } = require("./schemas");');
    console.log('');
    console.log('2. Ver exemplos em EXEMPLOS-USO.js');
    console.log('');
    console.log('3. Consultar documentação:');
    console.log('   - RESUMO-EXECUTIVO.js (decisões de design)');
    console.log('   - INDICE-PERFORMANCE-GUIDE.js (performance)');
    console.log('   - INTEGRACAO-USUARIO-AMIZADE.js (integração)');
    console.log('');

    return true;
  } catch (erro) {
    console.error('✗ ERRO FATAL:', erro.message);
    process.exit(1);
  }
}

// ============================================================================
// 6. EXPORTAR PARA SCRIPT OU IMPORTAÇÃO
// ============================================================================

module.exports = {
  conectar,
  carregarSchemas,
  criarIndices,
  verificarIntegridade,
  inicializar,
};

// ============================================================================
// 7. EXECUTAR SE FOR SCRIPT DIRETO
// ============================================================================

if (require.main === module) {
  inicializar().then(() => {
    console.log('Encerrando...\n');
    process.exit(0);
  });
}

/*
 * ============================================================================
 * COMO USAR ESTE SCRIPT:
 * ============================================================================
 * 
 * OPÇÃO 1: Como script de linha de comando
 * $ node QUICK-START.js
 * 
 * OPÇÃO 2: Como importação em seu server.js
 * 
 * const { inicializar } = require('./schemas/QUICK-START.js');
 * 
 * // No seu async main():
 * await inicializar();
 * 
 * app.listen(3000, () => {
 *   console.log('Servidor rodando na porta 3000');
 * });
 * 
 * OPÇÃO 3: Como importação parcial
 * 
 * const { criarIndices } = require('./schemas/QUICK-START.js');
 * 
 * // Criar apenas índices:
 * await criarIndices();
 * 
 * ============================================================================
 */
