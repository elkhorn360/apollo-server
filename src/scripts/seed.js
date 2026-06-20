require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RawMaterial = require('../models/RawMaterial');
const ManpowerConfig = require('../models/ManpowerConfig');
const UtilityConfig = require('../models/UtilityConfig');
const Variant = require('../models/Variant');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      RawMaterial.deleteMany({}),
      ManpowerConfig.deleteMany({}),
      UtilityConfig.deleteMany({}),
      Variant.deleteMany({})
    ]);
    console.log('Database cleared');

    // 1. Create User
    const hashed = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'admin',
      email: 'admin@factory.com',
      password: hashed,
      role: 'admin'
    });
    console.log('Admin user created');

    // 2. Create Manpower Configs Singleton
    const defaultManpower = [
      { stageId: 'top_cut', name: 'Top Cut', unitCost: 5.00 },
      { stageId: 'top_finish', name: 'Top Finish', unitCost: 4.50 },
      { stageId: 'mount', name: 'Mount', unitCost: 6.00 },
      { stageId: 'sole_press', name: 'Sole Press', unitCost: 5.50 },
      { stageId: 'sockline', name: 'Sockline / Insole', unitCost: 4.00 },
      { stageId: 'spray_finish', name: 'Spray Finish', unitCost: 4.50 }
    ];
    await ManpowerConfig.create({ rates: defaultManpower });
    console.log('Default manpower options seeded');

    // 3. Create Utility Configs Singleton
    const defaultUtilities = [
      { utilityId: 'electricity', name: 'Electricity (kWh)', unitCost: 0.15 },
      { utilityId: 'water', name: 'Water (100L)', unitCost: 0.50 },
      { utilityId: 'steam', name: 'Steam (kg)', unitCost: 0.25 },
      { utilityId: 'air', name: 'Compressed Air (CFM)', unitCost: 0.10 }
    ];
    await UtilityConfig.create({ rates: defaultUtilities });
    console.log('Default utility options seeded');

    // 4. Create Initial Raw Materials
    const initialRawMaterials = [
      { category: 'leather', name: 'Synthetic Mesh', unit: 'sq_ft', unitCost: 1.80 },
      { category: 'sole', name: 'EVA Foam Outsole', unit: 'pairs', unitCost: 5.00 },
      { category: 'adhesives', name: 'PU Glue', unit: 'g', unitCost: 0.02 },
      { category: 'spray', name: 'Finishing Spray', unit: 'ml', unitCost: 0.025 },
      { category: 'threads', name: 'Nylon Thread 40s', unit: 'm', unitCost: 0.10 }
    ];
    await RawMaterial.insertMany(initialRawMaterials);
    console.log('Default raw materials seeded');

    // 5. Create Initial Variant
    await Variant.create({
      name: 'Running Shoe - Basic',
      labourAllocations: {},
      utilityAllocations: {},
      bom: []
    });
    console.log('Default variant seeded');

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
