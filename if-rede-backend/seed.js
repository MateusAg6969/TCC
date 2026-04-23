/**
 * ============================================================================
 * SCRIPT: CRIAR USUÁRIO DE TESTE
 * ============================================================================
 * Executa: npm run seed
 * 
 * Este script cria um usuário de teste no banco de dados para permitir
 * testes do login e outras funcionalidades.
 */

require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./db/connection');
const { Usuario } = require('./models');

async function criarUsuarioTeste() {
  try {
    // Conectar ao banco
    await db.conectar();

    console.log('\n========================================');
    console.log('CRIANDO USUÁRIO DE TESTE');
    console.log('========================================\n');

    // Verificar se usuário já existe
    const usuarioExistente = await Usuario.findOne({
      'perfil.email': 'frontend@test.com',
    });

    if (usuarioExistente) {
      console.log('⚠️  Usuário de teste já existe!');
      console.log('   Email: frontend@test.com');
      console.log('   Senha: 12345678\n');
      process.exit(0);
    }

    // Criar hash da senha
    const senhaHash = await bcrypt.hash('12345678', 10);

    // Criar usuário
    const usuario = await Usuario.create({
      senha: senhaHash,
      perfil: {
        nome: 'Frontend Tester',
        email: 'frontend@test.com',
        matricula: '20269999',
        bio: 'Usuário para testes do frontend',
        status_vinculo: 'estudante',
        privacidade: 'publico',
      },
      customizacao: {
        cor_fundo: '#E8F4F8',
        cor_botoes: '#0066CC',
        medalhas: [],
      },
      configuracoes: {
        mod_voluntario: false,
        melhores_amigos: [],
        notificacoes: {
          likes: true,
          comentarios: true,
        },
        egresso_limitado: false,
        permitir_mensagens: true,
      },
    });

    console.log('✅ Usuário de teste criado com sucesso!\n');
    console.log('📋 Credenciais para teste:');
    console.log('   Email:  frontend@test.com');
    console.log('   Senha:  12345678\n');
    console.log('💡 Use essas credenciais para fazer login no frontend.\n');

    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro ao criar usuário de teste:');
    console.error(erro);
    process.exit(1);
  }
}

criarUsuarioTeste();
