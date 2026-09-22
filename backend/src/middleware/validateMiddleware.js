const mongoose = require('mongoose');

const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for ${paramName}`
      });
    }
    next();
  };
};

const validatePositiveQuantity = (bodyField = 'quantity') => {
  return (req, res, next) => {
    const val = Number(req.body[bodyField]);
    if (isNaN(val) || val <= 0) {
      return res.status(400).json({
        success: false,
        message: `${bodyField} must be a valid positive number greater than zero`
      });
    }
    req.body[bodyField] = val;
    next();
  };
};

module.exports = { validateObjectId, validatePositiveQuantity };
