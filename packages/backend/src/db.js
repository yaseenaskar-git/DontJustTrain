const { Pool } = require('pg');
const store = require('./store');

const DATABASE_URL = process.env.DATABASE_URL;
let pool = null;
if (DATABASE_URL) {
  pool = new Pool({ connectionString: DATABASE_URL });
}

async function query(text, params) {
  if (!pool) throw new Error('No database configured');
  const res = await pool.query(text, params);
  return res;
}

// Fallback helpers for JSON store when DATABASE_URL isn't set
function readTable(name) {
  return store.read(name) || {};
}

function writeTable(name, data) {
  store.write(name, data);
}

module.exports = { pool, query, readTable, writeTable };
