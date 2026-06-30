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
    const { name, modelName, modelCode, variantCode, sizes, bom, labourAllocations, utilityAllocations } = req.body;
    console.log('[POST /variants] sizes received:', sizes);
    if (!name) return res.status(400).json({ message: 'name is required' });
    const created = await Variant.create({
      name, modelName, modelCode, variantCode,
      sizes: Array.isArray(sizes) ? sizes : [],
      bom: bom || [],
      labourAllocations: labourAllocations || [],
      utilityAllocations: utilityAllocations || []
    });
    // Re-fetch the document so all schema fields (including sizes) serialize correctly
    const variant = await Variant.findById(created._id).populate('bom.rawMaterial');
    console.log('[POST /variants] sizes saved:', variant.sizes);
    res.status(201).json(variant);
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

// PUT /api/variants/:id  – update top-level fields
router.put('/:id', async (req, res) => {
  try {
    const { name, modelName, modelCode, variantCode, sizes, labourAllocations, utilityAllocations } = req.body;
    console.log('[PUT /variants/:id] body:', JSON.stringify(req.body));
    console.log('[PUT /variants/:id] sizes received:', sizes);

    // Build update object explicitly so all field types (including arrays) are handled correctly
    const update = {};
    if (name               !== undefined) update.name               = name;
    if (modelName          !== undefined) update.modelName          = modelName;
    if (modelCode          !== undefined) update.modelCode          = modelCode;
    if (variantCode        !== undefined) update.variantCode        = variantCode;
    if (sizes              !== undefined) update.sizes              = Array.isArray(sizes) ? sizes : [];
    if (labourAllocations  !== undefined) update.labourAllocations  = labourAllocations;
    if (utilityAllocations !== undefined) update.utilityAllocations = utilityAllocations;

    console.log('[PUT /variants/:id] update $set:', JSON.stringify(update));

    await Variant.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    // Re-fetch so all schema fields serialize correctly in Mongoose 8
    const variant = await Variant.findById(req.params.id).populate('bom.rawMaterial');
    if (!variant) return res.status(404).json({ message: 'Variant not found' });
    console.log('[PUT /variants/:id] sizes saved:', variant.sizes);
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

// ── Labour sub-routes ─────────────────────────────────────────────────────────

// POST /api/variants/:id/labour  – add stage to labour allocations
router.post('/:id/labour', async (req, res) => {
  try {
    const { stageId, quantity } = req.body;
    if (!stageId || quantity === undefined) {
      return res.status(400).json({ message: 'stageId and quantity are required' });
    }
    const variant = await Variant.findById(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variant not found' });

    variant.labourAllocations.push({ stageId, quantity });
    await variant.save();
    res.status(201).json(await variant.populate('bom.rawMaterial'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/variants/:id/labour/:labourId  – update a labour allocation
router.put('/:id/labour/:labourId', async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variant not found' });

    const entry = variant.labourAllocations.id(req.params.labourId);
    if (!entry) return res.status(404).json({ message: 'Labour allocation not found' });

    if (req.body.stageId !== undefined) entry.stageId = req.body.stageId;
    if (req.body.quantity !== undefined) entry.quantity = req.body.quantity;

    await variant.save();
    res.json(await variant.populate('bom.rawMaterial'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/variants/:id/labour/:labourId
router.delete('/:id/labour/:labourId', async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variant not found' });

    variant.labourAllocations = variant.labourAllocations.filter(e => e._id.toString() !== req.params.labourId);
    await variant.save();
    res.json(await variant.populate('bom.rawMaterial'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Utility sub-routes ────────────────────────────────────────────────────────

// POST /api/variants/:id/utility  – add utility to utility allocations
router.post('/:id/utility', async (req, res) => {
  try {
    const { utilityId, quantity } = req.body;
    if (!utilityId || quantity === undefined) {
      return res.status(400).json({ message: 'utilityId and quantity are required' });
    }
    const variant = await Variant.findById(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variant not found' });

    variant.utilityAllocations.push({ utilityId, quantity });
    await variant.save();
    res.status(201).json(await variant.populate('bom.rawMaterial'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/variants/:id/utility/:utilityId  – update a utility allocation
router.put('/:id/utility/:utilityId', async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variant not found' });

    const entry = variant.utilityAllocations.id(req.params.utilityId);
    if (!entry) return res.status(404).json({ message: 'Utility allocation not found' });

    if (req.body.utilityId !== undefined) entry.utilityId = req.body.utilityId;
    if (req.body.quantity !== undefined) entry.quantity = req.body.quantity;

    await variant.save();
    res.json(await variant.populate('bom.rawMaterial'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/variants/:id/utility/:utilityId
router.delete('/:id/utility/:utilityId', async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variant not found' });

    variant.utilityAllocations = variant.utilityAllocations.filter(e => e._id.toString() !== req.params.utilityId);
    await variant.save();
    res.json(await variant.populate('bom.rawMaterial'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
