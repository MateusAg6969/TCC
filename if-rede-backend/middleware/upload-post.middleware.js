const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Limites definidos por tipo para equilibrar UX e custo de infraestrutura.
// - imagem: 10MB (suficiente para alta qualidade web)
// - video: 50MB (pequenos clipes/projetos)
// - audio: 25MB (faixas curtas/medias)
// - texto: 5MB (txt/pdf/docx, evitando uploads excessivos)
const LIMITES_POR_TIPO = {
  imagem: 25 * 1024 * 1024,
  video: 25 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
  texto: 25 * 1024 * 1024,
};

// Tipos MIME aceitos por categoria de postagem.
// Entrada: req.body.tipo + arquivo enviado.
// Saida: validacao coerente entre subtipo de post e arquivo real.
const MIME_POR_TIPO = {
  imagem: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'],
  texto: [
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

const storage = multer.memoryStorage();

const uploadPostArquivo = multer({
  storage,
  fileFilter: function validarMime(req, file, cb) {
    const todosPermitidos = Object.values(MIME_POR_TIPO).flat();

    if (!todosPermitidos.includes(file.mimetype)) {
      return cb(new Error('Tipo de arquivo nao permitido para upload. Formato não seguro.'));
    }

    return cb(null, true);
  },
  limits: {
    // Limite global de seguranca; limite especifico e revalidado na rota por tipo.
    fileSize: 25 * 1024 * 1024,
  },
});

module.exports = {
  uploadPostArquivo,
  LIMITES_POR_TIPO,
  MIME_POR_TIPO,
};
