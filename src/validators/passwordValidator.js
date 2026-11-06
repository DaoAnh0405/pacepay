const Joi = require('joi');

exports.forgotSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required()
    .messages({
      'any.required': 'Vui lòng nhập email',
      'string.empty': 'Vui lòng nhập email',
      'string.email': 'Email không hợp lệ',
    }),
});

exports.verifySchema = Joi.object({
  otp: Joi.string().trim().pattern(/^\d{6}$/).required()
    .messages({
      'any.required': 'Vui lòng nhập mã xác thực',
      'string.empty': 'Vui lòng nhập mã xác thực',
      'string.pattern.base': 'Mã xác thực gồm 6 chữ số',
    }),
});

exports.resetSchema = Joi.object({
  password: Joi.string().min(8).max(72).required()
    .messages({
      'any.required': 'Vui lòng nhập mật khẩu mới',
      'string.empty': 'Vui lòng nhập mật khẩu mới',
      'string.min': 'Mật khẩu tối thiểu 8 ký tự',
      'string.max': 'Mật khẩu tối đa 72 ký tự',
    }),
});