require('dotenv').config();
const mongoose = require('mongoose');
const { PalavraFiltro } = require('./models');

const palavrasOfensivas = [
  // Português (PT)
  'bicha', 'boceta', 'bosta', 'cacete', 'cagar', 'caralho', 'chochota', 'corno', 'cu', 'filho da puta',
  'foda', 'foda-se', 'foder', 'gozar', 'merda', 'puta', 'puto', 'viado', 'piranha', 'arrombado',
  'otario', 'imbecil', 'idiota', 'retardado', 'canalha', 'safado', 'vagabundo', 'paspalho', 'babaca',
  'aborto', 'bastardo', 'camisinha', 'cocaína', 'consolo', 'esporra', 'heroína', 'heterosexual',

  // Espanhol (ES)
  'cabron', 'caca', 'coño', 'culo', 'follar', 'gilipollas', 'hijo de puta', 'imbecil', 'idiota',
  'maricon', 'mierda', 'puta', 'puto', 'pendejo', 'joder', 'cabrona', 'boludo', 'marica',
  'concha de tu madre', 'chupada', 'chupapollas', 'chupeton', 'bollera', 'macizorra', 'lameculos',
  'asesinato', 'bastardo', 'droga', 'drogas', 'esperma',

  // Inglês (EN)
  'anal', 'anus', 'ass', 'asshole', 'bastard', 'bitch', 'blowjob', 'boob', 'boobs', 'bullshit',
  'butt', 'clitoris', 'cock', 'crap', 'cunt', 'dick', 'fag', 'faggot', 'fuck', 'fucker',
  'fucking', 'goddamn', 'hell', 'homo', 'jerk', 'motherfucker', 'nigger', 'piss', 'pussy',
  'rape', 'retard', 'shit', 'slut', 'tits', 'whore', 'acrotomophilia', 'anilingus', 'apeshit',
  'arsehole', 'assmunch', 'autoerotic', 'bareback', 'bestiality', 'circlejerk', 'cleveland steamer'
];

async function seedPalavras() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Erro: MONGODB_URI não configurado no arquivo .env');
      process.exit(1);
    }

    console.log('Conectando ao banco de dados...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Conectado ao MongoDB com sucesso.');

    console.log(`Iniciando a importação de ${palavrasOfensivas.length} termos ofensivos...`);

    let inseridosCount = 0;
    let duplicadosCount = 0;

    for (const termo of palavrasOfensivas) {
      try {
        const termoNormalizado = termo.trim().toLowerCase();
        
        // Verifica se a palavra já existe para evitar erros de chave duplicada (índice unique)
        const existe = await PalavraFiltro.findOne({ termo_normalizado: termoNormalizado });
        if (existe) {
          duplicadosCount++;
          continue;
        }

        await PalavraFiltro.create({
          termo: termo.trim(),
          severidade: 'alta',
          ativo: true,
          criado_por: null // Criado pelo Sistema
        });

        inseridosCount++;
      } catch (err) {
        console.error(`Erro ao inserir o termo "${termo}":`, err.message);
      }
    }

    console.log(`\n=== Relatório de Seed de Palavras ===`);
    console.log(`✓ Termos adicionados com sucesso: ${inseridosCount}`);
    console.log(`⚠ Termos duplicados/ignorados: ${duplicadosCount}`);
    console.log(`====================================\n`);

    // Invalidar o cache de palavras no serviço correspondente
    const { invalidarCachePalavras } = require('./services/palavras-filtro.service');
    invalidarCachePalavras();
    console.log('✓ Cache do filtro de palavras invalidado com sucesso.');

    await mongoose.disconnect();
    console.log('Conexão encerrada com sucesso.');
    process.exit(0);
  } catch (error) {
    console.error('Erro catastrófico no script de seed:', error);
    process.exit(1);
  }
}

seedPalavras();
