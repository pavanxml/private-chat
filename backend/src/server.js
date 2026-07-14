const http = require('http');
const { Server } = require('socket.io');
const createApp = require('./app');
const env = require('./config/env');
const pool = require('./config/db');
const logger = require('./utils/logger');
const initSocket = require('./sockets/socketHandler');

async function start() {
  // Fail fast if the database is unreachable.
  await pool.query('SELECT 1');
  logger.info('Database connection verified.');

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  const socketBridge = initSocket(io);

  // Make io / socketBridge available to REST controllers (e.g. force-remove user, close room).
  app.set('io', io);
  app.set('socketBridge', socketBridge);

  httpServer.listen(env.PORT, () => {
    logger.info(`Private Chat backend listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    httpServer.close(async () => {
      await pool.end();
      logger.info('Shutdown complete.');
      process.exit(0);
    });
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
