const Return = require('../models/Return');
const ProductVariant = require('../models/ProductVariant');
const Location = require('../models/Location');
const Order = require('../models/Order');
const { executeReturn } = require('../services/returnService');

// @desc Get all customer returns
// @route GET /api/returns
// @access Private
const getReturns = async (req, res, next) => {
  try {
    const { condition, locationId } = req.query;

    const query = {};
    if (condition) query.condition = condition;
    if (locationId) query.locationId = locationId;

    const returns = await Return.find(query)
      .populate('orderId', 'orderNumber customerName')
      .populate('locationId', 'name code')
      .populate({
        path: 'variantId',
        populate: { path: 'productId' }
      })
      .populate('handledBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: returns.length,
      data: returns
    });
  } catch (error) {
    next(error);
  }
};

// @desc Process new customer return
// @route POST /api/returns
// @access Private (Admin, Manager, Staff)
const createReturn = async (req, res, next) => {
  try {
    const {
      orderId,
      customerName,
      variantId,
      locationId,
      quantity,
      condition,
      reason,
      notes
    } = req.body;

    if (!customerName || !variantId || !locationId || !quantity || !condition || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, variant, warehouse location, quantity, condition, and reason are required'
      });
    }

    const normCondition = condition.toUpperCase();
    if (!['GOOD', 'DAMAGED'].includes(normCondition)) {
      return res.status(400).json({
        success: false,
        message: 'Condition must be either GOOD or DAMAGED'
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
        message: 'Product variant not found'
      });
    }

    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse location not found'
      });
    }

    const result = await executeReturn({
      orderId: orderId || null,
      customerName: customerName.trim(),
      variantId,
      productId: variant.productId._id,
      locationId,
      quantity: qty,
      condition: normCondition,
      reason: reason.trim(),
      userId: req.user._id,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: `Return recorded successfully as ${normCondition} stock.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReturns, createReturn };
