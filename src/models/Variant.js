const mongoose = require('mongoose');

const bomEntrySchema = new mongoose.Schema({
  rawMaterial: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
  quantity:    { type: Number, required: true, min: 0 }
}, { _id: true });

const labourAllocationSchema = new mongoose.Schema({
  stageId:  { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 }
}, { _id: true });

const utilityAllocationSchema = new mongoose.Schema({
  utilityId: { type: String, required: true },
  quantity:  { type: Number, required: true, min: 0 }
}, { _id: true });

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  modelName: { type: String, trim: true, default: 'Default Model' },
  modelCode: { type: String, trim: true },
  variantCode: { type: String, trim: true, unique: true, sparse: true },
  sizes: { type: [Number], default: [] },
  bom: [bomEntrySchema],
  labourAllocations:  [labourAllocationSchema],
  utilityAllocations: [utilityAllocationSchema]
}, { timestamps: true });

module.exports = mongoose.model('Variant', variantSchema);
