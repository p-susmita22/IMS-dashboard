const Adjustment = require('../models/Adjustment');
const Inventory = require('../models/Inventory');
const ProductVariant = require('../models/ProductVariant');
const Location = require('../models/Location');
const { adjustStock } = require('../services/stockService');
const { generateAdjustmentNumber } = require('../utils/generateTransferNumber');

// @desc Get adjustments
// @route GET /api/adjustments
// @access Private
const getAdjustments = async (req, res, next) => {
  try {
    const { status, locationId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (locationId) query.locationId = locationId;

    const adjustments = await Adjustment.find(query)
      .populate('locationId', 'name code')
      .populate({
        path: 'variantId',
        populate: { path: 'productId' }
      })
      .populate('requestedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: adjustments.length,
      data: adjustments
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create stock adjustment
// @route POST /api/adjustments
// @access Private (Admin, Manager, Staff)
const createAdjustment = async (req, res, next) => {
  try {
    const { variantId, locationId, physicalCount, reason, notes, autoApprove } = req.body;

    if (!variantId || !locationId || physicalCount === undefined || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Variant, Location, Physical Count, and Reason are required'
      });
    }

    const count = Number(physicalCount);
    if (isNaN(count) || count < 0) {
      return res.status(400).json({
        success: false,
        message: 'Physical count must be a non-negative number'
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

    const inv = await Inventory.findOne({ variantId, locationId });
    const systemStock = inv ? inv.quantity : 0;
    const difference = count - systemStock;

    const adjustmentNumber = await generateAdjustmentNumber();

    // Staff cannot approve their own adjustments!
    const canAutoApprove =
      autoApprove &&
      (req.user.role === 'ADMIN' || req.user.role === 'MANAGER');

    if (canAutoApprove) {
      const stockResult = await adjustStock({
        variantId,
        locationId,
        physicalCount: count,
        reason,
        notes,
        userId: req.user._id,
        adjustmentNumber
      });

      const adjustment = await Adjustment.create({
        adjustmentNumber,
        variantId,
        productId: variant.productId._id,
        locationId,
        systemStock,
        physicalCount: count,
        difference,
        reason,
        notes: notes || '',
        status: 'APPROVED',
        requestedBy: req.user._id,
        approvedBy: req.user._id,
        approvedAt: new Date()
      });

      return res.status(201).json({
        success: true,
        message: `Adjustment approved immediately. New stock: ${count}`,
        data: { adjustment, stockResult }
      });
    } else {
      const adjustment = await Adjustment.create({
        adjustmentNumber,
        variantId,
        productId: variant.productId._id,
        locationId,
        systemStock,
        physicalCount: count,
        difference,
        reason,
        notes: notes || '',
        status: 'PENDING',
        requestedBy: req.user._id
      });

      return res.status(201).json({
        success: true,
        message: `Adjustment request #${adjustmentNumber} submitted for manager approval.`,
        data: { adjustment }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Approve stock adjustment
// @route PATCH /api/adjustments/:id/approve
// @access Private (Admin, Manager only)
const approveAdjustment = async (req, res, next) => {
  try {
    const adjustment = await Adjustment.findById(req.params.id);
    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Adjustment not found'
      });
    }

    if (adjustment.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Adjustment cannot be approved as it is currently ${adjustment.status}`
      });
    }

    const stockResult = await adjustStock({
      variantId: adjustment.variantId,
      locationId: adjustment.locationId,
      physicalCount: adjustment.physicalCount,
      reason: adjustment.reason,
      notes: adjustment.notes,
      userId: req.user._id,
      adjustmentNumber: adjustment.adjustmentNumber
    });

    adjustment.status = 'APPROVED';
    adjustment.approvedBy = req.user._id;
    adjustment.approvedAt = new Date();
    await adjustment.save();

    res.json({
      success: true,
      message: `Adjustment #${adjustment.adjustmentNumber} approved. Inventory updated.`,
      data: { adjustment, stockResult }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Reject stock adjustment
// @route PATCH /api/adjustments/:id/reject
// @access Private (Admin, Manager only)
const rejectAdjustment = async (req, res, next) => {
  try {
    const adjustment = await Adjustment.findById(req.params.id);
    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Adjustment not found'
      });
    }

    if (adjustment.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Adjustment cannot be rejected as it is currently ${adjustment.status}`
      });
    }

    adjustment.status = 'REJECTED';
    adjustment.approvedBy = req.user._id;
    adjustment.approvedAt = new Date();
    await adjustment.save();

    res.json({
      success: true,
      message: `Adjustment #${adjustment.adjustmentNumber} rejected.`,
      data: adjustment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdjustments,
  createAdjustment,
  approveAdjustment,
  rejectAdjustment
};
