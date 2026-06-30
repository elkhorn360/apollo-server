const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['leather', 'sole', 'adhesives', 'spray', 'threads', 'packing_accessories', 'other'],
    lowercase: true
  },
  name:     { type: String, required: true, trim: true },
  unit:     { type: String, required: true, trim: true },   // e.g. sq_ft, pairs, g, ml, m
  unitCost: { type: Number, required: true, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
