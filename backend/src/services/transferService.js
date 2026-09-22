const Transfer = require('../models/Transfer');
const { transferStock } = require('./stockService');
const { generateTransferNumber } = require('../utils/generateTransferNumber');

const executeTransfer = async ({
  fromLocationId,
  toLocationId,
  variantId,
  productId,
  quantity,
  userId,
  notes
}) => {
  const transferNumber = await generateTransferNumber();

  const stockResult = await transferStock({
    fromLocationId,
    toLocationId,
    variantId,
    quantity,
    userId,
    notes,
    transferNumber
  });

  const transferDoc = await Transfer.create({
    transferNumber,
    fromLocationId,
    toLocationId,
    variantId,
    productId,
    quantity,
    status: 'COMPLETED',
    performedBy: userId,
    notes
  });

  return { transfer: transferDoc, stockResult };
};

module.exports = { executeTransfer };
