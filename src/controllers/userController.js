const { param, body } = require('express-validator');
const User = require('../models/User');
const AppError = require('../utils/AppError');
exports.idValidation = [param('id').isMongoId().withMessage('Invalid user id')];
exports.statusValidation = [body('isActive').isBoolean().withMessage('isActive must be boolean')];
exports.list = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1); const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = req.query.role ? { role: req.query.role } : {};
  const [users, total] = await Promise.all([User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit), User.countDocuments(filter)]);
  res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};
exports.setStatus = async (req, res) => {
  if (req.params.id === String(req.user._id)) throw new AppError('You cannot change your own account status', 400);
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404);
  res.json({ user });
};
