const router = require('express').Router(); const c = require('../controllers/authController'); const validate = require('../middleware/validate'); const { protect } = require('../middleware/auth');
router.post('/register', c.registerValidation, validate, c.register); router.post('/login', c.loginValidation, validate, c.login); router.get('/me', protect, c.profile);
module.exports = router;
