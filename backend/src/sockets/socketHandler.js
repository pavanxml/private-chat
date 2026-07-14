const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const env = require('../config/env');
const logger = require('../utils/logger');

// roomId -> Map<socketId, { displayName, typing }>  (in-memory mirror for fast typing broadcasts)
const roomPresence = new Map();

function getRoomSockets(roomId) {
  if (!roomPresence.has(roomId)) roomPresence.set(roomId, new Map());
  return roomPresence.get(roomId);
}

function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication token required.'));

    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload.role !== 'guest') return next(new Error('Only room guests may connect via socket.'));

    socket.user = {
      roomId: payload.roomId,
      roomCode: payload.roomCode,
      username: payload.username,
    };
    return next();
  } catch (err) {
    return next(new Error('Invalid or expired token.'));
  }
}

function initSocket(io) {
  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    const { roomId, roomCode, username } = socket.user;
    const roomChannel = `room:${roomId}`;

    try {
      // Verify the room still exists and is open before allowing the join.
      const roomResult = await pool.query('SELECT status FROM chat_rooms WHERE id = $1', [roomId]);
      if (roomResult.rows.length === 0 || roomResult.rows[0].status === 'closed') {
        socket.emit('error_message', { message: 'This chat room is no longer available.' });
        socket.disconnect(true);
        return;
      }

      socket.join(roomChannel);
      getRoomSockets(roomId).set(socket.id, { displayName: username, typing: false });

      await pool.query(
        `INSERT INTO active_users (room_id, display_name, socket_id) VALUES ($1, $2, $3)
         ON CONFLICT (socket_id) DO NOTHING`,
        [roomId, username, socket.id]
      );

      // System message announcing the join, persisted to history.
      const systemMsg = await pool.query(
        `INSERT INTO messages (room_id, sender_name, content, message_type)
         VALUES ($1, $2, $3, 'system') RETURNING id, sender_name, content, message_type, created_at`,
        [roomId, username, `${username} joined the chat.`]
      );

      io.to(roomChannel).emit('message:new', systemMsg.rows[0]);

      const onlineUsers = Array.from(getRoomSockets(roomId).values()).map((u) => u.displayName);
      io.to(roomChannel).emit('presence:update', { onlineUsers, count: onlineUsers.length });

      logger.info(`Socket connected: ${username} joined room ${roomCode}`, { socketId: socket.id });
    } catch (err) {
      logger.error('Error during socket connection setup', err);
      socket.emit('error_message', { message: 'Failed to join chat room.' });
      socket.disconnect(true);
      return;
    }

    // ---- Chat message ----
    socket.on('message:send', async (payload, ack) => {
      try {
        const content = (payload?.content || '').toString().trim().slice(0, 4000);
        if (!content) {
          if (ack) ack({ success: false, message: 'Message cannot be empty.' });
          return;
        }

        const result = await pool.query(
          `INSERT INTO messages (room_id, sender_name, socket_id, content, message_type)
           VALUES ($1, $2, $3, $4, 'text')
           RETURNING id, sender_name, socket_id, content, message_type, created_at`,
          [roomId, username, socket.id, content]
        );

        io.to(roomChannel).emit('message:new', result.rows[0]);
        if (ack) ack({ success: true, data: result.rows[0] });
      } catch (err) {
        logger.error('Error sending message', err);
        if (ack) ack({ success: false, message: 'Failed to send message.' });
      }
    });

    // ---- Typing indicator ----
    socket.on('typing:start', () => {
      const presence = getRoomSockets(roomId);
      const entry = presence.get(socket.id);
      if (entry) entry.typing = true;
      socket.to(roomChannel).emit('typing:update', { username, typing: true });
    });

    socket.on('typing:stop', () => {
      const presence = getRoomSockets(roomId);
      const entry = presence.get(socket.id);
      if (entry) entry.typing = false;
      socket.to(roomChannel).emit('typing:update', { username, typing: false });
    });

    // ---- Disconnect / cleanup ----
    socket.on('disconnect', async () => {
      try {
        const presence = getRoomSockets(roomId);
        presence.delete(socket.id);
        if (presence.size === 0) roomPresence.delete(roomId);

        await pool.query('DELETE FROM active_users WHERE socket_id = $1', [socket.id]);

        const systemMsg = await pool.query(
          `INSERT INTO messages (room_id, sender_name, content, message_type)
           VALUES ($1, $2, $3, 'system') RETURNING id, sender_name, content, message_type, created_at`,
          [roomId, username, `${username} left the chat.`]
        );

        io.to(roomChannel).emit('message:new', systemMsg.rows[0]);

        const onlineUsers = Array.from(getRoomSockets(roomId).values()).map((u) => u.displayName);
        io.to(roomChannel).emit('presence:update', { onlineUsers, count: onlineUsers.length });

        logger.info(`Socket disconnected: ${username} left room ${roomCode}`, { socketId: socket.id });
      } catch (err) {
        logger.error('Error during socket disconnect cleanup', err);
      }
    });
  });

  // Allows the admin's REST API (e.g. room close/delete) to broadcast to guests.
  return {
    broadcastRoomClosed(roomId) {
      io.to(`room:${roomId}`).emit('room:closed', { message: 'This chat room has been closed by the admin.' });
      io.in(`room:${roomId}`).disconnectSockets(true);
      roomPresence.delete(roomId);
    },
    broadcastHistoryCleared(roomId) {
      io.to(`room:${roomId}`).emit('history:cleared');
    },
  };
}

module.exports = initSocket;
