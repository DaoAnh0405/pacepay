const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const config = require('../config/env');
const AppError = require('../utils/AppError');
const userModel = require('../models/userModel');

exports.login = async ({ email, password }) => {
  const user = await userModel.findByEmail(email);

  // Sai email hoặc sai mật khẩu đều trả CÙNG một thông báo
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }
  if (user.status === 'locked') {
    throw new AppError('Tài khoản đã bị khóa', 403);
  }

  const token = jwt.sign({ id: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  return {
    token,
    user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
  };
};