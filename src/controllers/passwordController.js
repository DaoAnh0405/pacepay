const config = require('../config/env');
const passwordService = require('../services/passwordService');

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.cookieSecure,
  path: '/api/password',
};

exports.forgot = async (req, res) => {
  const { token, devOtp } = await passwordService.forgot(req.body.email);
  res.cookie('reset_token', token, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  res.json({
    success: true,
    message: 'Đã gửi mã xác thực tới email của bạn',
    data: { devOtp },
  });
};

exports.verifyEmail = async (req, res) => {
  const { maskedPhone, devOtp } = await passwordService.verifyEmail(req.passwordReset, req.body.otp);
  res.json({
    success: true,
    message: `Đã gửi mã SMS tới số ${maskedPhone}`,
    data: { devOtp },
  });
};

exports.verifyPhone = async (req, res) => {
  await passwordService.verifyPhone(req.passwordReset, req.body.otp);
  res.json({ success: true, message: 'Xác thực số điện thoại thành công' });
};

exports.reset = async (req, res) => {
  await passwordService.reset(req.passwordReset, req.body.password);
  res.clearCookie('reset_token', COOKIE_OPTIONS);
  res.json({ success: true, message: 'Đổi mật khẩu thành công' });
};