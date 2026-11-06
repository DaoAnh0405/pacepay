const config = require('../config/env');
const registerService = require('../services/registerService');

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProd,
  path: '/api/register',
};

exports.start = async (req, res) => {
  const { token, devOtp } = await registerService.start(req.body.email);
  res.cookie('reg_token', token, { ...COOKIE_OPTIONS, maxAge: 30 * 60 * 1000 });
  res.json({ success: true, message: 'Đã gửi mã xác thực tới email của bạn', data: { devOtp } });
};

exports.resendEmail = async (req, res) => {
  const { devOtp } = await registerService.resendEmailOtp(req.registration);
  res.json({ success: true, message: 'Đã gửi lại mã tới email', data: { devOtp } });
};

exports.verifyEmail = async (req, res) => {
  await registerService.verifyEmail(req.registration, req.body.otp);
  res.json({ success: true, message: 'Xác thực email thành công' });
};

exports.sendPhoneOtp = async (req, res) => {
  const { devOtp } = await registerService.sendPhoneOtp(req.registration, req.body.phone);
  res.json({ success: true, message: 'Đã gửi mã xác thực tới số điện thoại', data: { devOtp } });
};

exports.verifyPhone = async (req, res) => {
  await registerService.verifyPhone(req.registration, req.body.otp);
  res.json({ success: true, message: 'Xác thực số điện thoại thành công' });
};

exports.complete = async (req, res) => {
  const user = await registerService.complete(req.registration, req.body);
  res.clearCookie('reg_token', COOKIE_OPTIONS);
  res.status(201).json({ success: true, message: 'Đăng ký thành công', data: { user } });
};