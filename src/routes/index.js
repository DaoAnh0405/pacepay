const router = require('express').Router();
const db = require('../config/db');
const { authLimiter } = require('../middlewares/rateLimiter');
const { requireAuth } = require('../middlewares/auth');
const accountController = require('../controllers/accountController');
const { transferLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const { historyQuerySchema } = require('../validators/transactionValidator');
const transactionController = require('../controllers/transactionController');

router.get('/', (req, res) => {
  res.render('pages/home', { title: 'Trang chủ' });
});
// trang giao diện
router.get('/register', (req, res) =>
  res.render('pages/register', { title: 'Đăng ký', scripts: ['/js/register.js'] }),
);
router.get('/login', (req, res) => res.render('pages/login', { title: 'Đăng nhập' }));
router.get('/forgot-password', (req, res) =>
  res.render('pages/forgotPassword', { title: 'Quên mật khẩu', scripts: ['/js/forgotPassword.js'] }),
);
router.get('/dashboard', requireAuth, accountController.dashboardPage);
router.get('/profile', requireAuth, accountController.profilePage);
router.get('/change-password', requireAuth, accountController.changePasswordPage);
router.get('/deposit', requireAuth, (req, res) =>
  res.render('pages/deposit', { title: 'Nạp tiền', scripts: ['/js/money.js'] }));
router.get('/withdraw', requireAuth, (req, res) =>
  res.render('pages/withdraw', { title: 'Rút tiền', scripts: ['/js/money.js'] }));
router.get('/transfer', requireAuth, (req, res) =>
  res.render('pages/transfer', { title: 'Chuyển tiền', scripts: ['/js/money.js'] }));
router.get('/transactions', requireAuth, validate(historyQuerySchema, 'query'),
  transactionController.historyPage);

// API có giới hạn tần suất
router.use('/api/auth', authLimiter, require('./authRoutes'));
router.use('/api/register', authLimiter, require('./registerRoutes'));
router.use('/api/password', authLimiter, require('./passwordRoutes'));

// API tài khoản bắt buộc đăng nhập, có giới hạn tần suất
router.use('/api/account', requireAuth, authLimiter, require('./accountRoutes'));

// API giao dịch bắt buộc đăng nhập + giới hạn 10 lần/phút
router.use('/api/transactions', requireAuth, transferLimiter, require('./transactionRoutes'));

module.exports = router;