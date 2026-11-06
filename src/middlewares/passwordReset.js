const AppError = require('../utils/AppError');
const { sha256 } = require('../utils/hash');
const passwordResetModel = require('../models/passwordResetModel');

exports.requireReset = async (req, res, next) => {
  const token = req.cookies.reset_token;
  const reset = token ? await passwordResetModel.findByTokenHash(sha256(token)) : null;

  if (!reset) {
    return next(new AppError('Phiên đã hết hạn, vui lòng thử lại từ đầu', 401));
  }
  req.passwordReset = reset;
  next();
};