const mongoose = require('mongoose');

const adjustmentSchema = new mongoose.Schema(
  {
    adjustmentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
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
    systemStock: {
      type: Number,
      required: true
    },
    physicalCount: {
      type: Number,
      required: true,
      min: [0, 'Physical count cannot be negative']
    },
    difference: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      enum: ['Damaged', 'Missing', 'Counting Error', 'Other'],
      required: true
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Adjustment', adjustmentSchema);
