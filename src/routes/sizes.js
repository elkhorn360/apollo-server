const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Size = require('../models/Size');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    let sizes = await Size.find().sort({ multiplier: 1 });
    if (sizes.length === 0) {
      sizes = await Size.insertMany([
        { size: 'EU 35-37', multiplier: 0.9, modelCode: 'DEF', variantCode: 'V1' },
        { size: 'EU 38-40', multiplier: 1.0, modelCode: 'DEF', variantCode: 'V1' },
        { size: 'EU 41-43', multiplier: 1.1, modelCode: 'DEF', variantCode: 'V1' },
        { size: 'EU 44-46', multiplier: 1.2, modelCode: 'DEF', variantCode: 'V1' },
        { size: 'EU 47-49', multiplier: 1.3, modelCode: 'DEF', variantCode: 'V1' }
      ]);
    }
    res.json(sizes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/bulk', async (req, res) => {
  try {
    const { sizes } = req.body;
    if (!Array.isArray(sizes)) return res.status(400).json({ message: 'Sizes must be an array' });

    const operations = sizes.map(s => ({
      updateOne: {
        filter: { size: s.size, modelCode: s.modelCode, variantCode: s.variantCode },
        update: { $set: { multiplier: s.multiplier || 1 } },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await Size.bulkWrite(operations);
    }
    
    const updatedSizes = await Size.find().sort({ multiplier: 1 });
    res.json(updatedSizes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { size, multiplier, modelCode, variantCode } = req.body;
    if (!size) return res.status(400).json({ message: 'Size is required' });
    if (!modelCode || !variantCode) return res.status(400).json({ message: 'modelCode and variantCode are required' });
    const newSize = await Size.create({ size, multiplier: multiplier || 1, modelCode, variantCode });
    res.status(201).json(newSize);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Size.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Size.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
