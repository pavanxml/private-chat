const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const env = require('../config/env');
const { generateUsername, generatePassword } = require('../utils/generateId');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/rooms/:id/credentials
 * Admin generates a new temporary username/password pair for a room.
 * Body: { expiresInHours? } (optional; defaults to setting or no expiry)
 */
async function generateCredentials(req, res, next) {
  try {
    const { id } = req.params;
    const { expiresInHours } = req.body;

    const roomResult = await pool.query('SELECT id, room_code, status FROM chat_rooms WHERE id = $1', [id]);
    if (roomResult.rows.length === 0) throw new AppError('Room not found.', 404);
    if (roomResult.rows[0].status === 'closed') {
      throw new AppError('Cannot generate credentials for a closed room.', 400);
    }

    const username = generateUsername();
    const plainPassword = generatePassword();
    const passwordHash = await bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);

    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : null;

    const result = await pool.query(
      `INSERT INTO temporary_credentials (room_id, username, password_hash, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, expires_at, created_at`,
      [id, username, passwordHash, expiresAt]
    );

    return res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        roomCode: roomResult.rows[0].room_code,
        username: result.rows[0].username,
        password: plainPassword, // returned once, in plaintext, for the admin to share
        expiresAt: result.rows[0].expires_at,
        joinUrl: `/chat/${roomResult.rows[0].room_code}`,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/rooms/:id/credentials — Admin lists all credentials for a room. */
async function listCredentials(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, username, expires_at, is_active, created_at
       FROM temporary_credentials
       WHERE room_id = $1
       ORDER BY created_at DESC`,
      [id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return next(err);
  }
}

/** PATCH /api/credentials/:credId/revoke — Admin disables a credential set. */
async function revokeCredential(req, res, next) {
  try {
    const { credId } = req.params;
    const result = await pool.query(
      `UPDATE temporary_credentials SET is_active = FALSE WHERE id = $1 RETURNING id, username`,
      [credId]
    );
    if (result.rows.length === 0) throw new AppError('Credential not found.', 404);
    return res.json({ success: true, message: 'Credential revoked.' });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/credentials/:credId — Admin deletes a credential set entirely. */
async function deleteCredential(req, res, next) {
  try {
    const { credId } = req.params;
    const result = await pool.query('DELETE FROM temporary_credentials WHERE id = $1 RETURNING id', [credId]);
    if (result.rows.length === 0) throw new AppError('Credential not found.', 404);
    return res.json({ success: true, message: 'Credential deleted.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { generateCredentials, listCredentials, revokeCredential, deleteCredential };
