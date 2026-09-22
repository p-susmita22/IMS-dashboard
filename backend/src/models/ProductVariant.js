const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true
    },
    size: {
      type: String,
      required: [true, 'Size is required'],
      trim: true
    },
    colour: {
      type: String,
      required: [true, 'Colour is required'],
      trim: true
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    barcode: {
      type: String,
      trim: true,
      default: '',
      index: true
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
      default: 0
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
      default: 0
    },
    minimumStockLevel: {
      type: Number,
      required: [true, 'Minimum stock level is required'],
      min: [0, 'Minimum stock cannot be negative'],
      default: 10
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

productVariantSchema.index({ productId: 1, size: 1, colour: 1 }, { unique: true });

module.exports = mongoose.model('ProductVariant', productVariantSchema);
