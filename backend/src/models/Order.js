const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    sku: {
      type: String,
      required: true
    },
    size: {
      type: String,
      required: true
    },
    colour: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const statusTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      index: true
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Warehouse location is required'],
      index: true
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    orderStatus: {
      type: String,
      enum: ['NEW', 'CONFIRMED', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURNED'],
      default: 'NEW',
      index: true
    },
    isReserved: {
      type: Boolean,
      default: false
    },
    isStockDeducted: {
      type: Boolean,
      default: false
    },
    statusTimeline: [statusTimelineSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      default: ''
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ orderStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
