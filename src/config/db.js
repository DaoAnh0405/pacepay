
const { Pool, types } = require('pg');
const config = require('./env');

types.setTypeParser(1082, (v) => v);

const pool = new Pool({
  ...config.db,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Lỗi bất ngờ từ pool PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};