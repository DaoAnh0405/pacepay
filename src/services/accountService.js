const crypto = require('crypto');
const bcrypt = require('bcrypt');

const config = require('../config/env');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { sha256 } = require('../utils/hash');
const sms = require('../utils/sms');
const userModel = require('../models/userModel');
const walletModel = require('../models/walletModel');
const actionOtpModel = require('../models/actionOtpModel');

const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;

// OTP SMS cho thao tác nhạy cảm

// gửi otp đến sdt tài khoản (lấy từ DB, không nhận từ client)
exports.sendActionOtp = async (userId, action) => {
  const user = await userModel.findAuthById(userId);
  if (!user || !user.phone) throw new AppError('Tài khoản chưa có số điện thoại', 400);

  const old = await actionOtpModel.find(userId, action);
  if (old) {
    const seconds = (Date.now() - new Date(old.sent_at).getTime()) / 1000;
    if (seconds < RESEND_SECONDS) {
      throw new AppError(`Vui lòng chờ ${Math.ceil(RESEND_SECONDS - seconds)} giây để gửi lại mã`, 429);
    }
  }

  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await actionOtpModel.save({ userId, action, otpHash: sha256(otp), ttlMinutes: OTP_TTL_MINUTES });
  await sms.send(user.phone, `PacePay: ma xac nhan la ${otp}, hieu luc ${OTP_TTL_MINUTES} phut.`);

  return {
    maskedPhone: `${user.phone.slice(0, 3)}****${user.phone.slice(-3)}`,
    devOtp: sms.isMock && config.showDevOtp ? otp : undefined,
  };
};

// kiểm tra otp, đúng thì trả về bản ghi để caller xóa trong transaction
async function checkActionOtp(userId, action, otp) {
  const rec = await actionOtpModel.find(userId, action);
  if (!rec) throw new AppError('Bạn chưa yêu cầu mã xác nhận', 400);
  if (new Date(rec.expires_at) < new Date()) {
    throw new AppError('Mã đã hết hạn, vui lòng gửi lại', 400);
  }
  if (rec.attempts >= OTP_MAX_ATTEMPTS) {
    throw new AppError('Nhập sai quá nhiều lần, vui lòng gửi lại mã', 429);
  }
  if (sha256(otp) !== rec.otp_hash) {
    await actionOtpModel.addAttempt(rec.id);
    throw new AppError('Mã xác nhận không đúng', 400);
  }
  return rec;
}
exports.checkActionOtp = checkActionOtp;

// ví và tài khoản

exports.getOverview = async (userId) => {
  const wallet = await walletModel.findByUserId(userId);
  if (!wallet) throw new AppError('Không tìm thấy ví', 404);
  return { balance: wallet.balance };
};

exports.getProfile = async (userId) => {
  const profile = await userModel.findProfile(userId);
  if (!profile) throw new AppError('Không tìm thấy người dùng', 404);
  return profile;
};

exports.updateProfile = (userId, { fullName, dateOfBirth, address }) =>
  userModel.updateProfile(userId, {
    fullName,
    dateOfBirth: dateOfBirth || null,
    address: address || null,
  });

// đổi mật khẩu (cần mật khẩu cũ + OTP SMS)

exports.changePassword = async (userId, { otp, currentPassword, newPassword }) => {
  const user = await userModel.findAuthById(userId);
  if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
    throw new AppError('Mật khẩu hiện tại không đúng', 400);
  }
  if (currentPassword === newPassword) {
    throw new AppError('Mật khẩu mới phải khác mật khẩu hiện tại', 400);
  }

  const rec = await checkActionOtp(userId, 'change_password', otp);
  const hash = await bcrypt.hash(newPassword, config.bcryptRounds);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await userModel.updatePassword(client, userId, hash);
    await actionOtpModel.remove(client, rec.id); // otp chỉ dùng được một lần
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// đặt / đổi PIN (cần otp sms, đổi thì cần thêm mật khẩu)

exports.setPin = async (userId, { otp, pin }) => {
  const rec = await checkActionOtp(userId, 'set_pin', otp);
  const hash = await bcrypt.hash(pin, config.bcryptRounds);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await userModel.updatePin(client, userId, hash);
    await actionOtpModel.remove(client, rec.id);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};