const Joi = require('joi');

const idempotencyKey = Joi.string().pattern(/^[A-Za-z0-9-]{16,64}$/).required().messages({
  'any.required': 'Thiếu mã giao dịch, vui lòng tải lại trang',
  'string.empty': 'Thiếu mã giao dịch, vui lòng tải lại trang',
  'string.pattern.base': 'Mã giao dịch không hợp lệ, vui lòng tải lại trang',
});

const amount = Joi.number().integer().required().messages({
  'any.required': 'Vui lòng nhập số tiền',
  'number.base': 'Số tiền không hợp lệ',
  'number.integer': 'Số tiền phải là số nguyên',
  'number.unsafe': 'Số tiền không hợp lệ',
});

const pin = Joi.string().pattern(/^\d{6}$/).required().messages({
  'any.required': 'Vui lòng nhập PIN',
  'string.empty': 'Vui lòng nhập PIN',
  'string.pattern.base': 'PIN gồm đúng 6 chữ số',
});

const otp = Joi.string().trim().pattern(/^\d{6}$/).messages({
  'string.pattern.base': 'Mã xác nhận gồm 6 chữ số',
});

const note = Joi.string().trim().max(255).allow('', null);

exports.depositSchema = Joi.object({ amount, note, idempotencyKey });

exports.withdrawSchema = Joi.object({ amount, pin, otp, note, idempotencyKey });

exports.transferSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required().messages({
    'any.required': 'Vui lòng nhập email người nhận',
    'string.empty': 'Vui lòng nhập email người nhận',
    'string.email': 'Email người nhận không hợp lệ',
  }),
  amount,
  pin,
  otp,
  note,
  idempotencyKey,
});

// kiểm tra chuỗi ngày yyyy-mm-dd có thật
const dateString = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).empty('')
  .custom((value, helpers) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) {
      return helpers.error('any.invalid');
    }
    return value;
  })
  .messages({ 'string.pattern.base': 'Ngày không hợp lệ', 'any.invalid': 'Ngày không hợp lệ' });

exports.historyQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  type: Joi.string().valid('deposit', 'withdraw', 'transfer').empty(''),
  from: dateString,
  to: dateString,
});