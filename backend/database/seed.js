/**
 * Seed script — creates (or resets) the single Admin account.
 *
 * Usage:
 *   node database/seed.js <username> <password>
 *
 * If no arguments are given, defaults to:
 *   username: admin
 *   password: (randomly generated and printed to console)
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../src/config/db');

async function seed() {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || crypto.randomBytes(6).toString('hex');

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const existing = await pool.query('SELECT id FROM admins LIMIT 1');

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE admins SET username = $1, password_hash = $2 WHERE id = $3',
        [username, passwordHash, existing.rows[0].id]
      );
      console.log('✅ Existing admin updated.');
    } else {
      await pool.query(
        'INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
        [username, passwordHash]
      );
      console.log('✅ Admin created.');
    }

    console.log('-----------------------------------');
    console.log(`  Admin username: ${username}`);
    console.log(`  Admin password: ${password}`);
    console.log('-----------------------------------');
    console.log('Store this password securely — it will not be shown again.');
  } catch (err) {
    console.error('❌ Failed to seed admin:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
