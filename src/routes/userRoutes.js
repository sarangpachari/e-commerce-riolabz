const router = require('express').Router(); const c = require('../controllers/userController'); const validate = require('../middleware/validate'); const { protect, authorize } = require('../middleware/auth');
router.use(protect, authorize('admin')); router.get('/', c.list); router.patch('/:id/status', c.idValidation, c.statusValidation, validate, c.setStatus); module.exports = router;
