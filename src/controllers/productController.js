const { body, param, query } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const { descendantIds } = require('./categoryController');
exports.createValidation = [body('name').trim().notEmpty(), body('sku').trim().notEmpty(), body('price').isFloat({ min: 0 }), body('salePrice').optional({ nullable: true }).isFloat({ min: 0 }), body('stock').isInt({ min: 0 }), body('category').isMongoId(), body('status').optional().isIn(['active', 'inactive'])];
exports.updateValidation = [body('name').optional().trim().notEmpty(), body('sku').optional().trim().notEmpty(), body('price').optional().isFloat({ min: 0 }), body('salePrice').optional({ nullable: true }).isFloat({ min: 0 }), body('stock').optional().isInt({ min: 0 }), body('category').optional().isMongoId(), body('status').optional().isIn(['active', 'inactive'])];
exports.idValidation = [param('id').isMongoId()];
exports.listValidation = [query('category').optional().isMongoId(), query('minPrice').optional().isFloat({ min: 0 }), query('maxPrice').optional().isFloat({ min: 0 }), query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 })];
async function ensureCategory(id) { const c = await Category.findById(id); if (!c) throw new AppError('Category not found', 404); return c; }
exports.create = async (req, res) => { await ensureCategory(req.body.category); const product = await Product.create(req.body); res.status(201).json({ product }); };
exports.update = async (req, res) => { if (req.body.category) await ensureCategory(req.body.category); const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!product) throw new AppError('Product not found', 404); res.json({ product }); };
exports.remove = async (req, res) => { const product = await Product.findByIdAndDelete(req.params.id); if (!product) throw new AppError('Product not found', 404); res.status(204).send(); };
exports.list = async (req, res) => {
  const filter = req.user?.role === 'admin' && req.query.includeInactive === 'true' ? {} : { status: 'active' };
  if (req.query.search) filter.$text = { $search: req.query.search };
  if (req.query.category) filter.category = { $in: await descendantIds(req.query.category) };
  if (req.query.minPrice || req.query.maxPrice) { filter.price = {}; if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice); if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice); }
  const page = Number(req.query.page) || 1; const limit = Math.min(Number(req.query.limit) || 20, 100);
  const sortOptions = { newest: '-createdAt', price_asc: 'price', price_desc: '-price', name: 'name' }; const sort = sortOptions[req.query.sort] || '-createdAt';
  const [products, total] = await Promise.all([Product.find(filter).populate('category', 'name').sort(sort).skip((page - 1) * limit).limit(limit), Product.countDocuments(filter)]);
  res.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};
