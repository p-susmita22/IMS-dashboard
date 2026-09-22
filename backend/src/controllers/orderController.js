const Order = require('../models/Order');
const ProductVariant = require('../models/ProductVariant');
const Location = require('../models/Location');
const { generateOrderNumber } = require('../utils/generateOrderNumber');
const {
  checkOrderStockAvailability,
  reserveOrderItems,
  releaseOrderItems,
  dispatchOrderItems
} = require('../services/reservationService');

// Allowed status transitions
const ALLOWED_TRANSITIONS = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['DELIVERED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: []
};

// @desc Get all orders
// @route GET /api/orders
// @access Private
const getOrders = async (req, res, next) => {
  try {
    const { status, search, locationId } = req.query;

    const query = { isDeleted: { $ne: true } };
    if (status && status !== 'ALL') query.orderStatus = status;
    if (locationId) query.locationId = locationId;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('locationId')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get order by ID
// @route GET /api/orders/:id
// @access Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('locationId')
      .populate('createdBy', 'name email')
      .populate('statusTimeline.updatedBy', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create new order
// @route POST /api/orders
// @access Private (Admin, Manager, Staff)
const createOrder = async (req, res, next) => {
  try {
    const { customerName, phoneNumber, deliveryAddress, locationId, items, notes } = req.body;

    if (!customerName || !phoneNumber || !deliveryAddress || !locationId) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, phone, address, and warehouse location are required'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse location not found'
      });
    }

    // Validate each item and calculate totals
    const processedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const variant = await ProductVariant.findById(item.variantId).populate('productId');
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: `Product variant with ID ${item.variantId} not found`
        });
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Item quantity must be a positive integer'
        });
      }

      const price = item.price !== undefined ? Number(item.price) : variant.sellingPrice;
      const total = qty * price;
      totalAmount += total;

      processedItems.push({
        productId: variant.productId._id,
        variantId: variant._id,
        productName: variant.productId.name,
        sku: variant.sku,
        size: variant.size,
        colour: variant.colour,
        quantity: qty,
        price,
        total
      });
    }

    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      deliveryAddress: deliveryAddress.trim(),
      locationId,
      items: processedItems,
      totalAmount,
      orderStatus: 'NEW',
      isReserved: false,
      isStockDeducted: false,
      statusTimeline: [
        {
          status: 'NEW',
          updatedBy: req.user._id,
          timestamp: new Date(),
          notes: 'Order Created'
        }
      ],
      createdBy: req.user._id,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: `Order #${orderNumber} created successfully`,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update Order Status (Enforcing status transitions & stock reservation/dispatch)
// @route PATCH /api/orders/:id/status
// @access Private (Admin, Manager, Staff)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const targetStatus = (status || '').toUpperCase();

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const currentStatus = order.orderStatus;
    if (currentStatus === targetStatus) {
      return res.status(400).json({
        success: false,
        message: `Order is already in ${currentStatus} status`
      });
    }

    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${targetStatus}. Allowed: ${
          allowedNext.join(', ') || 'None'
        }`
      });
    }

    // Handle Reservation Logic on CONFIRMED
    if (targetStatus === 'CONFIRMED') {
      const check = await checkOrderStockAvailability(order.items, order.locationId);
      if (!check.available) {
        return res.status(400).json({
          success: false,
          message: check.error
        });
      }

      await reserveOrderItems(order.items, order.locationId);
      order.isReserved = true;
    }

    // Handle Cancellation: Release reserved stock if reserved
    if (targetStatus === 'CANCELLED') {
      if (order.isReserved && !order.isStockDeducted) {
        await releaseOrderItems(order.items, order.locationId);
        order.isReserved = false;
      }
    }

    // Handle Dispatch: Deduct physical stock & release reservation
    if (targetStatus === 'DISPATCHED') {
      if (!order.isStockDeducted) {
        await dispatchOrderItems(
          order.items,
          order.locationId,
          order.customerName,
          order._id,
          req.user._id
        );
        order.isStockDeducted = true;
        order.isReserved = false;
      }
    }

    order.orderStatus = targetStatus;
    order.statusTimeline.push({
      status: targetStatus,
      updatedBy: req.user._id,
      timestamp: new Date(),
      notes: notes || `Status changed to ${targetStatus}`
    });

    await order.save();

    res.json({
      success: true,
      message: `Order status updated to ${targetStatus}`,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc Soft delete order
// @route DELETE /api/orders/:id
// @access Private (Admin)
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Optional: Only allow deleting CANCELLED or RETURNED orders? We'll just allow it for now.
    order.isDeleted = true;
    order.deletedAt = new Date();
    await order.save();

    res.json({ success: true, message: 'Order moved to trash' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
};
