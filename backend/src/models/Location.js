const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Location code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    contactNumber: {
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

module.exports = mongoose.model('Location', locationSchema);
