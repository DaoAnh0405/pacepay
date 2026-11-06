const router = require('express').Router();
const validate = require('../middlewares/validate');
const { requireRegistration } = require('../middlewares/registration');
const {
  emailSchema, phoneSchema, otpSchema, completeSchema,
} = require('../validators/registerValidator');
const ctrl = require('../controllers/registerController');

router.post('/email', validate(emailSchema), ctrl.start);
router.post('/resend-email', requireRegistration, ctrl.resendEmail);
router.post('/verify-email', requireRegistration, validate(otpSchema), ctrl.verifyEmail);
router.post('/phone', requireRegistration, validate(phoneSchema), ctrl.sendPhoneOtp);
router.post('/verify-phone', requireRegistration, validate(otpSchema), ctrl.verifyPhone);
router.post('/complete', requireRegistration, validate(completeSchema), ctrl.complete);

module.exports = router;