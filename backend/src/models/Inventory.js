const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
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
    quantity: {
      type: Number,
      required: [true, 'Physical stock quantity is required'],
      min: [0, 'Physical stock cannot be negative'],
      default: 0
    },
    reservedQuantity: {
      type: Number,
      required: true,
      min: [0, 'Reserved stock cannot be negative'],
      default: 0
    },
    damagedQuantity: {
      type: Number,
      required: true,
      min: [0, 'Damaged stock cannot be negative'],
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

inventorySchema.virtual('availableStock').get(function () {
  return Math.max(0, (this.quantity || 0) - (this.reservedQuantity || 0));
});

inventorySchema.index({ variantId: 1, locationId: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
