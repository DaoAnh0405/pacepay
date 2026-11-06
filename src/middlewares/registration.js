const AppError = require('../utils/AppError');
const { sha256 } = require('../utils/hash');
const registrationModel = require('../models/registrationModel');

exports.requireRegistration = async (req, res, next) => {
  const token = req.cookies.reg_token;
  const reg = token ? await registrationModel.findByTokenHash(sha256(token)) : null;

  if (!reg) {
    return next(new AppError('Phiên đăng ký đã hết hạn, vui lòng bắt đầu lại', 401));
  }
  req.registration = reg;
  next();
};