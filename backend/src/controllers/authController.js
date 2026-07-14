const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const env = require('../config/env');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/auth/admin/login
 * Body: { username, password }
 */
async function adminLogin(req, res, next) {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT id, username, password_hash FROM admins WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid username or password.', 401);
    }

    const admin = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatches) {
      throw new AppError('Invalid username or password.', 401);
    }

    const token = jwt.sign(
      { sub: admin.id, username: admin.username, role: 'admin' },
      env.JWT_SECRET,
      { expiresIn: env.ADMIN_JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      data: {
        token,
        admin: { id: admin.id, username: admin.username },
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/room/login
 * Body: { roomCode, username, password }
 * Multiple concurrent users can log in with the same credential set.
 */
async function roomLogin(req, res, next) {
  try {
    const { roomCode, username, password } = req.body;

    const roomResult = await pool.query(
      'SELECT id, room_code, name, status FROM chat_rooms WHERE room_code = $1',
      [roomCode.toUpperCase()]
    );

    if (roomResult.rows.length === 0) {
      throw new AppError('Chat room not found.', 404);
    }

    const room = roomResult.rows[0];

    if (room.status === 'closed') {
      throw new AppError('This chat room has been closed by the admin.', 410);
    }

    const credResult = await pool.query(
      `SELECT id, username, password_hash, is_active, expires_at
       FROM temporary_credentials
       WHERE room_id = $1 AND username = $2`,
      [room.id, username]
    );

    if (credResult.rows.length === 0) {
      throw new AppError('Invalid credentials for this room.', 401);
    }

    const cred = credResult.rows[0];

    if (!cred.is_active) {
      throw new AppError('These credentials have been disabled by the admin.', 401);
    }

    if (cred.expires_at && new Date(cred.expires_at) < new Date()) {
      throw new AppError('These credentials have expired.', 401);
    }

    const passwordMatches = await bcrypt.compare(password, cred.password_hash);
    if (!passwordMatches) {
      throw new AppError('Invalid credentials for this room.', 401);
    }

    const token = jwt.sign(
      {
        sub: cred.id,
        roomId: room.id,
        roomCode: room.room_code,
        username: cred.username,
        role: 'guest',
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      data: {
        token,
        room: { id: room.id, roomCode: room.room_code, name: room.name },
        username: cred.username,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/auth/me — returns whoever the current token represents. */
async function me(req, res) {
  if (req.admin) {
    return res.json({ success: true, data: { role: 'admin', ...req.admin } });
  }
  if (req.guest) {
    return res.json({ success: true, data: { role: 'guest', ...req.guest } });
  }
  return res.status(401).json({ success: false, message: 'Not authenticated.' });
}

module.exports = { adminLogin, roomLogin, me };
