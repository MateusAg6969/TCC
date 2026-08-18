require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes = require('./routes/auth.routes');
const comentariosRoutes = require('./routes/comentarios.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const postagensRoutes = require('./routes/postagens.routes');
const filtroPalavrasRoutes = require('./routes/filtro-palavras.routes');
const tagsRoutes = require('./routes/tags.routes');
const notificacoesRoutes = require('./routes/notificacoes.routes');
const medalhasRoutes = require('./routes/medalhas.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const moderacaoRoutes = require('./routes/moderacao.routes');
const adminRoutes = require('./routes/admin.routes');
const sistemaRoutes = require('./routes/sistema.routes');
const { responseMiddleware } = require('./middleware/response.middleware');
const { notFoundMiddleware, errorMiddleware } = require('./middleware/error.middleware');

const app = express();

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_POR_MINUTO || 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em instantes.' },
});

app.use(helmet({ crossOriginResourcePolicy: false }));

const defaultCorsOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Fallback seguro: sem variável de ambiente, libera apenas os ambientes locais comuns.
const allowedCorsOrigins = corsOrigins.length ? corsOrigins : defaultCorsOrigins;

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite requisições sem header Origin (ex: ferramentas servidor-a-servidor, mobile ou ferramentas locais)
      if (!origin || allowedCorsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Acesso bloqueado pela política de CORS.'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(morgan('dev'));
app.use(apiLimiter);
app.use(responseMiddleware);

// Exposicao controlada de arquivos enviados nas postagens.
// Entrada: arquivos gravados localmente em uploads/postagens.
// Saida: URL publica /uploads/<arquivo> para consumo do frontend com cabeçalhos restritivos.
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; media-src 'self'; img-src 'self' data:; style-src 'unsafe-inline'");
    },
  })
);

app.get('/health', (req, res) => {
  return res.success(
    { service: 'if-rede-backend', now: new Date().toISOString() },
    'Serviço disponível.'
  );
});

const { verificarManutencao } = require('./middleware/manutencao.middleware');
app.use('/sistema', sistemaRoutes);
app.use(verificarManutencao);

app.use('/auth', authRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/postagens', postagensRoutes);
app.use('/comentarios', comentariosRoutes);
app.use('/filtro-palavras', filtroPalavrasRoutes);
app.use('/tags', tagsRoutes);
app.use('/notificacoes', notificacoesRoutes);
app.use('/medalhas', medalhasRoutes);
app.use('/portfolio', portfolioRoutes);
app.use('/admin/moderation', moderacaoRoutes);
app.use('/admin', adminRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
