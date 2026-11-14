const accountService = require('../services/accountService');
const { formatVND } = require('../utils/money');
const txService = require('../services/transactionService');
const { describe } = require('../utils/txView');

exports.sendOtp = (action) => async (req, res) => {
  const { maskedPhone, devOtp } = await accountService.sendActionOtp(req.user.id, action);
  res.json({ success: true, message: `Đã gửi mã SMS tới số ${maskedPhone}`, data: { devOtp } });
};

exports.updateProfile = async (req, res) => {
  const profile = await accountService.updateProfile(req.user.id, req.body);
  res.json({ success: true, message: 'Đã cập nhật hồ sơ', data: { profile } });
};

exports.changePassword = async (req, res) => {
  await accountService.changePassword(req.user.id, req.body);
  res.json({ success: true, message: 'Đổi mật khẩu thành công' });
};

exports.setPin = async (req, res) => {
  await accountService.setPin(req.user.id, req.body);
  res.json({ success: true, message: 'Đã lưu PIN giao dịch' });
};

// dùng cho các trang render
exports.dashboardPage = async (req, res) => {
  const { balance } = await accountService.getOverview(req.user.id);
  const recent = await txService.history(req.user.id, { page: 1, limit: 5 });
  res.render('pages/dashboard', {
    title: 'Trang chủ',
    user: req.user,
    balanceText: formatVND(balance),
    recent: recent.items,
    formatVND,
    describe,
  });
};

exports.profilePage = async (req, res) => {
  const profile = await accountService.getProfile(req.user.id);
  res.render('pages/profile', {
    title: 'Tài khoản',
    profile,
    scripts: ['/js/profile.js'],
  });
};

exports.profilePage = async (req, res) => {
  const profile = await accountService.getProfile(req.user.id);

  // ngày sinh dạng 'yyyy-mm-dd'
  const dob = profile.date_of_birth instanceof Date
    ? profile.date_of_birth.toISOString().slice(0, 10)
    : profile.date_of_birth || '';

  res.render('pages/profile', {
    title: 'Tài khoản',
    profile,
    dob,
    joinYear: new Date(profile.created_at).getFullYear(),
    scripts: ['/js/profile.js'],
  });
};

exports.changePasswordPage = (req, res) => {
  res.render('pages/changePassword', {
    title: 'Đổi mật khẩu',
    scripts: ['/js/changePassword.js'],
  });
};