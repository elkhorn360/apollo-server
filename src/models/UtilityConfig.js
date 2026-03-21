const mongoose = require('mongoose');

/**
 * Stores global utility rates (one document – singleton pattern).
 * rates: [{ utilityId, name, unitCost }]
 */
const utilityRateItemSchema = new mongoose.Schema({
  utilityId: { type: String, required: true },
  name:      { type: String, required: true },
  unitCost:  { type: Number, required: true, min: 0 }
}, { _id: false });

const utilityConfigSchema = new mongoose.Schema({
  rates: [utilityRateItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('UtilityConfig', utilityConfigSchema);
