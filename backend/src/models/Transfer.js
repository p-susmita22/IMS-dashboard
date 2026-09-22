const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema(
  {
    transferNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    fromLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    toLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
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
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Transfer quantity must be at least 1']
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'CANCELLED'],
      default: 'COMPLETED'
    },
    performedBy: {
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

module.exports = mongoose.model('Transfer', transferSchema);
