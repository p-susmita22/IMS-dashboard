const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const StockMovement = require('../models/StockMovement');
const Vendor = require('../models/Vendor');
const Location = require('../models/Location');
const Order = require('../models/Order');
const Transfer = require('../models/Transfer');
const Return = require('../models/Return');
const stockService = require('../services/stockService');

// @desc Get all inventory items with warehouse breakdown & alerts
// @route GET /api/inventory
// @access Private
const getInventory = async (req, res, next) => {
  try {
    const { locationId, search, status } = req.query;

    const filter = {};
    if (locationId) filter.locationId = locationId;

    let inventories = await Inventory.find(filter)
      .populate({
        path: 'variantId',
        populate: { path: 'productId' }
      })
      .populate('locationId');

    // Filter valid docs
    inventories = inventories.filter(
      (inv) => inv.variantId && inv.variantId.productId && !inv.variantId.productId.isDeleted && inv.locationId
    );

    if (search) {
      const q = search.toLowerCase();
      inventories = inventories.filter((inv) => {
        const p = inv.variantId.productId;
        const v = inv.variantId;
        return (
          p.name.toLowerCase().includes(q) ||
          v.sku.toLowerCase().includes(q) ||
          (v.barcode && v.barcode.toLowerCase().includes(q)) ||
          v.size.toLowerCase().includes(q) ||
          v.colour.toLowerCase().includes(q)
        );
      });
    }

    if (status === 'LOW_STOCK') {
      inventories = inventories.filter(
        (inv) =>
          inv.availableStock > 0 &&
          inv.availableStock <= inv.variantId.minimumStockLevel
      );
    } else if (status === 'OUT_OF_STOCK') {
      inventories = inventories.filter((inv) => inv.availableStock === 0);
    }

    res.json({
      success: true,
      count: inventories.length,
      data: inventories
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get inventory & movement trail for a single variant
// @route GET /api/inventory/variant/:variantId
// @access Private
const getVariantInventory = async (req, res, next) => {
  try {
    const { variantId } = req.params;

    const variant = await ProductVariant.findById(variantId).populate('productId');
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    const inventories = await Inventory.find({ variantId }).populate('locationId');
    const movements = await StockMovement.find({ variantId })
      .populate('locationId', 'name code')
      .populate('vendorId', 'name')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    const totalPhysical = inventories.reduce((sum, inv) => sum + inv.quantity, 0);
    const totalReserved = inventories.reduce((sum, inv) => sum + inv.reservedQuantity, 0);
    const totalAvailable = Math.max(0, totalPhysical - totalReserved);
    const totalDamaged = inventories.reduce((sum, inv) => sum + inv.damagedQuantity, 0);

    res.json({
      success: true,
      data: {
        variant,
        inventories,
        summary: {
          totalPhysical,
          totalReserved,
          totalAvailable,
          totalDamaged
        },
        movements
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Add stock / Stock-In
// @route POST /api/inventory/stock-in
// @access Private (Admin, Manager, Staff)
const stockIn = async (req, res, next) => {
  try {
    const { variantId, locationId, quantity, purchasePrice, vendorId, notes } = req.body;

    if (!variantId || !locationId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Variant, Location, and Quantity are required'
      });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number greater than 0'
      });
    }

    const variant = await ProductVariant.findById(variantId).populate('productId');
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location warehouse not found'
      });
    }

    let vendor = null;
    if (vendorId) {
      vendor = await Vendor.findById(vendorId);
    }

    const price = purchasePrice !== undefined ? Number(purchasePrice) : variant.purchasePrice;

    const result = await stockService.addStock({
      variantId,
      locationId,
      quantity: qty,
      purchasePrice: price,
      vendorId: vendor ? vendor._id : null,
      userId: req.user._id,
      notes: notes || `Stock In for ${variant.sku}`
    });

    res.status(201).json({
      success: true,
      message: `${qty} units added successfully to ${location.name}.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc Stock Out
// @route POST /api/inventory/stock-out
// @access Private (Admin, Manager, Staff)
const stockOut = async (req, res, next) => {
  try {
    const {
      variantId,
      locationId,
      quantity,
      customerName,
      orderNumber,
      reason,
      notes
    } = req.body;

    if (!variantId || !locationId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Variant, Location, and Quantity are required'
      });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number greater than 0'
      });
    }

    const variant = await ProductVariant.findById(variantId).populate('productId');
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location warehouse not found'
      });
    }

    const result = await stockService.removeStock({
      variantId,
      locationId,
      quantity: qty,
      customerName: customerName || '',
      reason: reason || 'Sale / Manual Out',
      notes: notes || '',
      referenceType: orderNumber ? 'ORDER' : 'SALE',
      referenceId: orderNumber || '',
      userId: req.user._id
    });

    res.json({
      success: true,
      message: `${qty} units removed successfully from ${location.name}.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get stock movements / audit trail
// @route GET /api/inventory/movements
// @access Private
const getMovements = async (req, res, next) => {
  try {
    const { variantId, locationId, movementType, limit = 100 } = req.query;

    const query = {};
    if (variantId) query.variantId = variantId;
    if (locationId) query.locationId = locationId;
    if (movementType) query.movementType = movementType;

    const movements = await StockMovement.find(query)
      .populate({
        path: 'variantId',
        populate: { path: 'productId' }
      })
      .populate('locationId')
      .populate('vendorId', 'name')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      count: movements.length,
      data: movements
    });
  } catch (error) {
    next(error);
  }
};

// @desc Global instant search across Product, SKU, Barcode, Size, Colour, Vendor
// @route GET /api/inventory/search
// @access Private
const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json({ success: true, data: [] });
    }

    const term = q.trim();
    const regex = new RegExp(term, 'i');

    // Find matching vendors
    const matchingVendors = await Vendor.find({ name: regex }).select('_id');
    const vendorIds = matchingVendors.map((v) => v._id);

    // Find matching products
    const matchingProducts = await Product.find({
      $or: [{ name: regex }, { category: regex }, { brand: regex }],
      isDeleted: { $ne: true }
    }).select('_id');
    const productIds = matchingProducts.map((p) => p._id);

    // Find matching variants
    const variantQuery = {
      $or: [
        { productId: { $in: productIds } },
        { sku: regex },
        { barcode: regex },
        { size: regex },
        { colour: regex }
      ]
    };

    const variants = await ProductVariant.find(variantQuery)
      .populate('productId')
      .limit(50);

    const variantIds = variants.map((v) => v._id);

    // Fetch all inventory records for matching variants
    const inventories = await Inventory.find({ variantId: { $in: variantIds } })
      .populate('locationId');

    // Fetch recent vendors for these variants from stock movements
    const movements = await StockMovement.find({
      variantId: { $in: variantIds },
      vendorId: { $ne: null }
    })
      .populate('vendorId', 'name')
      .sort({ createdAt: -1 });

    const variantVendorMap = {};
    movements.forEach((m) => {
      const vid = m.variantId.toString();
      if (!variantVendorMap[vid] && m.vendorId) {
        variantVendorMap[vid] = m.vendorId.name;
      }
    });

    const results = [];
    variants.forEach((v) => {
      if (!v.productId || v.productId.isDeleted) return;

      const vInvs = inventories.filter(
        (inv) => inv.variantId.toString() === v._id.toString()
      );

      const totalStock = vInvs.reduce((sum, inv) => sum + inv.quantity, 0);
      const reservedStock = vInvs.reduce((sum, inv) => sum + inv.reservedQuantity, 0);
      const availableStock = Math.max(0, totalStock - reservedStock);

      const locationsList = vInvs
        .filter((inv) => inv.locationId)
        .map((inv) => ({
          locationName: inv.locationId.name,
          locationCode: inv.locationId.code,
          total: inv.quantity,
          reserved: inv.reservedQuantity,
          available: Math.max(0, inv.quantity - inv.reservedQuantity)
        }));

      results.push({
        productName: v.productId.name,
        category: v.productId.category,
        brand: v.productId.brand,
        productImage: v.productId.productImage,
        variantId: v._id,
        productId: v.productId._id,
        sku: v.sku,
        size: v.size,
        colour: v.colour,
        barcode: v.barcode,
        purchasePrice: v.purchasePrice,
        sellingPrice: v.sellingPrice,
        minimumStockLevel: v.minimumStockLevel,
        totalStock,
        reservedStock,
        availableStock,
        vendor: variantVendorMap[v._id.toString()] || 'Multiple Vendors',
        locations: locationsList
      });
    });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Dashboard KPI statistics and today's activity
// @route GET /api/inventory/dashboard
// @access Private
const getDashboardSummary = async (req, res, next) => {
  try {
    // 1. Total Products
    const totalProducts = await Product.countDocuments({ isDeleted: { $ne: true } });

    // 2. Total Stock across all locations
    const allInventories = await Inventory.find().populate({
      path: 'variantId',
      populate: { path: 'productId' }
    });
    let totalStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const lowStockAlerts = [];
    const outOfStockAlerts = [];

    // Group by variant to check alerts
    const variantStockMap = {};
    for (const inv of allInventories) {
      if (!inv.variantId || !inv.variantId.productId || inv.variantId.productId.isDeleted) continue;
      
      totalStock += inv.quantity;
      const vid = inv.variantId._id.toString();
      if (!variantStockMap[vid]) {
        variantStockMap[vid] = {
          variant: inv.variantId,
          total: 0,
          reserved: 0
        };
      }
      variantStockMap[vid].total += inv.quantity;
      variantStockMap[vid].reserved += inv.reservedQuantity;
    }

    for (const vid in variantStockMap) {
      const { variant, total, reserved } = variantStockMap[vid];
      const available = Math.max(0, total - reserved);
      if (available === 0) {
        outOfStockCount++;
        if (outOfStockAlerts.length < 10) {
          outOfStockAlerts.push({
            variantId: variant._id,
            sku: variant.sku,
            size: variant.size,
            colour: variant.colour,
            availableStock: 0,
            minimumStockLevel: variant.minimumStockLevel
          });
        }
      } else if (available <= variant.minimumStockLevel) {
        lowStockCount++;
        if (lowStockAlerts.length < 10) {
          lowStockAlerts.push({
            variantId: variant._id,
            sku: variant.sku,
            size: variant.size,
            colour: variant.colour,
            availableStock: available,
            minimumStockLevel: variant.minimumStockLevel
          });
        }
      }
    }

    // 3. Today's Activity
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayMovements = await StockMovement.find({
      createdAt: { $gte: startOfToday }
    });

    let stockAdded = 0;
    let stockSold = 0;
    let stockTransferred = 0;
    let returns = 0;

    todayMovements.forEach((m) => {
      if (m.movementType === 'STOCK_IN') stockAdded += m.quantity;
      if (m.movementType === 'STOCK_OUT') stockSold += m.quantity;
      if (m.movementType === 'TRANSFER_IN') stockTransferred += m.quantity;
      if (m.movementType === 'RETURN_GOOD' || m.movementType === 'RETURN_DAMAGED') {
        returns += m.quantity;
      }
    });

    // 4. Pending orders count
    const pendingOrdersCount = await Order.countDocuments({
      orderStatus: { $in: ['NEW', 'CONFIRMED', 'PACKED'] }
    });

    res.json({
      success: true,
      data: {
        cards: {
          totalProducts,
          totalStock,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount
        },
        todayActivity: {
          stockAdded,
          stockSold,
          stockTransferred,
          returns
        },
        alerts: {
          lowStock: lowStockAlerts,
          outOfStock: outOfStockAlerts,
          pendingOrdersCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getVariantInventory,
  stockIn,
  stockOut,
  getMovements,
  globalSearch,
  getDashboardSummary
};
