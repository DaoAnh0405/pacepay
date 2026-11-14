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


//
exports.findProfile = async (id) => {
  const { rows } = await db.query(
    `SELECT id, full_name, email, phone, date_of_birth, address, role,
            (pin_hash IS NOT NULL) AS has_pin, created_at
     FROM users WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
};

exports.updateProfile = async (id, { fullName, dateOfBirth, address }) => {
  const { rows } = await db.query(
    `UPDATE users SET full_name = $2, date_of_birth = $3, address = $4
     WHERE id = $1
     RETURNING id, full_name, email, phone, date_of_birth, address`,
    [id, fullName, dateOfBirth, address],
  );
  return rows[0];
};

exports.findAuthById = async (id) => {
  const { rows } = await db.query(
    'SELECT id, phone, password_hash, pin_hash FROM users WHERE id = $1',
    [id],
  );
  return rows[0] || null;
};

exports.updatePin = async (client, userId, pinHash) => {
  await client.query(
    `UPDATE users SET pin_hash = $2, failed_pin_attempts = 0, pin_locked_until = NULL
     WHERE id = $1`,
    [userId, pinHash],
  );
};


//
exports.findPinState = async (id) => {
  const { rows } = await db.query(
    'SELECT pin_hash, pin_locked_until FROM users WHERE id = $1',
    [id],
  );
  return rows[0] || null;
};

// tăng số lần sai ngay trong DB (an toàn khi nhiều request cùng lúc).
// sai đủ maxAttempts lần thì khóa lockMinutes phút.
exports.recordPinFailure = async (id, maxAttempts, lockMinutes) => {
  const { rows } = await db.query(
    `UPDATE users
     SET failed_pin_attempts = failed_pin_attempts + 1,
         pin_locked_until = CASE
           WHEN failed_pin_attempts + 1 >= $2 THEN NOW() + ($3 * INTERVAL '1 minute')
           ELSE pin_locked_until
         END
     WHERE id = $1
     RETURNING failed_pin_attempts, pin_locked_until`,
    [id, maxAttempts, lockMinutes],
  );
  return rows[0];
};

exports.resetPinFailures = async (id) => {
  await db.query(
    'UPDATE users SET failed_pin_attempts = 0, pin_locked_until = NULL WHERE id = $1',
    [id],
  );
};