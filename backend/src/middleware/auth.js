const jwt = require('jsonwebtoken');
const env = require('../config/env');

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

/** Requires a valid Admin JWT. Populates req.admin. */
function requireAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Missing authentication token.' });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    req.admin = { id: payload.sub, username: payload.username };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

/** Requires a valid Guest (room user) JWT. Populates req.guest. */
function requireGuest(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Missing authentication token.' });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload.role !== 'guest') {
      return res.status(403).json({ success: false, message: 'Guest access required.' });
    }
    req.guest = {
      roomId: payload.roomId,
      roomCode: payload.roomCode,
      username: payload.username,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

module.exports = { requireAdmin, requireGuest, extractToken };
