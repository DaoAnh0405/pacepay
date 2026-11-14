const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../src/config/db');

// xóa sạch dữ liệu giữa các lần chạy. Sổ cái có trigger chặn DELETE nên phải TRUNCATE
async function resetData() {
  await db.query(
    'TRUNCATE TABLE transactions, action_otps, wallets, users RESTART IDENTITY CASCADE',
  );
}

// tạo user + ví + PIN, balance số dư ban đầu
async function createUser({ email, balance = 0, pin = '123456', password = 'Demo@1234' }) {
  const passHash = await bcrypt.hash(password, 4); // 4 vòng cho nhanh khi test
  const pinHash = await bcrypt.hash(pin, 4);

  const u = await db.query(
    `INSERT INTO users (full_name, email, phone, password_hash, pin_hash, phone_verified_at)
     VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
    ['Test', email, '09' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0'), passHash, pinHash],
  );
  const w = await db.query(
    'INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING id',
    [u.rows[0].id, balance],
  );
  return { id: u.rows[0].id, walletId: w.rows[0].id, email, password, pin };
}

async function balanceOf(userId) {
  const { rows } = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);
  return Number(rows[0].balance);
}

const newKey = () => crypto.randomUUID();

module.exports = { resetData, createUser, balanceOf, newKey, db };