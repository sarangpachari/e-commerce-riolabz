const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(errors.array().map((e) => e.msg).join(', '), 422));
  next();
};
