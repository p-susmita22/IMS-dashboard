const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const Location = require('./models/Location');
const Vendor = require('./models/Vendor');
const Product = require('./models/Product');
const ProductVariant = require('./models/ProductVariant');
const Inventory = require('./models/Inventory');
const StockMovement = require('./models/StockMovement');
const Order = require('./models/Order');
const Transfer = require('./models/Transfer');
const Return = require('./models/Return');
const Adjustment = require('./models/Adjustment');
const stockService = require('./services/stockService');
const { generateSku } = require('./utils/generateSku');
const { generateOrderNumber } = require('./utils/generateOrderNumber');
const { generateTransferNumber, generateReturnNumber, generateAdjustmentNumber } = require('./utils/generateTransferNumber');

const seedData = async () => {
  try {
    await connectDB();
    console.log('Seeding database...');

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Location.deleteMany(),
      Vendor.deleteMany(),
      Product.deleteMany(),
      ProductVariant.deleteMany(),
      Inventory.deleteMany(),
      StockMovement.deleteMany(),
      Order.deleteMany(),
      Transfer.deleteMany(),
      Return.deleteMany(),
      Adjustment.deleteMany()
    ]);
    console.log('Old collections cleared.');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'Multimaart Admin',
      email: 'admin@ims.com',
      password: 'admin123',
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    const managerUser = await User.create({
      name: 'Priya Patel (Manager)',
      email: 'manager@ims.com',
      password: 'manager123',
      role: 'MANAGER',
      status: 'ACTIVE'
    });

    const staffUser = await User.create({
      name: 'Amit Kumar (Staff)',
      email: 'staff@ims.com',
      password: 'staff123',
      role: 'STAFF',
      status: 'ACTIVE'
    });

    console.log('Users created: admin@ims.com, manager@ims.com, staff@ims.com');

    console.log('Seeding COMPLETE! Database is ready with users only.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
