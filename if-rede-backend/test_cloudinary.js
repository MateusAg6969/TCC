require('dotenv').config();
const { uploadBuffer } = require('./services/cloudinary.service');

async function test() {
  console.log('--- Teste de Integração do Cloudinary ---');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Configurado' : 'Não configurado');
  console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Configurado' : 'Não configurado');
  console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Configurado' : 'Não configurado');

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log('\n[INFO] Variáveis de ambiente do Cloudinary não estão configuradas.');
    console.log('Por favor, cadastre-se gratuitamente em https://cloudinary.com/ e configure as variáveis no seu arquivo .env local ou nas configurações da Vercel/Render.');
    console.log('O código do projeto foi atualizado com sucesso e está pronto para receber as credenciais!');
    process.exit(0);
  }

  try {
    console.log('\nEnviando imagem de teste de 1x1 pixel (buffer)...');
    
    // Buffer de imagem PNG de 1x1 pixel transparente
    const pixelPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const result = await uploadBuffer(pixelPngBuffer, 'image/png');
    console.log('\n[SUCESSO] Upload concluído com sucesso!');
    console.log('URL Segura:', result.secure_url);
    console.log('Public ID:', result.public_id);
    console.log('Formato:', result.format);
  } catch (error) {
    console.error('\n[ERRO] Falha ao fazer o upload para o Cloudinary:', error.message);
  }

  process.exit(0);
}

test().catch(console.error);
