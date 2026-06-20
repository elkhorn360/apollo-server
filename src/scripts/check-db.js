require('dotenv').config();
const mongoose = require('mongoose');
const Variant = require('../models/Variant');
const RawMaterial = require('../models/RawMaterial');
const ManpowerConfig = require('../models/ManpowerConfig');
const UtilityConfig = require('../models/UtilityConfig');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const variants = await Variant.find();
    const materials = await RawMaterial.find();
    const manpowerDoc = await ManpowerConfig.findOne();
    const utilityDoc = await UtilityConfig.findOne();
    console.log('Variants count:', variants.length);
    console.log('Materials count:', materials.length);
    console.log('Manpower items count:', manpowerDoc?.rates?.length || 0);
    console.log('Utility items count:', utilityDoc?.rates?.length || 0);
    console.log('Manpower items:', JSON.stringify(manpowerDoc?.rates || [], null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
check();
