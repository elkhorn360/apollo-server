const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Variant = require('../models/Variant');

router.use(auth);

// GET /api/variants  – returns all variants with BOM populated
router.get('/', async (req, res) => {
  try {
    const variants = await Variant.find().populate('bom.rawMaterial');
    res.json(variants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/variants/:id
router.get('/:id', async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id).populate('bom.rawMaterial');
    if (!variant) return res.status(404).json({ message: 'Variant not found' });
    res.json(variant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/variants
router.post('/', async (req, res) => {
  try {
    const { name, modelName, modelCode, variantCode, bom, labourAllocations, utilityAllocations } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    const variant = await Variant.create({ name, modelName, modelCode, variantCode, bom: bom || [], labourAllocations, utilityAllocations });
    res.status(201).json(await variant.populate('bom.rawMaterial'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/variants/model/update – update modelName and modelCode for all variants under a model name
router.put('/model/update', async (req, res) => {
  try {
    const { oldModelName, newModelName, newModelCode } = req.body;
    if (!oldModelName) return res.status(400).json({ message: 'oldModelName is required' });

    await Variant.updateMany(
      { modelName: oldModelName },
      { $set: { modelName: newModelName, modelCode: newModelCode } }
    );

    const variants = await Variant.find().populate('bom.rawMaterial');
    res.json(variants);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/variants/model/:modelName – delete all variants under a model name
router.delete('/model/:modelName', async (req, res) => {
  try {
    const modelName = req.params.modelName;
    await Variant.deleteMany({ modelName });
    res.json({ message: `All variants for model ${modelName} deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/variants/:id  – update top-level fields (name, labourAllocations, utilityAllocations)
router.put('/:id', async (req, res) => {
  try {
    const variant = await Variant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('bom.rawMaterial');
    if (!variant) return res.status(404).json({ message: 'Variant not found' });
    res.json(variant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/variants/:id
router.delete('/:id', async (req, res) => {
  try {
    const variant = await Variant.findByIdAndDelete(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variant not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── BOM sub-routes ────────────────────────────────────────────────────────────

// POST /api/variants/:id/bom  – add material to BOM
router.post('/:id/bom', async (req, res) => {
  try {
    const { rawMaterial, quantity } = req.body;
    if (!rawMaterial || quantity === undefined) {
      return res.status(400).json({ message: 'rawMaterial and quantity are required' });
    }
    const variant = await Variant.findById(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variant not found' });

    variant.bom.push({ rawMaterial, quantity });
    await variant.save();
    res.status(201).json(await variant.populate('bom.rawMaterial'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/variants/:id/bom/:bomId  – update a BOM entry
router.put('/:id/bom/:bomId', async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variant not found' });

    const entry = variant.bom.id(req.params.bomId);
    if (!entry) return res.status(404).json({ message: 'BOM entry not found' });

    if (req.body.rawMaterial !== undefined) entry.rawMaterial = req.body.rawMaterial;
    if (req.body.quantity   !== undefined) entry.quantity    = req.body.quantity;

    await variant.save();
    res.json(await variant.populate('bom.rawMaterial'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/variants/:id/bom/:bomId
router.delete('/:id/bom/:bomId', async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variant not found' });

    variant.bom = variant.bom.filter(e => e._id.toString() !== req.params.bomId);
    await variant.save();
    res.json(await variant.populate('bom.rawMaterial'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
