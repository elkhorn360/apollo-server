const mongoose = require('mongoose');

/**
 * Stores global manpower rates (one document – singleton pattern).
 * rates: [{ stageId, name, unitCost }]
 */
const manpowerRateItemSchema = new mongoose.Schema({
  stageId:  { type: String, required: true },
  name:     { type: String, required: true },
  unitCost: { type: Number, required: true, min: 0 }
}, { _id: false });

const manpowerConfigSchema = new mongoose.Schema({
  rates: [manpowerRateItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('ManpowerConfig', manpowerConfigSchema);
