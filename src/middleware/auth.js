const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

exports.protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next(new AppError('Authentication required', 401));
  let decoded;
  try { decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET); }
  catch (_) { return next(new AppError('Invalid or expired token', 401)); }
  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError('User no longer exists', 401));
  if (!user.isActive) return next(new AppError('This account is deactivated', 403));
  req.user = user;
  next();
};
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new AppError('You are not authorized for this action', 403));
  next();
};
