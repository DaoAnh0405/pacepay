const AppError = require('./AppError');

const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 50000000;//hạn mức

// định dạng 50000 -> "50.000 ₫", pg trả BIGINT dạng chuỗi nên ép sang số trước
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(amount));
}

// kiểm tra số tiền hợp lệ, sai thì ném lỗi 400
function checkAmount(amount) {
  if (!Number.isInteger(amount)) {
    throw new AppError('Số tiền phải là số nguyên', 400);
  }
  if (amount < MIN_AMOUNT) {
    throw new AppError(`Số tiền tối thiểu là ${formatVND(MIN_AMOUNT)}`, 400);
  }
  if (amount > MAX_AMOUNT) {
    throw new AppError(`Số tiền tối đa mỗi lần là ${formatVND(MAX_AMOUNT)}`, 400);
  }
}

module.exports = { MIN_AMOUNT, MAX_AMOUNT, formatVND, checkAmount };