const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true
    },
    brand: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    productImage: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    defaultVendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    defaultLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location'
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

productSchema.index({ name: 'text', category: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
