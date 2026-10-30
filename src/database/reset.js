const config = require('../config/env');
const { pool } = require('../config/db');

async function reset() {
  if (config.isProd) {
    throw new Error('Không được reset database ở production!');
  }
  await pool.query('DROP SCHEMA public CASCADE');
  await pool.query('CREATE SCHEMA public');
  console.log('Đã xóa sạch database');
}

reset()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());