const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  size: { type: String, required: true, trim: true },
  multiplier: { type: Number, required: true, default: 1.0 },
  modelCode: { type: String, trim: true, required: true },
  variantCode: { type: String, trim: true, required: true }
}, { timestamps: true });

sizeSchema.index({ size: 1, modelCode: 1, variantCode: 1 }, { unique: true });

module.exports = mongoose.model('Size', sizeSchema);
