require('dotenv').config();

const http = require('http');
const app = require('./app');
const db = require('./db/connection');
const socket = require('./socket');
const { Usuario, Postagem, Medalha } = require('./models');
const bcrypt = require('bcryptjs');

const PORT = Number(process.env.PORT || 3000);
const server = http.createServer(app);

async function bootstrap() {
  await db.conectar();
  
  // Limpar banco para novo ciclo de testes (Garante estado limpo solicitado pelo usuário)
  if (process.env.NODE_ENV !== 'production') {
    await db.limpar_banco();
  }

  // Inicializa Socket.io integrado ao servidor HTTP
  socket.init(server);

  // Seed de Medalhas (Gamificação)
  const medalhasCount = await Medalha.countDocuments();
  if (medalhasCount === 0) {
    console.log('▶ Criando medalhas iniciais...');
    await Medalha.create([
      { 
        nome: '5 Anos', 
        descricao: 'Reconhecimento por tempo de participação na rede acadêmica.', 
        icone_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' 
      },
      { 
        nome: 'Monitor Voluntário', 
        descricao: 'Validação de suporte e auxílio acadêmico aos colegas.', 
        icone_url: 'https://cdn-icons-png.flaticon.com/512/1946/1946429.png' 
      },
      { 
        nome: 'Artista da Semana', 
        descricao: 'Destaque cultural e criativo nas produções da plataforma.', 
        icone_url: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png' 
      },
      { 
        nome: '10 Postagens', 
        descricao: 'Engajamento consistente na produção de conteúdo acadêmico.', 
        icone_url: 'https://cdn-icons-png.flaticon.com/512/2583/2583319.png' 
      }
    ]);
    console.log('✓ Medalhas iniciais criadas.');
  }

  // Criar Usuários de Teste solicitados
  const senhaHash = await bcrypt.hash('12345678', 10);

  // 1. Usuário Estudante de Teste
  await Usuario.create({
    senha: senhaHash,
    perfil: {
      nome: 'Estudante de Teste',
      email: 'estudante@test.com',
      matricula: '20260001',
      status_vinculo: 'estudante',
      privacidade: 'publico',
    },
    configuracoes: {
      mod_voluntario: false,
      permitir_mensagens: true,
      notificacoes: { likes: true, comentarios: true, seguidores: true, reposts: true }
    }
  });
  console.log('✓ Usuário Estudante criado: estudante@test.com');

  // 2. Usuário Administrador / Servidor
  await Usuario.create({
    senha: senhaHash,
    perfil: {
      nome: 'Administrador IF REDE',
      email: 'admin@ifc.edu.br',
      matricula: 'ADMIN001',
      status_vinculo: 'servidor', // Role de Professor/Orientador
      privacidade: 'publico',
    },
    configuracoes: {
      mod_voluntario: true, // Role de Moderador
      permitir_mensagens: true,
      notificacoes: { likes: true, comentarios: true, seguidores: true, reposts: true }
    }
  });
  console.log('✓ Usuário Administrador criado: admin@ifc.edu.br');

  server.listen(PORT, () => {
    console.log(`Servidor IF REDE rodando na porta ${PORT}`);
  });
}

bootstrap();
