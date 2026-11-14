const db = require('../config/db');

exports.create = async (client, userId) => {
  const { rows } = await client.query(
    'INSERT INTO wallets (user_id) VALUES ($1) RETURNING id, balance',
    [userId],
  );
  return rows[0];
};

exports.findByUserId = async (userId) => {
  const { rows } = await db.query('SELECT id, balance FROM wallets WHERE user_id = $1', [userId]);
  return rows[0] || null;
};

// các hàm có tham số client chạy TRONG transaction

exports.findIdByUserId = async (client, userId) => {
  const { rows } = await client.query('SELECT id FROM wallets WHERE user_id = $1', [userId]);
  return rows[0] ? rows[0].id : null;
};

// khóa các ví, luôn theo thứ tự id tăng dần để tránh deadlock
exports.lockByIds = async (client, ids) => {
  const { rows } = await client.query(
    'SELECT id, balance FROM wallets WHERE id = ANY($1::bigint[]) ORDER BY id FOR UPDATE',
    [ids],
  );
  return rows;
};

// cộng/trừ ngay trong DB, trả về số dư mới
exports.addToBalance = async (client, id, delta) => {
  const { rows } = await client.query(
    'UPDATE wallets SET balance = balance + $2 WHERE id = $1 RETURNING balance',
    [id, delta],
  );
  return rows[0].balance;
};