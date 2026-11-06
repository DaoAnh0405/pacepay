const db = require('../config/db');

// chỉ nhận 2 kênh cố định, tên cột ghép từ danh sách này, không từ dữ liệu người dùng
const CHANNELS = ['email', 'phone'];
const check = (channel) => {
  if (!CHANNELS.includes(channel)) throw new Error('Kênh không hợp lệ');
  return channel;
};

exports.create = async ({ tokenHash, email }) => {
  const { rows } = await db.query(
    'INSERT INTO registrations (token_hash, email) VALUES ($1, $2) RETURNING *',
    [tokenHash, email],
  );
  return rows[0];
};

exports.findByTokenHash = async (tokenHash) => {
  const { rows } = await db.query(
    'SELECT * FROM registrations WHERE token_hash = $1 AND expires_at > NOW()',
    [tokenHash],
  );
  return rows[0] || null;
};

// lưu OTP mới, kênh phone lưu luôn số điện thoại trong cùng câu UPDATE
exports.saveOtp = async (id, channel, { otpHash, ttlMinutes, phone }) => {
  const c = check(channel);
  const params = [id, otpHash, ttlMinutes];
  let phoneSql = '';
  if (c === 'phone') {
    params.push(phone);
    phoneSql = ', phone = $4';
  }
  await db.query(
    `UPDATE registrations
     SET ${c}_otp_hash = $2,
         ${c}_otp_expires_at = NOW() + ($3 * INTERVAL '1 minute'),
         ${c}_otp_attempts = 0,
         ${c}_otp_sent_at = NOW(),
         ${c}_verified = FALSE
         ${phoneSql}
     WHERE id = $1`,
    params,
  );
};

exports.addAttempt = async (id, channel) => {
  const c = check(channel);
  await db.query(`UPDATE registrations SET ${c}_otp_attempts = ${c}_otp_attempts + 1 WHERE id = $1`, [id]);
};

exports.markVerified = async (id, channel) => {
  const c = check(channel);
  await db.query(`UPDATE registrations SET ${c}_verified = TRUE, ${c}_otp_hash = NULL WHERE id = $1`, [id]);
};

exports.remove = async (client, id) => {
  await client.query('DELETE FROM registrations WHERE id = $1', [id]);
};

exports.deleteExpired = async () => {
  await db.query('DELETE FROM registrations WHERE expires_at < NOW()');
};