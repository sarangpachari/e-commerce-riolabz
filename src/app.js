require('express-async-errors');
const express = require('express'); const cors = require('cors'); const morgan = require('morgan'); const rateLimit = require('express-rate-limit'); const errorHandler = require('./middleware/errorHandler'); const AppError = require('./utils/AppError');
const app = express();
app.use(cors()); app.use(express.json({ limit: '1mb' })); app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many requests. Please try again later.' } }));
app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many authentication attempts. Please try again later.' } }));
app.get('/api/v1/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/v1/auth', require('./routes/authRoutes')); app.use('/api/v1/users', require('./routes/userRoutes')); app.use('/api/v1/categories', require('./routes/categoryRoutes')); app.use('/api/v1/products', require('./routes/productRoutes')); app.use('/api/v1/orders', require('./routes/orderRoutes'));
app.all('*', (req, res, next) => next(new AppError(`Route ${req.originalUrl} not found`, 404))); app.use(errorHandler); module.exports = app;
