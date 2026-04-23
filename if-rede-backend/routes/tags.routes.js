const express = require('express');
const { TagSubtipo, SolicitacaoTag } = require('../models');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

function gerarSlug(valor) {
  // O que faz: normaliza nomes humanos para uma chave tecnica estavel (slug).
  // Por que: o indice unico usa tipo+slug para impedir duplicidade sem depender de caixa/acentos.
  // Fluxo de dados: entrada "Fotografia Artistica" -> saida "fotografia-artistica".
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const TAGS_PADRAO = [
  // ========================================================================
  // AUDIO
  // ========================================================================
  { nome: 'Musica', tipo: 'audio' },
  { nome: 'Podcast', tipo: 'audio' },
  { nome: 'Monologo', tipo: 'audio' },
  { nome: 'Narração', tipo: 'audio' },
  { nome: 'Entrevista', tipo: 'audio' },
  { nome: 'Audiolivro', tipo: 'audio' },

  // ========================================================================
  // IMAGEM
  // ========================================================================
  { nome: 'Desenho', tipo: 'imagem' },
  { nome: 'Fotografia', tipo: 'imagem' },
  { nome: 'Pintura', tipo: 'imagem' },
  { nome: 'Ilustracao', tipo: 'imagem' },
  { nome: 'Arte digital', tipo: 'imagem' },
  { nome: 'Quadrinho', tipo: 'imagem' },

  // ========================================================================
  // TEXTO
  // ========================================================================
  { nome: 'Artigo', tipo: 'texto' },
  { nome: 'Poema', tipo: 'texto' },
  { nome: 'Resenha', tipo: 'texto' },
  { nome: 'Cronica', tipo: 'texto' },
  { nome: 'Manifesto', tipo: 'texto' },
  { nome: 'Ensaio', tipo: 'texto' },
];

async function garantirTagsPadrao() {
  // O que faz: garante que o catalogo possua todas as tags base definidas pelo produto.
  // Por que: permite evoluir o seed com novas tags sem depender de reset de banco.
  // Fluxo: percorre TAGS_PADRAO e executa upsert por tipo+slug (idempotente).

  // Saneamento de legado: versões antigas podiam inserir tags sem slug.
  // Aqui corrigimos esses registros antes do seed principal para evitar inconsistencias
  // no indice unico e garantir que o frontend receba um catalogo completo.
  const semSlug = await TagSubtipo.find({
    $or: [{ slug: { $exists: false } }, { slug: '' }, { slug: null }],
  })
    .select('_id nome')
    .lean();

  if (semSlug.length) {
    await Promise.all(
      semSlug.map((item) =>
        // Usamos acesso direto da collection para backfill tecnico.
        // Motivo: o campo slug e immutable no schema e precisamos corrigir legado.
        TagSubtipo.collection.updateOne(
          { _id: item._id },
          { $set: { slug: gerarSlug(item.nome) } }
        )
      )
    );
  }

  await Promise.all(
    TAGS_PADRAO.map((item) => {
      const slug = gerarSlug(item.nome);

      // O que faz: retorna a operacao de upsert para o Promise.all aguardar.
      // Por que: sem o return, o array vira [undefined, ...] e o seed pode nao executar.
      // Fluxo de dados: item padrao -> filtro tipo+slug -> upsert idempotente persistido.
      return TagSubtipo.updateOne(
        {
          tipo: item.tipo,
          slug,
        },
        {
          $setOnInsert: {
            nome: item.nome,
            tipo: item.tipo,
            ativo: true,
            slug,
          },
        },
        { upsert: true }
      )
    })
  );
}

router.get('/subtipos', async (req, res, next) => {
  try {
    await garantirTagsPadrao();

    // O que faz: lista tags ativas, opcionalmente filtradas por tipo.
    // Entrada: query string tipo=imagem|audio|texto.
    // Saida: array de tags para preencher o seletor no frontend.
    // Nota de seguranca: endpoint e somente leitura de catalogo publico,
    // sem dados sensiveis de usuario, por isso nao exige JWT.
    const tipo = String(req.query.tipo || '').trim();
    const filtro = { ativo: true };

    if (tipo) {
      filtro.tipo = tipo;
    }

    const tags = await TagSubtipo.find(filtro).sort({ nome: 1 }).lean();

    return res.success(tags, 'Tags carregadas com sucesso.', {
      total: tags.length,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/solicitacoes', authMiddleware, async (req, res, next) => {
  try {
    // O que faz: registra pedido de nova tag quando usuario nao encontra a desejada.
    // Entrada: nome_sugerido, tipo e justificativa opcional.
    // Saida: documento pendente para avaliacao pela moderacao.
    const { nome_sugerido, tipo, justificativa = '' } = req.body;

    if (!nome_sugerido || !tipo) {
      return res.fail('Campos obrigatorios: nome_sugerido e tipo.', 400);
    }

    const solicitacao = await SolicitacaoTag.create({
      solicitante_id: req.usuario.id,
      nome_sugerido,
      tipo,
      justificativa,
    });

    return res.success(
      solicitacao,
      'Solicitacao de nova tag enviada para avaliacao.',
      undefined,
      201
    );
  } catch (error) {
    if (error?.code === 11000) {
      return res.fail('Ja existe uma solicitacao pendente igual para este usuario.', 409);
    }
    return next(error);
  }
});

module.exports = router;
