require('dotenv').config();
const mongoose = require('mongoose');
const { Usuario } = require('./models');

async function migrarUsuarios() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Erro: MONGODB_URI não configurado no arquivo .env');
      process.exit(1);
    }

    console.log('Conectando ao banco de dados...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Conectado ao MongoDB com sucesso.');

    console.log('Buscando usuários cadastrados...');
    const usuarios = await Usuario.find({});
    console.log(`Encontrados ${usuarios.length} usuários na base de dados.`);

    let atualizadosCount = 0;
    let puladosCount = 0;

    for (const usuario of usuarios) {
      const email = String(usuario.perfil?.email || '').toLowerCase();
      const nome = String(usuario.perfil?.nome || '').toLowerCase();
      const apelido = String(usuario.perfil?.apelido || '').toLowerCase();
      const statusVinculo = usuario.perfil?.status_vinculo;

      // 1. Pular se for egresso
      if (statusVinculo === 'egresso') {
        console.log(`[PULADO] Usuário ${usuario.perfil.email} é Egresso.`);
        puladosCount++;
        continue;
      }

      // 2. Pular se for servidor
      if (statusVinculo === 'servidor') {
        console.log(`[PULADO] Usuário ${usuario.perfil.email} é Servidor.`);
        puladosCount++;
        continue;
      }

      // 3. Pular se for usuário de teste ou administrador
      const ehTeste = email.includes('teste') || 
                      email.includes('test') || 
                      email.includes('admin') ||
                      nome.includes('teste') ||
                      nome.includes('test') ||
                      apelido.includes('teste') ||
                      apelido.includes('test') ||
                      usuario.configuracoes?.admin === true;

      if (ehTeste) {
        console.log(`[PULADO] Usuário de teste/admin: ${usuario.perfil.email}`);
        puladosCount++;
        continue;
      }

      // 4. Se for estudante atual elegível, atualizar
      usuario.perfil.curso = 'Informática';
      usuario.perfil.ano = '3º ano';

      await usuario.save();
      console.log(`[ATUALIZADO] Estudante: ${usuario.perfil.email} -> Informática (3º ano)`);
      atualizadosCount++;
    }

    console.log(`\n=== Relatório de Atualização de Usuários ===`);
    console.log(`✓ Usuários atualizados com sucesso: ${atualizadosCount}`);
    console.log(`⚠ Usuários ignorados (egressos, servidores, teste): ${puladosCount}`);
    console.log(`===========================================\n`);

    await mongoose.disconnect();
    console.log('Conexão encerrada com sucesso.');
    process.exit(0);
  } catch (error) {
    console.error('Erro catastrófico na migração de usuários:', error);
    process.exit(1);
  }
}

migrarUsuarios();
