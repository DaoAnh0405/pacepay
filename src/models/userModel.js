const db = require('../config/db');

exports.findByEmail = async (email) => {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
};

exports.findByPhone = async (phone) => {
  const { rows } = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
  return rows[0] || null;
};

exports.findById = async (id) => {
  const { rows } = await db.query(
    'SELECT id, full_name, email, phone, role, status FROM users WHERE id = $1',
    [id],
  );
  return rows[0] || null;
};

exports.findPhoneById = async (id) => {
  const { rows } = await db.query('SELECT phone FROM users WHERE id = $1', [id]);
  return rows[0] ? rows[0].phone : null;
};

// client = kết nối đang nằm trong transaction (nhận từ service)
exports.create = async (client, { fullName, email, phone, passwordHash, dateOfBirth, address }) => {
  const { rows } = await client.query(
    `INSERT INTO users
       (full_name, email, phone, password_hash, phone_verified_at, date_of_birth, address)
     VALUES ($1, $2, $3, $4, NOW(), $5, $6)
     RETURNING id, full_name, email, phone, role, created_at`,
    [fullName, email, phone, passwordHash, dateOfBirth, address],
  );
  return rows[0];
};

exports.updatePassword = async (client, userId, passwordHash) => {
  await client.query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, passwordHash]);
};