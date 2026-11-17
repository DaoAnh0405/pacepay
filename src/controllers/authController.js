const config = require('../config/env');
const authService = require('../services/authService');

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.cookieSecure,
};

exports.login = async (req, res) => {
  const { token, user } = await authService.login(req.body);
  res.cookie('token', token, { ...COOKIE_OPTIONS, maxAge: 24 * 60 * 60 * 1000 });
  res.json({ success: true, message: 'Đăng nhập thành công', data: { user } });
};

exports.logout = (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ success: true, message: 'Đã đăng xuất' });
};