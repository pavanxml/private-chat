const path = require('path');
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/guest/rooms/:id/upload
 * Uploads a file (image or attachment) and stores a message record.
 * Guests may only upload to their own room.
 */
async function uploadFile(req, res, next) {
  try {
    const { id } = req.params;

    if (!req.guest || String(req.guest.roomId) !== String(id)) {
      throw new AppError('You do not have access to this room.', 403);
    }

    if (!req.file) {
      throw new AppError('No file provided.', 400);
    }

    const { originalname, mimetype, size, filename } = req.file;
    const isImage = mimetype.startsWith('image/');
    const messageType = isImage ? 'image' : 'file';
    const fileUrl = `/uploads/${filename}`;

    const result = await pool.query(
      `INSERT INTO messages (room_id, sender_name, content, message_type, file_url, file_name, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, sender_name, socket_id, content, message_type, file_url, file_name, file_size, created_at`,
      [
        req.guest.roomId,
        req.guest.username,
        isImage ? `📷 ${originalname}` : `📎 ${originalname}`,
        messageType,
        fileUrl,
        originalname,
        size,
      ]
    );

    const message = result.rows[0];

    // Broadcast via Socket.IO to the room
    const io = req.app.get('io');
    if (io) {
      io.to(`room:${req.guest.roomId}`).emit('message:new', message);
    }

    return res.status(201).json({ success: true, data: message });
  } catch (err) {
    return next(err);
  }
}

module.exports = { uploadFile };
