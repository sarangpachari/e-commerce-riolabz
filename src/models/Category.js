const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

categorySchema.index({ parent: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('Category', categorySchema);
