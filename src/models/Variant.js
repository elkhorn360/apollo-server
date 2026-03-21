const mongoose = require('mongoose');

const bomEntrySchema = new mongoose.Schema({
  rawMaterial: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
  quantity:    { type: Number, required: true, min: 0 }
}, { _id: true });

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  bom: [bomEntrySchema],
  labourAllocations:  { type: Map, of: Number, default: {} },
  utilityAllocations: { type: Map, of: Number, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Variant', variantSchema);
