const db = require('../config/db');

// chỉ nhận 2 kênh cố định, tên cột ghép từ danh sách này
const CHANNELS = ['email', 'phone'];
const check = (channel) => {
  if (!CHANNELS.includes(channel)) throw new Error('Kênh không hợp lệ');
  return channel;
};

exports.create = async ({ tokenHash, userId, otpHash, ttlMinutes }) => {
  await db.query(
    `INSERT INTO password_resets (token_hash, user_id, email_otp_hash, email_otp_expires_at)
     VALUES ($1, $2, $3, NOW() + ($4 * INTERVAL '1 minute'))`,
    [tokenHash, userId, otpHash, ttlMinutes],
  );
};

exports.findByTokenHash = async (tokenHash) => {
  const { rows } = await db.query(
    'SELECT * FROM password_resets WHERE token_hash = $1 AND expires_at > NOW()',
    [tokenHash],
  );
  return rows[0] || null;
};

// lưu OTP SMS (sau khi email đã xác thực)
exports.savePhoneOtp = async (id, { otpHash, ttlMinutes }) => {
  await db.query(
    `UPDATE password_resets
     SET phone_otp_hash = $2,
         phone_otp_expires_at = NOW() + ($3 * INTERVAL '1 minute'),
         phone_otp_attempts = 0
     WHERE id = $1`,
    [id, otpHash, ttlMinutes],
  );
};

exports.addAttempt = async (id, channel) => {
  const c = check(channel);
  await db.query(`UPDATE password_resets SET ${c}_otp_attempts = ${c}_otp_attempts + 1 WHERE id = $1`, [id]);
};

exports.markVerified = async (id, channel) => {
  const c = check(channel);
  await db.query(`UPDATE password_resets SET ${c}_verified = TRUE, ${c}_otp_hash = NULL WHERE id = $1`, [id]);
};

exports.removeByUser = async (client, userId) => {
  await client.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
};

exports.deleteExpired = async () => {
  await db.query('DELETE FROM password_resets WHERE expires_at < NOW()');
};