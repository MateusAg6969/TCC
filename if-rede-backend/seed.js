/**
 * ============================================================================
 * SCRIPT: CRIAR USUÁRIOS DE TESTE (matrículas)
 * ============================================================================
 * Executa: npm run seed
 *
 * Cria múltiplos usuários de teste no banco de dados usando uma lista de
 * matrículas no formato AAAAxxxxxx (AAAA = ano de ingresso). Cada usuário tem a
 * mesma senha (12345678) que é armazenada como hash Bcrypt.
 */

require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./db/connection');
const { Usuario } = require('./models');

// ---------------------------------------------------
// LISTA DE MATRICULAS DE TESTE (formato AAAANNNNNN)
// ---------------------------------------------------
const matriculasTeste = [
  '2024001234',
  '2024015678',
  '2024029012',
  '2024033456',
  '2024047890',
  '2024052345',
  '2024066789',
  '2024070123',
  '2024084567',
  '2024098901',
];

async function criarUsuariosTeste() {
  try {
    await db.conectar();

    // ---------------------------------------------------
    // INSERIR USUÁRIOS PARA CADA MATRÍCULA DA LISTA
    // ---------------------------------------------------
    for (let i = 0; i < matriculasTeste.length; i++) {
      const matricula = matriculasTeste[i];
      const email = `teste${i + 1}@example.com`;

      // Verifica se já existe usuário com a mesma matrícula ou e‑mail
      const existe = await Usuario.findOne({
        $or: [
          { 'perfil.matricula': matricula },
          { 'perfil.email': email },
        ],
      });
      if (existe) {
        console.log(`⚠️  Usuário já existe → matrícula ${matricula}`);
        continue;
      }

      const senhaHash = await bcrypt.hash('12345678', 10);

      await Usuario.create({
        senha: senhaHash,
        perfil: {
          nome: `Teste ${i + 1}`,
          email,
          matricula,
          bio: 'Usuário de teste automático',
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
          notificacoes: { likes: true, comentarios: true },
          egresso_limitado: false,
          permitir_mensagens: true,
        },
      });

      console.log(`✅ Criado → matrícula ${matricula} / email ${email}`);
    }

    console.log('\n🎉 Todos os usuários de teste foram processados.\n');
    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro ao criar usuários de teste:');
    console.error(erro);
    process.exit(1);
  }
}

criarUsuariosTeste();
