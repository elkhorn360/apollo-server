const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const RawMaterial = require('../models/RawMaterial');

// All routes are protected
router.use(auth);

// GET /api/raw-materials
router.get('/', async (req, res) => {
  try {
    const materials = await RawMaterial.find().sort({ category: 1, name: 1 });
    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/raw-materials
router.post('/', async (req, res) => {
  try {
    const { category, name, unit, unitCost } = req.body;
    if (!category || !name || !unit || unitCost === undefined) {
      return res.status(400).json({ message: 'category, name, unit, and unitCost are required' });
    }
    const material = await RawMaterial.create({ category, name, unit, unitCost });
    res.status(201).json(material);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/raw-materials/:id
router.put('/:id', async (req, res) => {
  try {
    const material = await RawMaterial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!material) return res.status(404).json({ message: 'Material not found' });
    res.json(material);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/raw-materials/:id
router.delete('/:id', async (req, res) => {
  try {
    const material = await RawMaterial.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ message: 'Material not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
