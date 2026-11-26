const { body, param } = require('express-validator');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
exports.createValidation = [body('items').isArray({ min: 1 }).withMessage('items must contain at least one item'), body('items.*.product').isMongoId(), body('items.*.quantity').isInt({ min: 1 })];
exports.statusValidation = [param('id').isMongoId(), body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])];
exports.create = async (req, res) => {
  const quantities = new Map();
  for (const item of req.body.items) { const id = String(item.product); quantities.set(id, (quantities.get(id) || 0) + item.quantity); }
  const ids = [...quantities.keys()]; const products = await Product.find({ _id: { $in: ids }, status: 'active' });
  if (products.length !== ids.length) throw new AppError('One or more products are unavailable', 400);
  const byId = new Map(products.map((p) => [String(p._id), p])); const decremented = [];
  try {
    for (const [id, quantity] of quantities) {
      const updated = await Product.findOneAndUpdate({ _id: id, status: 'active', stock: { $gte: quantity } }, { $inc: { stock: -quantity } }, { new: true });
      if (!updated) throw new AppError(`Insufficient stock for ${byId.get(id).name}`, 409);
      decremented.push({ id, quantity });
    }
    const items = [...quantities].map(([id, quantity]) => { const product = byId.get(id); const unitPrice = product.salePrice ?? product.price; return { product: product._id, name: product.name, sku: product.sku, unitPrice, quantity, lineTotal: unitPrice * quantity }; });
    const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const order = await Order.create({ customer: req.user._id, items, totalAmount });
    res.status(201).json({ order });
  } catch (error) {
    await Promise.all(decremented.map(({ id, quantity }) => Product.updateOne({ _id: id }, { $inc: { stock: quantity } })));
    throw error;
  }
};
exports.list = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1); const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = req.user.role === 'admin' ? {} : { customer: req.user._id }; if (req.query.status) filter.status = req.query.status;
  const [orders, total] = await Promise.all([Order.find(filter).populate('customer', 'name email').sort('-createdAt').skip((page - 1) * limit).limit(limit), Order.countDocuments(filter)]);
  res.json({ orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};
exports.updateStatus = async (req, res) => {
  const order = await Order.findById(req.params.id); if (!order) throw new AppError('Order not found', 404);
  const allowed = { pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };
  if (!allowed[order.status].includes(req.body.status)) throw new AppError(`Cannot change ${order.status} order to ${req.body.status}`, 400);
  if (req.body.status === 'cancelled') await Promise.all(order.items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })));
  order.status = req.body.status; await order.save(); res.json({ order });
};
