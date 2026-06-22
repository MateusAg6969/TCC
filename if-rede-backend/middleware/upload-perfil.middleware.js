const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Limite: 5MB para imagens de perfil/banner
const LIMITE_TAMANHO = 5 * 1024 * 1024;

const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const pastaUpload = path.join(process.cwd(), 'uploads', 'perfis');

if (!fs.existsSync(pastaUpload)) {
  fs.mkdirSync(pastaUpload, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, pastaUpload);
  },
  filename: function (req, file, cb) {
    const extensao = path.extname(file.originalname || '').toLowerCase();
    const nomeUnico = `perfil-${Date.now()}-${Math.round(Math.random() * 1e9)}${extensao}`;
    cb(null, nomeUnico);
  },
});

const uploadPerfilArquivo = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (!MIME_PERMITIDOS.includes(file.mimetype)) {
      return cb(new Error('Formato de imagem não permitido (use JPG, PNG, WEBP ou GIF).'));
    }
    return cb(null, true);
  },
  limits: {
    fileSize: LIMITE_TAMANHO,
  },
});

module.exports = {
  uploadPerfilArquivo,
};
