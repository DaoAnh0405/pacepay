const router = require('express').Router();
const validate = require('../middlewares/validate');
const { loginSchema } = require('../validators/authValidator');
const authController = require('../controllers/authController');

router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

module.exports = router;