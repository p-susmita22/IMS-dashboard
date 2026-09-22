const Transfer = require('../models/Transfer');
const Return = require('../models/Return');
const Adjustment = require('../models/Adjustment');

const generateTransferNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `TRF-${dateStr}-`;
  const count = await Transfer.countDocuments();
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
};

const generateReturnNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `RET-${dateStr}-`;
  const count = await Return.countDocuments();
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
};

const generateAdjustmentNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ADJ-${dateStr}-`;
  const count = await Adjustment.countDocuments();
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
};

module.exports = {
  generateTransferNumber,
  generateReturnNumber,
  generateAdjustmentNumber
};
