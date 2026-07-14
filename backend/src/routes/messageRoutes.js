const express = require('express');
const { requireGuest } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

const router = express.Router();

// Guest (room-user) endpoints — scoped to the room encoded in their JWT.
router.use(requireGuest);

router.get('/:id/messages', messageController.getRoomMessages);
router.get('/:id/users', messageController.getOnlineUsers);

module.exports = router;
