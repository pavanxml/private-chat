const pool = require('../config/db');
const { generateRoomCode } = require('../utils/generateId');
const { AppError } = require('../middleware/errorHandler');

/** POST /api/rooms — Admin creates a new chat room. */
async function createRoom(req, res, next) {
  try {
    const { name } = req.body;
    const adminId = req.admin.id;

    let roomCode;
    let attempts = 0;
    // Ensure uniqueness of the generated room code.
    // (probabilistically near-instant; loop guards against the rare collision)
    while (attempts < 5) {
      roomCode = generateRoomCode();
      const exists = await pool.query('SELECT id FROM chat_rooms WHERE room_code = $1', [roomCode]);
      if (exists.rows.length === 0) break;
      attempts += 1;
    }

    const result = await pool.query(
      `INSERT INTO chat_rooms (room_code, name, status, created_by)
       VALUES ($1, $2, 'open', $3)
       RETURNING id, room_code, name, status, created_at`,
      [roomCode, name, adminId]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/rooms — Admin lists all chat rooms. */
async function listRooms(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT r.id, r.room_code, r.name, r.status, r.created_at, r.closed_at,
              COUNT(DISTINCT au.id) AS online_count,
              COUNT(DISTINCT tc.id) AS credential_count
       FROM chat_rooms r
       LEFT JOIN active_users au ON au.room_id = r.id
       LEFT JOIN temporary_credentials tc ON tc.room_id = r.id AND tc.is_active = TRUE
       GROUP BY r.id
       ORDER BY r.created_at DESC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/rooms/:id — Admin views a single room's details. */
async function getRoom(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM chat_rooms WHERE id = $1', [id]);
    if (result.rows.length === 0) throw new AppError('Room not found.', 404);
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

/** PATCH /api/rooms/:id/close — Admin closes a room (blocks new logins). */
async function closeRoom(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE chat_rooms SET status = 'closed', closed_at = NOW()
       WHERE id = $1 RETURNING id, room_code, name, status`,
      [id]
    );
    if (result.rows.length === 0) throw new AppError('Room not found.', 404);

    const socketBridge = req.app.get('socketBridge');
    if (socketBridge) socketBridge.broadcastRoomClosed(id);

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

/** PATCH /api/rooms/:id/reopen — Admin reopens a previously closed room. */
async function reopenRoom(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE chat_rooms SET status = 'open', closed_at = NULL
       WHERE id = $1 RETURNING id, room_code, name, status`,
      [id]
    );
    if (result.rows.length === 0) throw new AppError('Room not found.', 404);
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/rooms/:id — Admin permanently deletes a room and all its data. */
async function deleteRoom(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM chat_rooms WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) throw new AppError('Room not found.', 404);
    return res.json({ success: true, message: 'Room deleted.' });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/rooms/:id/messages — Admin clears chat history for a room. */
async function clearMessages(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM messages WHERE room_id = $1', [id]);

    const socketBridge = req.app.get('socketBridge');
    if (socketBridge) socketBridge.broadcastHistoryCleared(id);

    return res.json({ success: true, message: 'Chat history cleared.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createRoom,
  listRooms,
  getRoom,
  closeRoom,
  reopenRoom,
  deleteRoom,
  clearMessages,
};
