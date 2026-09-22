const Transfer = require('../models/Transfer');
const ProductVariant = require('../models/ProductVariant');
const Location = require('../models/Location');
const { executeTransfer } = require('../services/transferService');

// @desc Get all transfers
// @route GET /api/transfers
// @access Private
const getTransfers = async (req, res, next) => {
  try {
    const { fromLocationId, toLocationId } = req.query;

    const query = {};
    if (fromLocationId) query.fromLocationId = fromLocationId;
    if (toLocationId) query.toLocationId = toLocationId;

    const transfers = await Transfer.find(query)
      .populate('fromLocationId', 'name code')
      .populate('toLocationId', 'name code')
      .populate({
        path: 'variantId',
        populate: { path: 'productId' }
      })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create a new inter-warehouse stock transfer
// @route POST /api/transfers
// @access Private (Admin, Manager)
const createTransfer = async (req, res, next) => {
  try {
    const { fromLocationId, toLocationId, variantId, quantity, notes } = req.body;

    if (!fromLocationId || !toLocationId || !variantId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'From location, To location, Variant, and Quantity are required'
      });
    }

    if (fromLocationId === toLocationId) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination warehouses cannot be the same'
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

    const fromLoc = await Location.findById(fromLocationId);
    const toLoc = await Location.findById(toLocationId);
    if (!fromLoc || !toLoc) {
      return res.status(404).json({
        success: false,
        message: 'One or both warehouse locations do not exist'
      });
    }

    const result = await executeTransfer({
      fromLocationId,
      toLocationId,
      variantId,
      productId: variant.productId._id,
      quantity: qty,
      userId: req.user._id,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: `Successfully transferred ${qty} units from ${fromLoc.name} to ${toLoc.name}.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTransfers, createTransfer };
