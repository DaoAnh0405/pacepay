const Joi = require('joi');

exports.emailSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(255).required()
    .messages({
      'string.empty': 'Vui lòng nhập email',
      'string.email': 'Email không hợp lệ',
      'any.required': 'Vui lòng nhập email',
    }),
});

exports.phoneSchema = Joi.object({
  phone: Joi.string().trim().pattern(/^0[35789]\d{8}$/).required()
    .messages({
      'string.empty': 'Vui lòng nhập số điện thoại',
      'string.pattern.base': 'Số điện thoại không hợp lệ (ví dụ 0912345678)',
      'any.required': 'Vui lòng nhập số điện thoại',
    }),
});

exports.otpSchema = Joi.object({
  otp: Joi.string().trim().pattern(/^\d{6}$/).required()
    .messages({
      'string.empty': 'Vui lòng nhập mã xác thực',
      'string.pattern.base': 'Mã xác thực gồm 6 chữ số',
      'any.required': 'Vui lòng nhập mã xác thực',
    }),
});

exports.completeSchema = Joi.object({
  password: Joi.string().min(8).max(72).required()
    .messages({
      'string.empty': 'Vui lòng nhập mật khẩu',
      'string.min': 'Mật khẩu tối thiểu 8 ký tự',
      'string.max': 'Mật khẩu tối đa 72 ký tự',
      'any.required': 'Vui lòng nhập mật khẩu',
    }),
  fullName: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.empty': 'Vui lòng nhập họ tên',
      'string.min': 'Họ tên tối thiểu 2 ký tự',
      'any.required': 'Vui lòng nhập họ tên',
    }),
  dateOfBirth: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('', null)
    .custom((value, helpers) => {
      const d = new Date(value);
      if (Number.isNaN(d.getTime()) || d > new Date() || d.getFullYear() < 1900) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .messages({
      'string.pattern.base': 'Ngày sinh không hợp lệ',
      'any.invalid': 'Ngày sinh không hợp lệ',
    }),
  address: Joi.string().trim().max(255).allow('', null),
});