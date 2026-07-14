const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/rooms/:id/messages
 * Returns chat history for a room (available to admin and guests of that room).
 * Query: limit (default 100), before (message id cursor, optional)
 */
async function getRoomMessages(req, res, next) {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const before = req.query.before ? parseInt(req.query.before, 10) : null;

    // Guests may only read messages from their own room.
    if (req.guest && String(req.guest.roomId) !== String(id)) {
      throw new AppError('You do not have access to this room.', 403);
    }

    const params = [id];
    let query = `SELECT id, sender_name, socket_id, content, message_type, file_url, file_name, file_size, created_at
                 FROM messages WHERE room_id = $1`;

    if (before) {
      params.push(before);
      query += ` AND id < $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY id DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    return res.json({ success: true, data: result.rows.reverse() });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/rooms/:id/users — Admin (or guest of that room) views online users. */
async function getOnlineUsers(req, res, next) {
  try {
    const { id } = req.params;

    if (req.guest && String(req.guest.roomId) !== String(id)) {
      throw new AppError('You do not have access to this room.', 403);
    }

    const result = await pool.query(
      `SELECT id, display_name, socket_id, joined_at
       FROM active_users WHERE room_id = $1 ORDER BY joined_at ASC`,
      [id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/rooms/:id/users/:socketId — Admin force-removes a connected user. */
async function removeUser(req, res, next) {
  try {
    const { id, socketId } = req.params;
    const result = await pool.query(
      'DELETE FROM active_users WHERE room_id = $1 AND socket_id = $2 RETURNING id, display_name',
      [id, socketId]
    );
    if (result.rows.length === 0) throw new AppError('User not found or already disconnected.', 404);

    // The actual socket disconnect is triggered via the io instance attached to the app.
    const io = req.app.get('io');
    if (io) {
      io.to(socketId).emit('force_disconnect', { reason: 'Removed by admin.' });
      io.sockets.sockets.get(socketId)?.disconnect(true);
    }

    return res.json({ success: true, message: `${result.rows[0].display_name} was removed.` });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getRoomMessages, getOnlineUsers, removeUser };
