const { body, param } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

exports.createValidation = [body('name').trim().notEmpty().withMessage('Name is required'), body('parent').optional({ nullable: true }).isMongoId().withMessage('parent must be a valid category id'), body('description').optional().trim(), body('isActive').optional().isBoolean()];
exports.updateValidation = [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'), body('parent').optional({ nullable: true }).isMongoId().withMessage('parent must be a valid category id'), body('description').optional().trim(), body('isActive').optional().isBoolean()];
exports.idValidation = [param('id').isMongoId().withMessage('Invalid category id')];
async function assertValidParent(parentId, currentId) {
  if (!parentId) return;
  if (String(parentId) === String(currentId)) throw new AppError('A category cannot be its own parent', 400);
  let node = await Category.findById(parentId).select('parent');
  if (!node) throw new AppError('Parent category not found', 404);
  const seen = new Set();
  while (node) {
    const id = String(node._id);
    if (id === String(currentId)) throw new AppError('This parent would create a circular category relationship', 400);
    if (seen.has(id)) throw new AppError('Category hierarchy is corrupted', 400);
    seen.add(id); node = node.parent ? await Category.findById(node.parent).select('parent') : null;
  }
}
exports.create = async (req, res) => {
  await assertValidParent(req.body.parent);
  const category = await Category.create(req.body);
  res.status(201).json({ category });
};
exports.list = async (req, res) => res.json({ categories: await Category.find().populate('parent', 'name').sort('name') });
exports.tree = async (req, res) => {
  const categories = await Category.find().lean();
  const map = new Map(categories.map((c) => [String(c._id), { ...c, children: [] }])); const roots = [];
  for (const category of map.values()) {
    if (category.parent && map.has(String(category.parent))) map.get(String(category.parent)).children.push(category);
    else roots.push(category);
  }
  res.json({ categories: roots });
};
exports.update = async (req, res) => {
  const category = await Category.findById(req.params.id); if (!category) throw new AppError('Category not found', 404);
  if (Object.prototype.hasOwnProperty.call(req.body, 'parent')) await assertValidParent(req.body.parent, category._id);
  Object.assign(category, req.body); await category.save(); res.json({ category });
};
exports.remove = async (req, res) => {
  const category = await Category.findById(req.params.id); if (!category) throw new AppError('Category not found', 404);
  const [children, products] = await Promise.all([Category.exists({ parent: category._id }), Product.exists({ category: category._id })]);
  if (children) throw new AppError('Cannot delete a category that has child categories', 409);
  if (products) throw new AppError('Cannot delete a category that has products', 409);
  await category.deleteOne(); res.status(204).send();
};
exports.descendantIds = async (rootId) => {
  const ids = [rootId]; let frontier = [rootId];
  while (frontier.length) { const children = await Category.find({ parent: { $in: frontier } }).select('_id'); frontier = children.map((c) => c._id); ids.push(...frontier); }
  return ids;
};
