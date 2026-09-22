const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: [true, 'Variant ID is required'],
      index: true
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location ID is required'],
      index: true
    },
    movementType: {
      type: String,
      enum: [
        'STOCK_IN',
        'STOCK_OUT',
        'TRANSFER_IN',
        'TRANSFER_OUT',
        'RETURN_GOOD',
        'RETURN_DAMAGED',
        'ADJUSTMENT'
      ],
      required: [true, 'Movement type is required'],
      index: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required']
    },
    previousQuantity: {
      type: Number,
      required: true,
      default: 0
    },
    newQuantity: {
      type: Number,
      required: true,
      default: 0
    },
    unitPrice: {
      type: Number,
      default: 0
    },
    reason: {
      type: String,
      default: ''
    },
    referenceType: {
      type: String,
      enum: ['PURCHASE', 'SALE', 'ORDER', 'TRANSFER', 'RETURN', 'ADJUSTMENT', 'INITIAL', 'OTHER'],
      default: 'OTHER'
    },
    referenceId: {
      type: String,
      default: ''
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    customerName: {
      type: String,
      default: ''
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
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

stockMovementSchema.index({ variantId: 1, locationId: 1, createdAt: -1 });
stockMovementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
