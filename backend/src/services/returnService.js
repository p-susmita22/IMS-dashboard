const Return = require('../models/Return');
const { processGoodReturn, processDamagedReturn } = require('./stockService');
const { generateReturnNumber } = require('../utils/generateTransferNumber');

const executeReturn = async ({
  orderId,
  customerName,
  variantId,
  productId,
  locationId,
  quantity,
  condition,
  reason,
  userId,
  notes
}) => {
  const returnNumber = await generateReturnNumber();

  let stockResult;
  if (condition === 'GOOD') {
    stockResult = await processGoodReturn({
      variantId,
      locationId,
      quantity,
      customerName,
      orderId,
      userId,
      reason,
      notes,
      returnNumber
    });
  } else {
    stockResult = await processDamagedReturn({
      variantId,
      locationId,
      quantity,
      customerName,
      orderId,
      userId,
      reason,
      notes,
      returnNumber
    });
  }

  const returnDoc = await Return.create({
    returnNumber,
    orderId: orderId || null,
    customerName,
    variantId,
    productId,
    locationId,
    quantity,
    condition,
    reason,
    handledBy: userId,
    notes
  });

  return { returnRecord: returnDoc, stockResult };
};

module.exports = { executeReturn };
