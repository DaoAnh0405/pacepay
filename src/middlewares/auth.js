const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const userModel = require('../models/userModel');

exports.requireAuth = async (req, res, next) => {
  // API thì báo lỗi 401, trang web thì chuyển về /login
  const fail = () =>
    req.originalUrl.startsWith('/api')
      ? next(new AppError('Bạn chưa đăng nhập', 401))
      : res.redirect('/login');

  const token = req.cookies.token;
  if (!token) return fail();

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret);
  } catch {
    return fail(); // token sai hoặc hết hạn
  }

  // nạp lại user từ DB: user bị khóa/xóa thì token cũ cũng vô hiệu
  const user = await userModel.findById(payload.id);
  if (!user || user.status !== 'active') return fail();

  req.user = user;
  next();
};