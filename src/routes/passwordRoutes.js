const router = require('express').Router();
const validate = require('../middlewares/validate');
const { requireReset } = require('../middlewares/passwordReset');
const { forgotSchema, verifySchema, resetSchema } = require('../validators/passwordValidator');
const ctrl = require('../controllers/passwordController');

router.post('/forgot', validate(forgotSchema), ctrl.forgot);
router.post('/verify-email', requireReset, validate(verifySchema), ctrl.verifyEmail);
router.post('/verify-phone', requireReset, validate(verifySchema), ctrl.verifyPhone);
router.post('/reset', requireReset, validate(resetSchema), ctrl.reset);

module.exports = router;