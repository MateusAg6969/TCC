const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const db = require('./db/connection');
const { Usuario, Postagem } = require('./models');

async function seedSocialTest() {
  try {
    await db.conectar();
    console.log('▶ Iniciando seed de teste social...');

    // 1. Criar Usuário 'Lara Mendes' (Alvo do teste)
    const senhaHash = await bcrypt.hash('12345678', 10);
    
    // Deleta se já existir para evitar conflito de índice único
    await Usuario.deleteOne({ 'perfil.email': 'lara@ifc.edu.br' });

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
        cor_botoes: '#9333ea', // Roxo vibrante
        cor_fundo: '#faf5ff'
      }
    });

    console.log('✓ Usuária "Lara Mendes" criada.');

    // 2. Criar Postagens de Texto para Lara
    await Postagem.deleteMany({ autor_id: lara._id });

    const post1 = await Postagem.create({
      autor_id: lara._id,
      titulo: 'O Manifesto do Código Poético',
      descricao: 'Uma reflexão sobre como a lógica encontra a arte.',
      tipo: 'texto',
      subtipo: 'Poesia',
      conteudo: {
        texto_longo: 'No silêncio do terminal, as linhas dançam. Cada ponto e vírgula é uma pausa para respirar. O código não é apenas funcionalidade; é expressão pura da mente acadêmica.',
        url: 'https://placeholder.com/text-post' 
      },
      config: {
        visibilidade: 'todos',
        eh_rascunho: false
      },
      status_moderacao: 'aprovado',
      stats: {
        likes: 12,
        visualizacoes: 45
      }
    });

    const post2 = await Postagem.create({
      autor_id: lara._id,
      titulo: 'Dica: Next.js no IFC',
      descricao: 'Por que estamos usando App Router no nosso TCC?',
      tipo: 'texto',
      subtipo: 'Tutorial',
      conteudo: {
        texto_longo: 'O App Router facilita muito a gestão de layouts complexos. Para projetos acadêmicos como o IF REDE, a escalabilidade é essencial!',
        url: 'https://placeholder.com/text-post-2'
      },
      config: {
        visibilidade: 'todos',
        eh_rascunho: false
      },
      status_moderacao: 'aprovado',
      stats: {
        likes: 8,
        visualizacoes: 20
      }
    });

    // Atualizar stats da Lara
    lara.stats.total_postagens = 2;
    await lara.save();

    console.log('✓ 2 Postagens de texto criadas para Lara.');
    console.log('\n🚀 TUDO PRONTO!');
    console.log('Credenciais para seguir/curtir:');
    console.log(' - Seu Login: frontend@test.com / 12345678');
    console.log(' - Perfil para interagir: Lara Mendes (lara@ifc.edu.br)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  }
}

seedSocialTest();
