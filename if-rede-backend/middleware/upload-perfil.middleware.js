const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Limite: 5MB para imagens de perfil/banner
const LIMITE_TAMANHO = 5 * 1024 * 1024;

const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.memoryStorage();

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
