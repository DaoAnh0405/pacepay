const router = require('express').Router();
const validate = require('../middlewares/validate');
const accountController = require('../controllers/accountController');
const ctrl = require('../controllers/transactionController');
const {
  depositSchema, withdrawSchema, transferSchema,
} = require('../validators/transactionValidator');

// gửi OTP SMS cho giao dịch lớn
router.post('/otp', accountController.sendOtp('large_tx'));

router.post('/deposit', validate(depositSchema), ctrl.deposit);
router.post('/withdraw', validate(withdrawSchema), ctrl.withdraw);
router.post('/transfer', validate(transferSchema), ctrl.transfer);

module.exports = router;