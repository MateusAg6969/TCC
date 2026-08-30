const { Server } = require('socket.io');
const { validarAccessToken } = require('./services/token.service');

let io;

/**
 * Inicializa o servidor Socket.io
 * @param {Object} httpServer - Servidor HTTP do Node.js
 */
function init(httpServer) {
  const defaultCorsOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://tcc-psi-ten.vercel.app',
  ];
  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const allowedCorsOrigins = Array.from(new Set([...defaultCorsOrigins, ...corsOrigins]));

  io = new Server(httpServer, {
    cors: {
      origin: allowedCorsOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Middleware de Autenticação (Handshake)
  // O que faz: Valida o token JWT antes de permitir a conexão.
  // Por que: Garante que apenas usuários autenticados acessem o canal de tempo real.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Acesso negado: Token não fornecido.'));
    }

    try {
      const payload = validarAccessToken(token);
      socket.usuarioId = payload.sub; // Armazena o ID do usuário no socket
      next();
    } catch (error) {
      return next(new Error('Acesso negado: Token inválido ou expirado.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Usuário conectado ao Socket: ${socket.usuarioId}`);

    // Gerenciamento de Salas (Private Rooms)
    // O que faz: Insere o socket em uma sala exclusiva baseada no ID do usuário.
    // Por que: Permite disparar notificações direcionadas sem broadcast global.
    const roomName = `user_${socket.usuarioId}`;
    socket.join(roomName);

    socket.on('disconnect', () => {
      console.log(`🔌 Usuário desconectado do Socket: ${socket.usuarioId}`);
    });
  });

  return io;
}

/**
 * Retorna a instância ativa do Socket.io
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.io não foi inicializado.');
  }
  return io;
}

/**
 * Helper para disparar notificações em tempo real
 * @param {String} usuarioId - ID do destinatário
 * @param {Object} data - Payload da notificação
 */
function emitirNotificacao(usuarioId, data) {
  if (!io) return;
  
  const roomName = `user_${usuarioId}`;
  io.to(roomName).emit('notificacao:nova', data);
}

module.exports = {
  init,
  getIO,
  emitirNotificacao
};
