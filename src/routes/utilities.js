const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UtilityConfig = require('../models/UtilityConfig');

router.use(auth);

const DEFAULT_RATES = [
  { utilityId: 'electricity', name: 'Electricity (kWh)',      unitCost: 0.15 },
  { utilityId: 'water',       name: 'Water (100L)',            unitCost: 0.50 },
  { utilityId: 'steam',       name: 'Steam (kg)',              unitCost: 0.25 },
  { utilityId: 'air',         name: 'Compressed Air (CFM)',   unitCost: 0.10 }
];

async function getOrCreate() {
  let config = await UtilityConfig.findOne();
  if (!config) config = await UtilityConfig.create({ rates: DEFAULT_RATES });
  return config;
}

// GET /api/utilities
router.get('/', async (req, res) => {
  try {
    const config = await getOrCreate();
    res.json(config.rates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/utilities  – replace all rates
router.put('/', async (req, res) => {
  try {
    const { rates } = req.body;
    if (!Array.isArray(rates)) return res.status(400).json({ message: 'rates must be an array' });

    let config = await UtilityConfig.findOne();
    if (!config) config = new UtilityConfig();
    config.rates = rates;
    await config.save();
    res.json(config.rates);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/utilities/:utilityId  – update single utility rate
router.patch('/:utilityId', async (req, res) => {
  try {
    const config = await getOrCreate();
    const rate = config.rates.find(r => r.utilityId === req.params.utilityId);
    if (!rate) return res.status(404).json({ message: 'Utility not found' });

    if (req.body.unitCost !== undefined) rate.unitCost = req.body.unitCost;
    if (req.body.name    !== undefined) rate.name     = req.body.name;

    await config.save();
    res.json(config.rates);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
