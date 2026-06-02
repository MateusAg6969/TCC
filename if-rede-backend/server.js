require('dotenv').config();

const app = require('./app');
const db = require('./db/connection');
const { Usuario, Postagem } = require('./models');
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

    // 2. Criar Usuário 'Lara Mendes' (Para testes sociais)
    const lara = await Usuario.create({
      senha: senhaHash,
      perfil: {
        nome: 'Lara Mendes',
        email: 'lara@ifc.edu.br',
        matricula: '20269999',
        status_vinculo: 'estudante',
        bio: 'Estudante de Informática apaixonada por Poesia e Algoritmos. 💻✨',
        privacidade: 'publico'
      },
      customizacao: {
        cor_botoes: '#9333ea',
        cor_fundo: '#faf5ff'
      }
    });

    // 3. Criar Postagens de Texto para Lara
    await Postagem.create([
      {
        autor_id: lara._id,
        titulo: 'O Manifesto do Código Poético',
        descricao: 'Uma reflexão sobre como a lógica encontra a arte.',
        tipo: 'texto',
        subtipo: 'Poesia',
        conteudo: {
          texto_longo: 'No silêncio do terminal, as linhas dançam. Cada ponto e vírgula é uma pausa para respirar. O código não é apenas funcionalidade; é expressão pura da mente acadêmica.',
          url: 'https://placeholder.com/text-post'
        },
        config: { visibilidade: 'todos', eh_rascunho: false },
        status_moderacao: 'aprovado',
        stats: { likes: 12, visualizacoes: 45 }
      },
      {
        autor_id: lara._id,
        titulo: 'Dica: Next.js no IFC',
        descricao: 'Por que estamos usando App Router no nosso TCC?',
        tipo: 'texto',
        subtipo: 'Tutorial',
        conteudo: {
          texto_longo: 'O App Router facilita muito a gestão de layouts complexos. Para projetos acadêmicos como o IF REDE, a escalabilidade é essencial!',
          url: 'https://placeholder.com/text-post-2'
        },
        config: { visibilidade: 'todos', eh_rascunho: false },
        status_moderacao: 'aprovado',
        stats: { likes: 8, visualizacoes: 20 }
      }
    ]);

    await Usuario.updateOne({ _id: lara._id }, { 'stats.total_postagens': 2 });
    console.log('✓ Usuária "Lara Mendes" e postagens criadas para teste.');
  }

  app.listen(PORT, () => {
    console.log(`Servidor IF REDE rodando na porta ${PORT}`);
  });
}

bootstrap();
