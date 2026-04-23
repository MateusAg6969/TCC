require('dotenv').config();

const app = require('./app');
const db = require('./db/connection');

const PORT = Number(process.env.PORT || 3000);

async function bootstrap() {
  await db.conectar();

  app.listen(PORT, () => {
    console.log(`Servidor IF REDE rodando na porta ${PORT}`);
  });
}

bootstrap();
