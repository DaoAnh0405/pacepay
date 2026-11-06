const crypto = require('crypto');
const bcrypt = require('bcrypt');

const config = require('../config/env');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { sha256 } = require('../utils/hash');
const mailer = require('../utils/mailer');
const sms = require('../utils/sms');
const userModel = require('../models/userModel');
const passwordResetModel = require('../models/passwordResetModel');

const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

const newOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

// kiểm tra OTP của một kênh
async function checkOtp(reset, channel, otp) {
  const hash = reset[`${channel}_otp_hash`];
  if (!reset.user_id || !hash) {
    throw new AppError('Mã xác thực không đúng hoặc đã hết hạn', 400);
  }
  if (new Date(reset[`${channel}_otp_expires_at`]) < new Date()) {
    throw new AppError('Mã đã hết hạn, vui lòng thử lại từ đầu', 400);
  }
  if (reset[`${channel}_otp_attempts`] >= OTP_MAX_ATTEMPTS) {
    throw new AppError('Nhập sai quá nhiều lần, vui lòng thử lại từ đầu', 429);
  }
  if (sha256(otp) !== hash) {
    await passwordResetModel.addAttempt(reset.id, channel);
    throw new AppError('Mã xác thực không đúng', 400);
  }
  await passwordResetModel.markVerified(reset.id, channel);
}

// 1 gửi OTP email, luôn trả kết quả giống nhau dù email có tồn tại hay không
exports.forgot = async (email) => {
  await passwordResetModel.deleteExpired();

  const user = await userModel.findByEmail(email);
  const token = crypto.randomBytes(32).toString('hex');
  const otp = newOtp();
  const canSend = user && user.status === 'active' && user.phone;

  await passwordResetModel.create({
    tokenHash: sha256(token),
    userId: canSend ? user.id : null,
    otpHash: sha256(otp),
    ttlMinutes: OTP_TTL_MINUTES,
  });

  if (canSend) {
    await mailer.send(
      user.email,
      'PacePay: Mã đặt lại mật khẩu',
      `Mã đặt lại mật khẩu của bạn là ${otp}. Hiệu lực ${OTP_TTL_MINUTES} phút. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.`,
    );
  }

  return { token, devOtp: canSend && !mailer.enabled && !config.isProd ? otp : undefined };
};

// 2 kiểm tra OTP email, đúng thì gửi tiếp OTP SMS tới sđt của tài khoản
exports.verifyEmail = async (reset, otp) => {
  await checkOtp(reset, 'email', otp);

  // sđt lấy từ DB theo tài khoản, không nhận từ người dùng
  const phone = await userModel.findPhoneById(reset.user_id);
  if (!phone) throw new AppError('Tài khoản chưa có số điện thoại', 400);

  const phoneOtp = newOtp();
  await passwordResetModel.savePhoneOtp(reset.id, {
    otpHash: sha256(phoneOtp),
    ttlMinutes: OTP_TTL_MINUTES,
  });
  await sms.send(phone, `PacePay: Mã đặt lại mật khẩu là ${phoneOtp}, hiệu lực ${OTP_TTL_MINUTES} phút.`);

  return {
    maskedPhone: `${phone.slice(0, 3)}****${phone.slice(-3)}`,
    devOtp: sms.isMock && !config.isProd ? phoneOtp : undefined,
  };
};

// 3 kiểm tra OTP SMS (phải xác thực email trước)
exports.verifyPhone = async (reset, otp) => {
  if (!reset.email_verified) {
    throw new AppError('Bạn chưa xác thực email', 403);
  }
  await checkOtp(reset, 'phone', otp);
};

// 4 đặt mật khẩu mới (cần cả hai cờ)
exports.reset = async (reset, password) => {
  if (!reset.user_id || !reset.email_verified || !reset.phone_verified) {
    throw new AppError('Bạn chưa xác thực đủ email và số điện thoại', 403);
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await userModel.updatePassword(client, reset.user_id, passwordHash);
    await passwordResetModel.removeByUser(client, reset.user_id);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};