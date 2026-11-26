const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: 'text' },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true, default: '' },
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, min: 0, default: null },
  stock: { type: Number, required: true, min: 0, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true }
}, { timestamps: true });

productSchema.index({ category: 1, status: 1, price: 1 });
productSchema.pre('validate', function validateSalePrice(next) {
  if (this.salePrice != null && this.salePrice > this.price) return next(new Error('salePrice cannot exceed price'));
  next();
});
module.exports = mongoose.model('Product', productSchema);
