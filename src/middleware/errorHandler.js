const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid resource id' });
  if (err.code === 11000) return res.status(409).json({ message: 'A record with this value already exists' });
  if (err.name === 'ValidationError') return res.status(422).json({ message: err.message });
  res.status(err.statusCode || 500).json({ message: err.isOperational ? err.message : 'Internal server error' });
};
module.exports = errorHandler;
