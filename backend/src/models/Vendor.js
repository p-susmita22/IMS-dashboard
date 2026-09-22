const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    contactPerson: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
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

module.exports = mongoose.model('Vendor', vendorSchema);
