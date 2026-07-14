const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');
const roomController = require('../controllers/roomController');
const credentialController = require('../controllers/credentialController');
const messageController = require('../controllers/messageController');

const router = express.Router();

// All room management routes require Admin authentication.
router.use(requireAdmin);

router.post(
  '/',
  [body('name').trim().isLength({ min: 1, max: 128 }).withMessage('Room name is required (max 128 chars).')],
  validate,
  roomController.createRoom
);

router.get('/', roomController.listRooms);
router.get('/:id', roomController.getRoom);
router.patch('/:id/close', roomController.closeRoom);
router.patch('/:id/reopen', roomController.reopenRoom);
router.delete('/:id', roomController.deleteRoom);
router.delete('/:id/messages', roomController.clearMessages);

// Credentials nested under rooms
router.post(
  '/:id/credentials',
  [body('expiresInHours').optional().isFloat({ min: 0.1, max: 24 * 30 })],
  validate,
  credentialController.generateCredentials
);
router.get('/:id/credentials', credentialController.listCredentials);

// Presence & history nested under rooms (admin view)
router.get('/:id/users', messageController.getOnlineUsers);
router.delete('/:id/users/:socketId', messageController.removeUser);
router.get('/:id/messages', messageController.getRoomMessages);

module.exports = router;
