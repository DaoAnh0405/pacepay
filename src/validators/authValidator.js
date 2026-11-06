const Joi = require('joi');

exports.loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required()
    .messages({
      'any.required': 'Vui lòng nhập email',
      'string.empty': 'Vui lòng nhập email',
      'string.email': 'Email không hợp lệ',
    }),
  password: Joi.string().required()
    .messages({
      'any.required': 'Vui lòng nhập mật khẩu',
      'string.empty': 'Vui lòng nhập mật khẩu',
    }),
});