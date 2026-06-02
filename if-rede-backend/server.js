require('dotenv').config();

const app = require('./app');
const db = require('./db/connection');
const { Usuario } = require('./models');
const bcrypt = require('bcryptjs');

const PORT = Number(process.env.PORT || 3000);

async function bootstrap() {
  await db.conectar();

  // Auto-seed: Garante que exista um usuário de teste padrão para desenvolvimento.
  // O que faz: Verifica se a coleção está vazia e cria um perfil completo.
  // Por que: Facilita o onboarding do desenvolvedor e garante credenciais consistentes.
  const count = await Usuario.countDocuments();
  if (count === 0) {
    console.log('▶ Banco de dados vazio. Criando usuário de teste...');
    const senhaHash = await bcrypt.hash('12345678', 10);
    await Usuario.create({
      senha: senhaHash,
      perfil: {
        nome: 'Acadêmico de Teste',
        email: 'frontend@test.com',
        matricula: '20260001',
        status_vinculo: 'estudante',
        privacidade: 'publico',
      },
      configuracoes: {
        mod_voluntario: true, // Habilitado para testar ferramentas de moderação
        permitir_mensagens: true,
        notificacoes: {
          likes: true,
          comentarios: true,
          seguidores: true,
          reposts: true,
        }
      }
    });
    console.log('✓ Usuário "frontend@test.com" criado (senha: 12345678)');
  }

  app.listen(PORT, () => {
    console.log(`Servidor IF REDE rodando na porta ${PORT}`);
  });
}

bootstrap();
