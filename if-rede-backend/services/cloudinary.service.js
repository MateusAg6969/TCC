const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Faz o upload de um buffer de arquivo para o Cloudinary
 * @param {Buffer} fileBuffer - O buffer do arquivo na memória
 * @param {String} mimeType - O tipo mime do arquivo (ex: image/png, video/mp4, application/pdf)
 * @returns {Promise<Object>} - O resultado do upload contendo a secure_url e public_id
 */
function uploadBuffer(fileBuffer, mimeType) {
  return new Promise((resolve, reject) => {
    const options = {
      folder: 'if-rede',
      resource_type: 'auto', // Detecta automaticamente imagens, vídeos ou documentos (PDF, DOCX)
    };

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    uploadStream.end(fileBuffer);
  });
}

module.exports = {
  uploadBuffer,
};
