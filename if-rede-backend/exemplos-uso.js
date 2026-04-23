/**
 * ============================================================================
 * EXEMPLOS DE USO - IF REDE
 * ============================================================================
 * Demonstra como usar os modelos para as operações mais comuns.
 * Execute: node exemplos-uso.js
 */

const db = require('./db/connection');
const { Usuario, Postagem, AtividadeModeracacao } = require('./models');

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function exemplos() {
  try {
    // Conectar ao banco
    await db.conectar();

    console.log('\n========================================');
    console.log('EXEMPLOS DE USO - IF REDE');
    console.log('========================================\n');

    // ========================================================================
    // 1) CRIAR USUÁRIO
    // ========================================================================
    console.log('▶ [1] Criando um novo usuário...');

    const usuario = await Usuario.create({
      senha: 'senha_hash_aqui_12345', // Em produção, usar bcrypt
      perfil: {
        nome: 'João Silva',
        email: 'joao@ifc.edu.br',
        matricula: '20201234',
        bio: 'Estudante de Tecnologia da Informação',
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
      },
    });

    console.log(`✓ Usuário criado: ${usuario.perfil.nome} (ID: ${usuario._id})`);
    console.log(`  Email: ${usuario.perfil.email}`);
    console.log(`  Status de vínculo: ${usuario.perfil.status_vinculo}\n`);

    // ========================================================================
    // 2) CRIAR OUTRO USUÁRIO (Moderador)
    // ========================================================================
    console.log('▶ [2] Criando um moderador voluntário...');

    const moderador = await Usuario.create({
      senha: 'senha_moderador_hash_12345',
      perfil: {
        nome: 'Maria Costa',
        email: 'maria@ifc.edu.br',
        matricula: '20211456',
        bio: 'Moderadora voluntária da IF REDE',
        status_vinculo: 'servidor',
        privacidade: 'publico',
      },
      customizacao: {
        cor_fundo: '#FFF3E0',
        cor_botoes: '#FF6B00',
      },
      configuracoes: {
        mod_voluntario: true, // ← É moderadora!
        melhores_amigos: [],
      },
    });

    console.log(`✓ Moderador criado: ${moderador.perfil.nome}`);
    console.log(`  Mod voluntário: ${moderador.configuracoes.mod_voluntario}\n`);

    // ========================================================================
    // 3) CRIAR UMA POSTAGEM (Rascunho)
    // ========================================================================
    console.log('▶ [3] Criando uma postagem em rascunho...');

    const rascunho = await Postagem.create({
      autor_id: usuario._id,
      titulo: 'Meu Primeiro Poema',
      descricao: 'Um poema sobre programação',
      tipo: 'texto',
      subtipo: 'Poema',
      conteudo: {
        texto_longo: `Linhas de código, lógica pura,
        Problemas resolvem-se com ternura,
        Debug noturno, café a queimar,
        Bugs encontrados, volta a debugar!`,
        sensivel: false,
      },
      config: {
        eh_rascunho: true, // ← É rascunho, vai expirar em 14 dias
        visibilidade: 'todos',
        comentarios_ativos: true,
      },
      categorias: ['artes'],
    });

    console.log(`✓ Rascunho criado: "${rascunho.titulo}"`);
    console.log(`  Status: Rascunho`);
    console.log(`  Expira em: ${rascunho.excluir_em}`);
    console.log(`  TTL: 14 dias\n`);

    // ========================================================================
    // 4) PUBLICAR O RASCUNHO
    // ========================================================================
    console.log('▶ [4] Publicando o rascunho...');

    await rascunho.publicar();

    console.log(`✓ Rascunho publicado!`);
    console.log(`  Status: Publicado (aguardando moderação)`);
    console.log(`  Visibilidade: ${rascunho.config.visibilidade}`);
    console.log(
      `  Status Moderação: ${rascunho.status_moderacao}\n`
    );

    // ========================================================================
    // 5) CRIAR UMA POSTAGEM DE ÁUDIO
    // ========================================================================
    console.log('▶ [5] Criando uma postagem de áudio (Podcast)...');

    const postagem_audio = await Postagem.create({
      autor_id: usuario._id,
      titulo: 'Tecnologia e Inovação',
      descricao: 'Episódio 1: Inteligência Artificial',
      tipo: 'audio',
      subtipo: 'Podcast',
      conteudo: {
        url: 'https://exemplo.s3.amazonaws.com/podcast-ep1.mp3',
        duracao_segundos: 3600, // 1 hora
        metadados: {
          artista: 'João Silva',
          genero: 'Educacional',
          episodio: 1,
        },
      },
      config: {
        eh_rascunho: false, // ← Já publicado
        visibilidade: 'todos',
      },
      categorias: ['tecnologia'],
    });

    console.log(`✓ Postagem de áudio criada: "${postagem_audio.titulo}"`);
    console.log(`  Tipo: ${postagem_audio.tipo}`);
    console.log(`  Duração: ${postagem_audio.conteudo.duracao_segundos}s\n`);

    // ========================================================================
    // 6) CURTIR UMA POSTAGEM
    // ========================================================================
    console.log('▶ [6] Curtindo a postagem de áudio...');

    await postagem_audio.adicionarCurtida(moderador._id);

    console.log(`✓ Postagem curtida!`);
    console.log(`  Total de likes: ${postagem_audio.stats.likes}`);
    console.log(
      `  Quem curtiu: ${postagem_audio.stats.usuarios_que_curtiram}\n`
    );

    // ========================================================================
    // 7) INCREMENTAR VISUALIZAÇÕES
    // ========================================================================
    console.log('▶ [7] Registrando visualização...');

    await postagem_audio.incrementarVisualizacoes();

    console.log(`✓ Visualização registrada`);
    console.log(`  Total de visualizações: ${postagem_audio.stats.visualizacoes}\n`);

    // ========================================================================
    // 8) REGISTRAR ATIVIDADE DE MODERAÇÃO
    // ========================================================================
    console.log('▶ [8] Registrando atividade de moderação...');

    const atividade = await AtividadeModeracacao.create({
      moderador_id: moderador._id,
      moderador_nome: moderador.perfil.nome,
      moderador_matricula: moderador.perfil.matricula,
      tipo_acao: 'postagem_aprovada',
      descricao: 'Postagem aprovada após revisão de conteúdo',
      objeto_tipo: 'postagem',
      objeto_id: rascunho._id,
      objeto_snapshot: {
        titulo: rascunho.titulo,
        autor: usuario.perfil.nome,
      },
      tempo_estimado_minutos: 5,
      resultado: 'sucesso',
      tags: ['qualidade_conteudo'],
      ip_origem: '192.168.1.100',
    });

    console.log(`✓ Atividade de moderação registrada`);
    console.log(`  Ação: ${atividade.tipo_acao}`);
    console.log(`  Moderador: ${atividade.moderador_nome}`);
    console.log(`  Tempo: ${atividade.tempo_estimado_minutos}min (${atividade.horas}h)\n`);

    // ========================================================================
    // 9) BUSCAR POSTAGENS DO USUÁRIO
    // ========================================================================
    console.log('▶ [9] Buscando postagens do usuário...');

    const postagens_usuario = await Postagem.postagem_publica_por_autor(
      usuario._id
    );

    console.log(`✓ Postagens encontradas: ${postagens_usuario.length}`);
    postagens_usuario.forEach((post, idx) => {
      console.log(`  ${idx + 1}. "${post.titulo}" (${post.tipo})`);
    });
    console.log();

    // ========================================================================
    // 10) ENCONTRAR RASCUNHOS
    // ========================================================================
    console.log('▶ [10] Buscando rascunhos do usuário...');

    const rascunhos = await Postagem.rascunhos_do_usuario(usuario._id);

    console.log(`✓ Rascunhos encontrados: ${rascunhos.length}`);
    rascunhos.forEach((post, idx) => {
      console.log(`  ${idx + 1}. "${post.titulo}"`);
    });
    console.log();

    // ========================================================================
    // 11) ENCONTRAR MODERADORES
    // ========================================================================
    console.log('▶ [11] Buscando moderadores voluntários...');

    const moderadores = await Usuario.encontrarModeadores();

    console.log(`✓ Moderadores encontrados: ${moderadores.length}`);
    moderadores.forEach((mod) => {
      console.log(`  - ${mod.perfil.nome} (${mod.perfil.email})`);
    });
    console.log();

    // ========================================================================
    // 12) RELATÓRIO DE HORAS DE MODERAÇÃO
    // ========================================================================
    console.log('▶ [12] Gerando relatório de horas de moderação...');

    // Horas do último mês
    const relatorio = await AtividadeModeracacao.relatorio_horas_mes();

    console.log(`✓ Relatório de horas (últimos 30 dias):`);
    if (relatorio.length > 0) {
      relatorio.forEach((item) => {
        const horas = (item.total_minutos / 60).toFixed(2);
        console.log(
          `  ${item.moderador_nome}: ${horas}h em ${item.total_acoes} ações`
        );
      });
    } else {
      console.log(`  Nenhuma atividade registrada`);
    }
    console.log();

    // ========================================================================
    // 13) SUSPENDER USUÁRIO (Moderação)
    // ========================================================================
    console.log('▶ [13] Suspendendo usuário por motivo de moderação...');

    const data_fim = new Date();
    data_fim.setDate(data_fim.getDate() + 7); // 7 dias

    await usuario.suspender(data_fim, 'Conteúdo inapropriado');

    console.log(`✓ Usuário suspenso`);
    console.log(`  Até: ${data_fim.toLocaleDateString('pt-BR')}`);
    console.log(`  Motivo: ${usuario.suspensao_motivo}`);
    console.log(`  Status de suspensão: ${usuario.estaSuspenso() ? 'Sim' : 'Não'}\n`);

    // ========================================================================
    // 14) REMOVER SUSPENSÃO
    // ========================================================================
    console.log('▶ [14] Removendo suspensão...');

    await usuario.removerSuspensao();

    console.log(`✓ Suspensão removida`);
    console.log(`  Status de suspensão: ${usuario.estaSuspenso() ? 'Sim' : 'Não'}\n`);

    // ========================================================================
    // RESUMO FINAL
    // ========================================================================
    console.log('========================================');
    console.log('RESUMO DE OPERAÇÕES REALIZADAS');
    console.log('========================================');
    console.log(`✓ Usuários criados: 2`);
    console.log(`✓ Postagens criadas: 2`);
    console.log(`✓ Atividades de moderação: 1`);
    console.log(`✓ Operações testadas: 14`);
    console.log('========================================\n');

  } catch (erro) {
    console.error('✗ Erro durante exemplos:');
    console.error(erro);
  } finally {
    await db.desconectar();
  }
}

// ============================================================================
// EXECUTAR
// ============================================================================

exemplos();
