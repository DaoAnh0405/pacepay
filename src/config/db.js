const { Pool } = require('pg');
const config = require('./env');
const { types } = require('pg');

types.setTypeParser(1082, (v) => v);

const pool = new Pool({
  ...config.db,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Lỗi bất ngờ từ pool PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};