const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ManpowerConfig = require('../models/ManpowerConfig');

router.use(auth);

const DEFAULT_RATES = [
  { stageId: 'topCut',      name: 'Top Cut',                 unitCost: 5.00 },
  { stageId: 'topFinish',   name: 'Top Finish',              unitCost: 4.50 },
  { stageId: 'mount',       name: 'Mount',                   unitCost: 6.00 },
  { stageId: 'sole',        name: 'Sole',                    unitCost: 5.50 },
  { stageId: 'sockline',    name: 'Sockline / Insole / Steep', unitCost: 4.00 },
  { stageId: 'sprayFinish', name: 'Spray Finish',            unitCost: 4.50 }
];

// Helper – get singleton (create default if missing)
async function getOrCreate() {
  let config = await ManpowerConfig.findOne();
  if (!config) config = await ManpowerConfig.create({ rates: DEFAULT_RATES });
  return config;
}

// GET /api/manpower
router.get('/', async (req, res) => {
  try {
    const config = await getOrCreate();
    res.json(config.rates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/manpower  – replace all rates (array)
router.put('/', async (req, res) => {
  try {
    const { rates } = req.body;
    if (!Array.isArray(rates)) return res.status(400).json({ message: 'rates must be an array' });

    let config = await ManpowerConfig.findOne();
    if (!config) config = new ManpowerConfig();
    config.rates = rates;
    await config.save();
    res.json(config.rates);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/manpower/:stageId  – update a single stage rate
router.patch('/:stageId', async (req, res) => {
  try {
    const config = await getOrCreate();
    const rate = config.rates.find(r => r.stageId === req.params.stageId);
    if (!rate) return res.status(404).json({ message: 'Stage not found' });

    if (req.body.unitCost !== undefined) rate.unitCost = req.body.unitCost;
    if (req.body.name    !== undefined) rate.name     = req.body.name;

    await config.save();
    res.json(config.rates);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
