const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Return quantity must be at least 1']
    },
    condition: {
      type: String,
      enum: ['GOOD', 'DAMAGED'],
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Return', returnSchema);
