const express = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const env = require('../config/env');
const { extractToken } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

router.post(
  '/admin/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  authController.adminLogin
);

router.post(
  '/room/login',
  [
    body('roomCode').trim().notEmpty().withMessage('Room code is required.'),
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  authController.roomLogin
);

// Returns whoever the current bearer token represents (admin or guest).
router.get('/me', (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ success: false, message: 'Missing authentication token.' });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload.role === 'admin') {
      req.admin = { id: payload.sub, username: payload.username };
    } else if (payload.role === 'guest') {
      req.guest = { roomId: payload.roomId, roomCode: payload.roomCode, username: payload.username };
    }
    return authController.me(req, res);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
});

module.exports = router;
