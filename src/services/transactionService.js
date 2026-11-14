const bcrypt = require('bcrypt');

const db = require('../config/db');
const AppError = require('../utils/AppError');
const { checkAmount, formatVND, LARGE_AMOUNT } = require('../utils/money');
const { generateReferenceCode } = require('../utils/referenceCode');
const userModel = require('../models/userModel');
const walletModel = require('../models/walletModel');
const transactionModel = require('../models/transactionModel');
const actionOtpModel = require('../models/actionOtpModel');
const accountService = require('./accountService');

const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCK_MINUTES = 15;

// các bước kiểm tra trước khi mở transaction tiền 

// cùng idempotency key đã xử lý thì trả lại kết quả cũ, không làm lần hai
async function findReplay(userId, type, amount, key) {
  const old = await transactionModel.findByIdempotency(userId, key);
  if (!old) return null;
  if (old.type !== type || Number(old.amount) !== amount) {
    throw new AppError('Mã giao dịch đã được dùng cho giao dịch khác, vui lòng tải lại trang', 409);
  }
  return { transaction: old, replayed: true };
}

// giao dịch lớn mà chưa có otp báo ngay để giao diện hiện ô nhập OTP.
// đặt TRƯỚC bước kiểm tra pin để không làm người dùng mất lượt nhập PIN
function assertOtpProvided(amount, otp) {
  if (amount >= LARGE_AMOUNT && !otp) {
    throw new AppError(
      `Giao dịch từ ${formatVND(LARGE_AMOUNT)} cần mã xác nhận SMS`,
      400,
      { code: 'OTP_REQUIRED' },
    );
  }
}

// kiểm tra pin và đếm số lần sai. Chạy ngoài transaction tiền,
// vì rollback sẽ xóa luôn việc đếm và kẻ gian được thử vô hạn
async function verifyPin(userId, pin) {
  const state = await userModel.findPinState(userId);
  if (!state || !state.pin_hash) {
    throw new AppError('Bạn chưa đặt PIN giao dịch. Vào Hồ sơ để đặt PIN', 400, { code: 'PIN_NOT_SET' });
  }

  if (state.pin_locked_until) {
    const until = new Date(state.pin_locked_until);
    if (until > new Date()) {
      const minutes = Math.ceil((until - new Date()) / 60000);
      throw new AppError(`PIN đang bị khóa, thử lại sau ${minutes} phút`, 429);
    }
    await userModel.resetPinFailures(userId); // hết thời gian khóa thì đếm lại từ đầu
  }

  if (!(await bcrypt.compare(pin, state.pin_hash))) {
    const r = await userModel.recordPinFailure(userId, PIN_MAX_ATTEMPTS, PIN_LOCK_MINUTES);
    if (r.pin_locked_until && new Date(r.pin_locked_until) > new Date()) {
      throw new AppError(`Nhập sai PIN quá ${PIN_MAX_ATTEMPTS} lần, PIN bị khóa ${PIN_LOCK_MINUTES} phút`, 429);
    }
    throw new AppError(`PIN không đúng. Còn ${PIN_MAX_ATTEMPTS - r.failed_pin_attempts} lần thử`, 400);
  }

  await userModel.resetPinFailures(userId);
}

// giao dịch lớn kiểm tra otp, trả về bản ghi để xóa trong transaction
async function checkLargeOtp(userId, amount, otp) {
  if (amount < LARGE_AMOUNT) return null;
  return accountService.checkActionOtp(userId, 'large_tx', otp);
}

async function findRecipient(userId, email) {
  const recipient = await userModel.findByEmail(email);
  if (!recipient || recipient.status !== 'active') {
    throw new AppError('Không tìm thấy người nhận', 404);
  }
  if (String(recipient.id) === String(userId)) {
    throw new AppError('Không thể chuyển tiền cho chính mình', 400);
  }
  return recipient;
}

// phần chuyển tiền thật nằm trong một transaction

async function execute({ userId, type, amount, note, key, recipientId, otpRecId }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1 tìm ví rồi KHÓA (theo thứ tự id tăng dần)
    const myWalletId = await walletModel.findIdByUserId(client, userId);
    const ids = [myWalletId];
    let otherWalletId = null;
    if (type === 'transfer') {
      otherWalletId = await walletModel.findIdByUserId(client, recipientId);
      ids.push(otherWalletId);
    }
    const locked = await walletModel.lockByIds(client, ids);
    const mine = locked.find((w) => String(w.id) === String(myWalletId));

    // 2 Hai request cùng key đến cùng lúc request sau thấy kết quả của request trước
    const dup = await transactionModel.findByIdempotency(userId, key, client);
    if (dup) {
      await client.query('ROLLBACK');
      return { transaction: dup, replayed: true };
    }

    // 3 Kiểm tra số dư trên dòng ĐÃ KHÓA (không ai sửa được nữa)
    if (type !== 'deposit' && Number(mine.balance) < amount) {
      throw new AppError('Số dư không đủ', 400);
    }

    // 4 Cập nhật số dư
    let fromId = null;
    let toId = null;
    let fromAfter = null;
    let toAfter = null;
    if (type === 'deposit') {
      toId = myWalletId;
      toAfter = await walletModel.addToBalance(client, toId, amount);
    } else if (type === 'withdraw') {
      fromId = myWalletId;
      fromAfter = await walletModel.addToBalance(client, fromId, -amount);
    } else {
      fromId = myWalletId;
      toId = otherWalletId;
      fromAfter = await walletModel.addToBalance(client, fromId, -amount);
      toAfter = await walletModel.addToBalance(client, toId, amount);
    }

    // 5 Ghi sổ cái
    const transaction = await transactionModel.insert(client, {
      referenceCode: generateReferenceCode(),
      type,
      amount,
      fromWalletId: fromId,
      toWalletId: toId,
      fromBalanceAfter: fromAfter,
      toBalanceAfter: toAfter,
      note: note || null,
      userId,
      idempotencyKey: key,
    });

    // 6 OTP chỉ dùng một lần xóa cùng lúc với giao dịch
    if (otpRecId) await actionOtpModel.remove(client, otpRecId);

    await client.query('COMMIT');
    return { transaction, replayed: false };
  } catch (err) {
    await client.query('ROLLBACK');

    // chốt chặn cuối của DB (đã lỡ lọt qua các kiểm tra trên)
    if (err.code === '23505' && err.constraint === 'tx_idempotency_unique') {
      const old = await transactionModel.findByIdempotency(userId, key);
      if (old) return { transaction: old, replayed: true };
    }
    if (err.code === '23514' && err.constraint === 'wallets_balance_non_negative') {
      throw new AppError('Số dư không đủ', 400);
    }
    throw err;
  } finally {
    client.release();
  }
}

// các hàm controller gọi

exports.deposit = async (userId, { amount, note, idempotencyKey }) => {
  checkAmount(amount);
  const replay = await findReplay(userId, 'deposit', amount, idempotencyKey);
  if (replay) return replay;

  return execute({ userId, type: 'deposit', amount, note, key: idempotencyKey });
};

exports.withdraw = async (userId, { amount, pin, otp, note, idempotencyKey }) => {
  checkAmount(amount);
  const replay = await findReplay(userId, 'withdraw', amount, idempotencyKey);
  if (replay) return replay;

  assertOtpProvided(amount, otp);
  await verifyPin(userId, pin);
  const otpRec = await checkLargeOtp(userId, amount, otp);

  return execute({
    userId, type: 'withdraw', amount, note, key: idempotencyKey,
    otpRecId: otpRec ? otpRec.id : null,
  });
};

exports.transfer = async (userId, { email, amount, pin, otp, note, idempotencyKey }) => {
  checkAmount(amount);
  const replay = await findReplay(userId, 'transfer', amount, idempotencyKey);
  if (replay) return replay;

  const recipient = await findRecipient(userId, email); // trước PIN: không tốn lượt thử PIN
  assertOtpProvided(amount, otp);
  await verifyPin(userId, pin);
  const otpRec = await checkLargeOtp(userId, amount, otp);

  return execute({
    userId, type: 'transfer', amount, note, key: idempotencyKey,
    recipientId: recipient.id,
    otpRecId: otpRec ? otpRec.id : null,
  });
};

exports.history = async (userId, { page, limit, type, from, to }) => {
  const wallet = await walletModel.findByUserId(userId);
  const filters = { type, from, to };
  const [items, total] = await Promise.all([
    transactionModel.listForWallet(wallet.id, filters, limit, (page - 1) * limit),
    transactionModel.countForWallet(wallet.id, filters),
  ]);
  return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
};