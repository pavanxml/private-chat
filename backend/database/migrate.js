const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function migrate() {
  console.log('Reading schema.sql...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('Connecting to database and running schema...');
    // Execute the SQL queries
    await pool.query(sql);
    console.log('✅ Schema migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
