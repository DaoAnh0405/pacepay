const db = require('../config/db');

// ghi đè OTP cũ nếu đã có (UNIQUE user_id + action)
exports.save = async ({ userId, action, otpHash, ttlMinutes }) => {
  await db.query(
    `INSERT INTO action_otps (user_id, action, otp_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + ($4 * INTERVAL '1 minute'))
     ON CONFLICT (user_id, action) DO UPDATE
     SET otp_hash = EXCLUDED.otp_hash,
         expires_at = EXCLUDED.expires_at,
         attempts = 0,
         sent_at = NOW()`,
    [userId, action, otpHash, ttlMinutes],
  );
};

exports.find = async (userId, action) => {
  const { rows } = await db.query(
    'SELECT * FROM action_otps WHERE user_id = $1 AND action = $2',
    [userId, action],
  );
  return rows[0] || null;
};

exports.addAttempt = async (id) => {
  await db.query('UPDATE action_otps SET attempts = attempts + 1 WHERE id = $1', [id]);
};

// client = kết nối trong transaction: xóa OTP cùng lúc với việc đổi dữ liệu
exports.remove = async (client, id) => {
  await client.query('DELETE FROM action_otps WHERE id = $1', [id]);
};