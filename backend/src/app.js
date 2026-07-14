const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const credentialRoutes = require('./routes/credentialRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

function createApp() {
  const app = express();

  // ---- Security & parsing middleware ----
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow serving uploaded files
    })
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // ---- Static file serving (uploaded images/files) ----
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Rate limit login endpoints to slow down credential brute-forcing.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts. Please try again later.' },
  });
  app.use('/api/auth/admin/login', loginLimiter);
  app.use('/api/auth/room/login', loginLimiter);

  // General API rate limit.
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  // ---- Health check ----
  app.get('/health', (req, res) => res.json({ success: true, status: 'ok', env: env.NODE_ENV }));

  // ---- Routes ----
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/credentials', credentialRoutes);
  app.use('/api/guest/rooms', messageRoutes);
  app.use('/api/guest/rooms', uploadRoutes);

  // ---- 404 + error handling ----
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
