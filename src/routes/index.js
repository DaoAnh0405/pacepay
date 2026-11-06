const router = require('express').Router();
const db = require('../config/db');
const { authLimiter } = require('../middlewares/rateLimiter');
const { requireAuth } = require('../middlewares/auth');

router.get('/', (req, res) => {
  res.render('pages/home', { title: 'Trang chủ' });
});

router.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(500).json({ status: 'db_error' });
  }
});

// trang giao diện
router.get('/register', (req, res) =>
  res.render('pages/register', { title: 'Đăng ký', scripts: ['/js/register.js'] }),
);
router.get('/login', (req, res) => res.render('pages/login', { title: 'Đăng nhập' }));
router.get('/forgot-password', (req, res) =>
  res.render('pages/forgotPassword', { title: 'Quên mật khẩu', scripts: ['/js/forgotPassword.js'] }),
);
router.get('/dashboard', requireAuth, (req, res) => {
  res.render('pages/dashboard', { title: 'Tổng quan', user: req.user });
});

// API có giới hạn tần suất
router.use('/api/auth', authLimiter, require('./authRoutes'));
router.use('/api/register', authLimiter, require('./registerRoutes'));
router.use('/api/password', authLimiter, require('./passwordRoutes'));

module.exports = router;