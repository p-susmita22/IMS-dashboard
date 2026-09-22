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

    // 2. Create Locations
    const locBhubaneswar = await Location.create({
      name: 'Bhubaneswar Warehouse',
      code: 'BBSR-WH',
      address: 'Plot 42, Mancheswar Industrial Estate, Bhubaneswar, Odisha',
      contactNumber: '+91 98765 43210',
      status: 'ACTIVE'
    });

    const locCuttack = await Location.create({
      name: 'Cuttack Warehouse',
      code: 'CTC-WH',
      address: 'Plot 18, Jagatpur Industrial Area, Cuttack, Odisha',
      contactNumber: '+91 98765 43211',
      status: 'ACTIVE'
    });

    const locKolkata = await Location.create({
      name: 'Kolkata Warehouse',
      code: 'KOL-WH',
      address: 'Sector V, Salt Lake, Kolkata, West Bengal',
      contactNumber: '+91 98765 43212',
      status: 'ACTIVE'
    });

    console.log('Locations created: Bhubaneswar, Cuttack, Kolkata');

    // 3. Create Vendors
    const vendorABC = await Vendor.create({
      name: 'ABC Traders',
      phone: '+91 91234 56789',
      email: 'contact@abctraders.in',
      address: 'Surat Textile Market, Surat, Gujarat',
      gstNumber: '24AAAAA0000A1Z5',
      contactPerson: 'Arun Gupta',
      status: 'ACTIVE'
    });

    const vendorXYZ = await Vendor.create({
      name: 'XYZ Suppliers',
      phone: '+91 91234 56780',
      email: 'sales@xyzsuppliers.com',
      address: 'Tirupur Apparel Park, Tirupur, Tamil Nadu',
      gstNumber: '33BBBBB1111B1Z2',
      contactPerson: 'Karthik Raja',
      status: 'ACTIVE'
    });

    const vendorGlobal = await Vendor.create({
      name: 'Global Garments Ltd',
      phone: '+91 91234 56781',
      email: 'info@globalgarments.com',
      address: 'Ludhiana Hosiery Complex, Ludhiana, Punjab',
      gstNumber: '03CCCCC2222C1Z8',
      contactPerson: 'Harpreet Singh',
      status: 'ACTIVE'
    });

    console.log('Vendors created: ABC Traders, XYZ Suppliers, Global Garments Ltd');

    // 4. Create Products & Variants
    // Product 1: Classic Cotton T-Shirt
    const prodTshirt = await Product.create({
      name: 'Classic Cotton T-Shirt',
      category: 'Apparel',
      brand: 'UrbanCraft',
      description: '100% combed cotton round neck casual t-shirt',
      productImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60',
      status: 'ACTIVE',
      createdBy: adminUser._id
    });

    const vTshirtBlackM = await ProductVariant.create({
      productId: prodTshirt._id,
      size: 'M',
      colour: 'Black',
      sku: 'TS-BLK-M',
      barcode: '890123456701',
      purchasePrice: 240,
      sellingPrice: 499,
      minimumStockLevel: 15,
      status: 'ACTIVE'
    });

    const vTshirtBlackL = await ProductVariant.create({
      productId: prodTshirt._id,
      size: 'L',
      colour: 'Black',
      sku: 'TS-BLK-L',
      barcode: '890123456702',
      purchasePrice: 250,
      sellingPrice: 520,
      minimumStockLevel: 15,
      status: 'ACTIVE'
    });

    const vTshirtBlackXL = await ProductVariant.create({
      productId: prodTshirt._id,
      size: 'XL',
      colour: 'Black',
      sku: 'TS-BLK-XL',
      barcode: '890123456703',
      purchasePrice: 260,
      sellingPrice: 540,
      minimumStockLevel: 10,
      status: 'ACTIVE'
    });

    const vTshirtWhiteM = await ProductVariant.create({
      productId: prodTshirt._id,
      size: 'M',
      colour: 'White',
      sku: 'TS-WHT-M',
      barcode: '890123456704',
      purchasePrice: 230,
      sellingPrice: 480,
      minimumStockLevel: 12,
      status: 'ACTIVE'
    });

    const vTshirtWhiteL = await ProductVariant.create({
      productId: prodTshirt._id,
      size: 'L',
      colour: 'White',
      sku: 'TS-WHT-L',
      barcode: '890123456705',
      purchasePrice: 240,
      sellingPrice: 499,
      minimumStockLevel: 12,
      status: 'ACTIVE'
    });

    // Product 2: Slim Fit Denim Jeans
    const prodJeans = await Product.create({
      name: 'Slim Fit Stretch Denim Jeans',
      category: 'Apparel',
      brand: 'DenimPro',
      description: 'Heavy duty stretch denim pants for all-day comfort',
      productImage: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=500&auto=format&fit=crop&q=60',
      status: 'ACTIVE',
      createdBy: adminUser._id
    });

    const vJeansBlue32 = await ProductVariant.create({
      productId: prodJeans._id,
      size: '32',
      colour: 'Blue',
      sku: 'JN-BLU-32',
      barcode: '890123456710',
      purchasePrice: 650,
      sellingPrice: 1299,
      minimumStockLevel: 8,
      status: 'ACTIVE'
    });

    const vJeansBlack32 = await ProductVariant.create({
      productId: prodJeans._id,
      size: '32',
      colour: 'Black',
      sku: 'JN-BLK-32',
      barcode: '890123456711',
      purchasePrice: 680,
      sellingPrice: 1350,
      minimumStockLevel: 8,
      status: 'ACTIVE'
    });

    // Product 3: Linen Formal Shirt
    const prodShirt = await Product.create({
      name: 'Pure Linen Formal Shirt',
      category: 'Formalwear',
      brand: 'RoyalThreads',
      description: 'Breathable linen dress shirt with regular collar',
      productImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60',
      status: 'ACTIVE',
      createdBy: adminUser._id
    });

    const vShirtBlue40 = await ProductVariant.create({
      productId: prodShirt._id,
      size: '40',
      colour: 'Sky Blue',
      sku: 'SH-SKY-40',
      barcode: '890123456720',
      purchasePrice: 550,
      sellingPrice: 1150,
      minimumStockLevel: 10,
      status: 'ACTIVE'
    });

    const vShirtWhite40 = await ProductVariant.create({
      productId: prodShirt._id,
      size: '40',
      colour: 'White',
      sku: 'SH-WHT-40',
      barcode: '890123456721',
      purchasePrice: 550,
      sellingPrice: 1150,
      minimumStockLevel: 10,
      status: 'ACTIVE'
    });

    console.log('Products & variants created with SKUs and barcodes.');

    // 5. Add Initial Stock using stockService.addStock() to record proper STOCK_IN movements!
    // TS-BLK-L in Bhubaneswar: 100 units @ 240 from ABC Traders
    await stockService.addStock({
      variantId: vTshirtBlackL._id,
      locationId: locBhubaneswar._id,
      quantity: 100,
      purchasePrice: 240,
      vendorId: vendorABC._id,
      userId: adminUser._id,
      notes: 'Initial bulk stock purchase from ABC Traders',
      referenceType: 'PURCHASE',
      referenceId: 'PO-2026-001'
    });

    // TS-BLK-L in Bhubaneswar: 50 units @ 235 from XYZ Suppliers (multi-vendor test case!)
    await stockService.addStock({
      variantId: vTshirtBlackL._id,
      locationId: locBhubaneswar._id,
      quantity: 50,
      purchasePrice: 235,
      vendorId: vendorXYZ._id,
      userId: adminUser._id,
      notes: 'Supplemental stock from XYZ Suppliers',
      referenceType: 'PURCHASE',
      referenceId: 'PO-2026-002'
    });

    // TS-BLK-L in Cuttack: 40 units @ 245
    await stockService.addStock({
      variantId: vTshirtBlackL._id,
      locationId: locCuttack._id,
      quantity: 40,
      purchasePrice: 245,
      vendorId: vendorABC._id,
      userId: adminUser._id,
      notes: 'Cuttack warehouse allocation',
      referenceType: 'PURCHASE',
      referenceId: 'PO-2026-003'
    });

    // TS-BLK-L in Kolkata: 30 units @ 240
    await stockService.addStock({
      variantId: vTshirtBlackL._id,
      locationId: locKolkata._id,
      quantity: 30,
      purchasePrice: 240,
      vendorId: vendorGlobal._id,
      userId: adminUser._id,
      notes: 'Kolkata warehouse allocation',
      referenceType: 'PURCHASE',
      referenceId: 'PO-2026-004'
    });

    // TS-BLK-M in Bhubaneswar: 80 units
    await stockService.addStock({
      variantId: vTshirtBlackM._id,
      locationId: locBhubaneswar._id,
      quantity: 80,
      purchasePrice: 240,
      vendorId: vendorABC._id,
      userId: managerUser._id,
      notes: 'Stock in',
      referenceType: 'PURCHASE',
      referenceId: 'PO-2026-005'
    });

    // TS-WHT-M in Bhubaneswar: 5 units (Low stock simulation!)
    await stockService.addStock({
      variantId: vTshirtWhiteM._id,
      locationId: locBhubaneswar._id,
      quantity: 5,
      purchasePrice: 230,
      vendorId: vendorXYZ._id,
      userId: managerUser._id,
      notes: 'Trial stock',
      referenceType: 'PURCHASE',
      referenceId: 'PO-2026-006'
    });

    // TS-WHT-L in Bhubaneswar: 0 units (Out of stock simulation! We create inventory record with 0)
    await stockService.getOrCreateInventory(vTshirtWhiteL._id, locBhubaneswar._id);

    // Denim Jeans in Bhubaneswar: 60 units
    await stockService.addStock({
      variantId: vJeansBlue32._id,
      locationId: locBhubaneswar._id,
      quantity: 60,
      purchasePrice: 650,
      vendorId: vendorGlobal._id,
      userId: adminUser._id,
      notes: 'Denim batch purchase',
      referenceType: 'PURCHASE',
      referenceId: 'PO-2026-007'
    });

    // Formal Shirt in Bhubaneswar: 45 units
    await stockService.addStock({
      variantId: vShirtBlue40._id,
      locationId: locBhubaneswar._id,
      quantity: 45,
      purchasePrice: 550,
      vendorId: vendorABC._id,
      userId: adminUser._id,
      notes: 'Linen shirt launch stock',
      referenceType: 'PURCHASE',
      referenceId: 'PO-2026-008'
    });

    console.log('Stock successfully added across multiple warehouses with audit trail.');

    // 6. Perform a sample sale / stock out to test STOCK_OUT movement
    await stockService.removeStock({
      variantId: vTshirtBlackL._id,
      locationId: locBhubaneswar._id,
      quantity: 20,
      customerName: 'Odisha Retail Outlets',
      userId: staffUser._id,
      reason: 'Direct store dispatch',
      notes: 'Urgent weekend replenishment',
      referenceType: 'SALE',
      referenceId: 'SALE-2026-101'
    });

    // 7. Perform a sample transfer between Bhubaneswar and Cuttack
    const trfNumber = await generateTransferNumber();
    await stockService.transferStock({
      fromLocationId: locBhubaneswar._id,
      toLocationId: locCuttack._id,
      variantId: vTshirtBlackL._id,
      quantity: 15,
      userId: managerUser._id,
      notes: 'Transfer 15 units to meet Cuttack showroom demand',
      transferNumber: trfNumber
    });

    await Transfer.create({
      transferNumber: trfNumber,
      fromLocationId: locBhubaneswar._id,
      toLocationId: locCuttack._id,
      variantId: vTshirtBlackL._id,
      productId: prodTshirt._id,
      quantity: 15,
      status: 'COMPLETED',
      performedBy: managerUser._id,
      notes: 'Inter-branch stock equalization'
    });

    // 8. Perform a sample return
    const retNumber = await generateReturnNumber();
    await stockService.processGoodReturn({
      variantId: vTshirtBlackL._id,
      locationId: locBhubaneswar._id,
      quantity: 5,
      customerName: 'Odisha Retail Outlets',
      userId: staffUser._id,
      reason: 'Unsold weekend consignment return (pristine tag)',
      notes: 'Verified tags and packaging intact',
      returnNumber: retNumber
    });

    await Return.create({
      returnNumber: retNumber,
      customerName: 'Odisha Retail Outlets',
      variantId: vTshirtBlackL._id,
      productId: prodTshirt._id,
      locationId: locBhubaneswar._id,
      quantity: 5,
      condition: 'GOOD',
      reason: 'Unsold consignment return',
      handledBy: staffUser._id,
      notes: 'Restocked into available inventory'
    });

    // 9. Sample Damaged Return
    const retDamagedNum = await generateReturnNumber();
    await stockService.processDamagedReturn({
      variantId: vTshirtBlackM._id,
      locationId: locBhubaneswar._id,
      quantity: 2,
      customerName: 'Posh Boutique',
      userId: staffUser._id,
      reason: 'Stitch defect noticed by buyer',
      notes: 'Isolated in damaged inventory quarantine',
      returnNumber: retDamagedNum
    });

    await Return.create({
      returnNumber: retDamagedNum,
      customerName: 'Posh Boutique',
      variantId: vTshirtBlackM._id,
      productId: prodTshirt._id,
      locationId: locBhubaneswar._id,
      quantity: 2,
      condition: 'DAMAGED',
      reason: 'Stitch defect',
      handledBy: staffUser._id,
      notes: 'Quarantined. Available stock unaffected.'
    });

    // 10. Sample Pending Adjustment
    const adjNum = await generateAdjustmentNumber();
    const invForAdj = await Inventory.findOne({
      variantId: vTshirtBlackM._id,
      locationId: locBhubaneswar._id
    });
    const currentQty = invForAdj ? invForAdj.quantity : 80;

    await Adjustment.create({
      adjustmentNumber: adjNum,
      variantId: vTshirtBlackM._id,
      productId: prodTshirt._id,
      locationId: locBhubaneswar._id,
      systemStock: currentQty,
      physicalCount: currentQty - 2,
      difference: -2,
      reason: 'Counting Error',
      notes: 'Physical audit on Shelf 4 showed 2 units less than system tally',
      status: 'PENDING',
      requestedBy: staffUser._id
    });

    // 11. Create sample Orders:
    // Order 1: NEW
    const ord1Num = await generateOrderNumber();
    await Order.create({
      orderNumber: ord1Num,
      customerName: 'Apex Clothing Mart',
      phoneNumber: '+91 99370 12345',
      deliveryAddress: 'Shop 14, Grand Bazaar, Bhubaneswar',
      locationId: locBhubaneswar._id,
      items: [
        {
          productId: prodTshirt._id,
          variantId: vTshirtBlackL._id,
          productName: prodTshirt.name,
          sku: vTshirtBlackL.sku,
          size: vTshirtBlackL.size,
          colour: vTshirtBlackL.colour,
          quantity: 10,
          price: vTshirtBlackL.sellingPrice,
          total: 10 * vTshirtBlackL.sellingPrice
        }
      ],
      totalAmount: 10 * vTshirtBlackL.sellingPrice,
      orderStatus: 'NEW',
      isReserved: false,
      isStockDeducted: false,
      statusTimeline: [
        {
          status: 'NEW',
          updatedBy: staffUser._id,
          timestamp: new Date(),
          notes: 'Customer placed wholesale order via phone'
        }
      ],
      createdBy: staffUser._id
    });

    // Order 2: CONFIRMED (with reservation!)
    const ord2Num = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0002`;
    const ord2 = await Order.create({
      orderNumber: ord2Num,
      customerName: 'Bhubaneswar Fashion Hub',
      phoneNumber: '+91 99370 54321',
      deliveryAddress: 'Janpath Road, Bhubaneswar',
      locationId: locBhubaneswar._id,
      items: [
        {
          productId: prodJeans._id,
          variantId: vJeansBlue32._id,
          productName: prodJeans.name,
          sku: vJeansBlue32.sku,
          size: vJeansBlue32.size,
          colour: vJeansBlue32.colour,
          quantity: 5,
          price: vJeansBlue32.sellingPrice,
          total: 5 * vJeansBlue32.sellingPrice
        }
      ],
      totalAmount: 5 * vJeansBlue32.sellingPrice,
      orderStatus: 'CONFIRMED',
      isReserved: true,
      isStockDeducted: false,
      statusTimeline: [
        {
          status: 'NEW',
          updatedBy: staffUser._id,
          timestamp: new Date(Date.now() - 3600000),
          notes: 'Order placed'
        },
        {
          status: 'CONFIRMED',
          updatedBy: managerUser._id,
          timestamp: new Date(),
          notes: 'Advance payment received. Stock reserved.'
        }
      ],
      createdBy: staffUser._id
    });
    // Reserve the 5 units in inventory
    await stockService.reserveStock({
      variantId: vJeansBlue32._id,
      locationId: locBhubaneswar._id,
      quantity: 5
    });

    console.log('Sample orders, transfers, returns, and adjustments seeded successfully.');
    console.log('Seeding COMPLETE! Database is ready.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
