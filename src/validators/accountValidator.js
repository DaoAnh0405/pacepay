const Joi = require('joi');

const otp = Joi.string().trim().pattern(/^\d{6}$/).required().messages({
  'any.required': 'Vui lòng nhập mã xác thực',
  'string.empty': 'Vui lòng nhập mã xác thực',
  'string.pattern.base': 'Mã xác thực gồm 6 chữ số',
});

exports.profileSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Vui lòng nhập họ tên',
    'string.empty': 'Vui lòng nhập họ tên',
    'string.min': 'Họ tên tối thiểu 2 ký tự',
  }),
  dateOfBirth: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('', null)
    .custom((value, helpers) => {
      if (!value) return value;
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

exports.otpSchema = Joi.object({ otp });

exports.changePasswordSchema = Joi.object({
  otp,
  currentPassword: Joi.string().required().messages({
    'any.required': 'Vui lòng nhập mật khẩu hiện tại',
    'string.empty': 'Vui lòng nhập mật khẩu hiện tại',
  }),
  newPassword: Joi.string().min(8).max(72).required().messages({
    'any.required': 'Vui lòng nhập mật khẩu mới',
    'string.empty': 'Vui lòng nhập mật khẩu mới',
    'string.min': 'Mật khẩu mới tối thiểu 8 ký tự',
    'string.max': 'Mật khẩu mới tối đa 72 ký tự',
  }),
});

exports.setPinSchema = Joi.object({
  otp,
  pin: Joi.string().pattern(/^\d{6}$/).required().messages({
    'any.required': 'Vui lòng nhập PIN',
    'string.empty': 'Vui lòng nhập PIN',
    'string.pattern.base': 'PIN gồm đúng 6 chữ số',
  }),
});