const crypto = require('crypto');
const bcrypt = require('bcrypt');

const config = require('../config/env');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { sha256 } = require('../utils/hash');
const mailer = require('../utils/mailer');
const sms = require('../utils/sms');
const userModel = require('../models/userModel');
const walletModel = require('../models/walletModel');
const registrationModel = require('../models/registrationModel');

const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;

// sinh otp, kiểm tra thời gian chờ, lưu bản băm. Trả về mã gốc để gửi đi
async function issueOtp(reg, channel, extra = {}) {
  const sentAt = reg[`${channel}_otp_sent_at`];
  const secondsSince = sentAt ? (Date.now() - new Date(sentAt).getTime()) / 1000 : Infinity;
  if (secondsSince < RESEND_SECONDS) {
    throw new AppError(`Vui lòng chờ ${Math.ceil(RESEND_SECONDS - secondsSince)} giây để gửi lại mã`, 429);
  }

  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await registrationModel.saveOtp(reg.id, channel, {
    otpHash: sha256(otp),
    ttlMinutes: OTP_TTL_MINUTES,
    ...extra,
  });
  return otp;
}

// Kiểm tra otp của một kênh
async function checkOtp(reg, channel, otp) {
  const hash = reg[`${channel}_otp_hash`];
  if (!hash) throw new AppError('Bạn chưa yêu cầu mã xác thực', 400);
  if (new Date(reg[`${channel}_otp_expires_at`]) < new Date()) {
    throw new AppError('Mã đã hết hạn, vui lòng gửi lại', 400);
  }
  if (reg[`${channel}_otp_attempts`] >= OTP_MAX_ATTEMPTS) {
    throw new AppError('Nhập sai quá nhiều lần, vui lòng gửi lại mã', 429);
  }
  if (sha256(otp) !== hash) {
    await registrationModel.addAttempt(reg.id, channel);
    throw new AppError('Mã xác thực không đúng', 400);
  }
  await registrationModel.markVerified(reg.id, channel);
}

const emailText = (otp) =>
  `Mã xác thực PacePay của bạn là ${otp}. Mã có hiệu lực ${OTP_TTL_MINUTES} phút. ` +
  'Nếu không phải bạn yêu cầu, hãy bỏ qua email này.';

// 1 email -> tạo hồ sơ tạm, gửi otp email
exports.start = async (email) => {
  if (await userModel.findByEmail(email)) {
    throw new AppError('Tài khoản đã tồn tại', 409, { code: 'EMAIL_EXISTS' });
  }
  await registrationModel.deleteExpired();

  const token = crypto.randomBytes(32).toString('hex');
  const reg = await registrationModel.create({ tokenHash: sha256(token), email });
  const otp = await issueOtp(reg, 'email');
  await mailer.send(email, 'PacePay: mã xác thực email', emailText(otp));

  return { token, devOtp: !mailer.enabled && !config.isProd ? otp : undefined };
};

// gửi lại otp email
exports.resendEmailOtp = async (reg) => {
  const otp = await issueOtp(reg, 'email');
  await mailer.send(reg.email, 'PacePay: mã xác thực email', emailText(otp));
  return { devOtp: !mailer.enabled && !config.isProd ? otp : undefined };
};

// 2 kiểm tra otp email
exports.verifyEmail = (reg, otp) => checkOtp(reg, 'email', otp);

// 3 số điện thoại -> gửi otp sms (phải xác thực email trước)
exports.sendPhoneOtp = async (reg, phone) => {
  if (!reg.email_verified) {
    throw new AppError('Bạn chưa xác thực email', 403);
  }
  if (await userModel.findByPhone(phone)) {
    throw new AppError('Số điện thoại đã được đăng ký', 409);
  }

  const otp = await issueOtp(reg, 'phone', { phone });
  await sms.send(phone, `PacePay: ma xac thuc cua ban la ${otp}, hieu luc ${OTP_TTL_MINUTES} phut.`);

  return { devOtp: sms.isMock && !config.isProd ? otp : undefined };
};

// 4 kiểm tra otp sms
exports.verifyPhone = (reg, otp) => checkOtp(reg, 'phone', otp);

// 5 tạo user + ví trong CÙNG một transaction
exports.complete = async (reg, { password, fullName, dateOfBirth, address }) => {
  if (!reg.email_verified || !reg.phone_verified) {
    throw new AppError('Bạn chưa xác thực đủ email và số điện thoại', 403);
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const user = await userModel.create(client, {
      fullName,
      email: reg.email,   // lấy từ hồ sơ đã xác thực, không tin dữ liệu client gửi
      phone: reg.phone,
      passwordHash,
      dateOfBirth: dateOfBirth || null,
      address: address || null,
    });
    await walletModel.create(client, user.id);
    await registrationModel.remove(client, reg.id);
    await client.query('COMMIT');
    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      throw new AppError('Email hoặc số điện thoại đã được đăng ký', 409);
    }
    throw err;
  } finally {
    client.release();
  }
};