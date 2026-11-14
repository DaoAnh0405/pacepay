const router = require('express').Router();
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/accountController');
const {
  profileSchema, changePasswordSchema, setPinSchema,
} = require('../validators/accountValidator');

router.put('/profile', validate(profileSchema), ctrl.updateProfile);

router.post('/password/otp', ctrl.sendOtp('change_password'));
router.post('/password', validate(changePasswordSchema), ctrl.changePassword);

router.post('/pin/otp', ctrl.sendOtp('set_pin'));
router.post('/pin', validate(setPinSchema), ctrl.setPin);

module.exports = router;