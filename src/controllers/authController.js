const { body } = require('express-validator');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const signToken = require('../utils/token');

exports.registerValidation = [body('name').trim().notEmpty().withMessage('Name is required'), body('email').isEmail().withMessage('A valid email is required'), body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')];
exports.loginValidation = [body('email').isEmail(), body('password').notEmpty()];
exports.register = async (req, res) => {
  const exists = await User.exists({ email: req.body.email.toLowerCase() });
  if (exists) throw new AppError('Email is already registered', 409);
  const user = await User.create({ name: req.body.name, email: req.body.email, password: req.body.password });
  res.status(201).json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};
exports.login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('This account is deactivated', 403);
  res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};
exports.profile = async (req, res) => res.json({ user: req.user });
