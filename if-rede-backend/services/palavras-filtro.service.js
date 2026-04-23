const palavrasProibidasPadrao = require('../config/palavras-proibidas');
const { PalavraFiltro } = require('../models');

let cache = {
  palavras: [],
  expiraEm: 0,
};

function escaparRegex(valor) {
  return String(valor).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizar(texto) {
  return String(texto || '').toLowerCase();
}

async function obterPalavrasAtivas() {
  const agora = Date.now();

  if (cache.expiraEm > agora) {
    return cache.palavras;
  }

  const daBase = await PalavraFiltro.find({ ativo: true }).select('termo_normalizado').lean();

  const termosBase = daBase.map((item) => item.termo_normalizado).filter(Boolean);
  const termosPadrao = palavrasProibidasPadrao.map((item) => String(item).trim().toLowerCase());

  const unicos = Array.from(new Set([...termosPadrao, ...termosBase]));

  cache = {
    palavras: unicos,
    expiraEm: agora + 30 * 1000,
  };

  return cache.palavras;
}

function invalidarCachePalavras() {
  cache = {
    palavras: [],
    expiraEm: 0,
  };
}

async function detectarPalavraProibida(texto) {
  const textoNormalizado = normalizar(texto);
  const palavras = await obterPalavrasAtivas();

  for (const palavra of palavras) {
    const regex = new RegExp(`\\b${escaparRegex(palavra)}\\b`, 'i');
    if (regex.test(textoNormalizado)) {
      return palavra;
    }
  }

  return null;
}

async function detectarPalavraEmPartes(partes = []) {
  const textoUnificado = partes.filter(Boolean).join(' ');
  return detectarPalavraProibida(textoUnificado);
}

module.exports = {
  obterPalavrasAtivas,
  invalidarCachePalavras,
  detectarPalavraProibida,
  detectarPalavraEmPartes,
};
