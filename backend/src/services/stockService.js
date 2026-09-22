const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const { supportsTransactions } = require('../config/db');

/**
 * Executes a callback within a MongoDB session/transaction if supported,
 * or safely directly if standalone.
 */
const runTransaction = async (callback) => {
  if (supportsTransactions()) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } else {
    return await callback(null);
  }
};

/**
 * Get or create an Inventory record for (variantId, locationId)
 */
const getOrCreateInventory = async (variantId, locationId, session = null) => {
  let query = Inventory.findOne({ variantId, locationId });
  if (session) query = query.session(session);
  let inv = await query;

  if (!inv) {
    const docs = await Inventory.create(
      [
        {
          variantId,
          locationId,
          quantity: 0,
          reservedQuantity: 0,
          damagedQuantity: 0
        }
      ],
      session ? { session } : {}
    );
    inv = docs[0];
  }
  return inv;
};

/**
 * ADD STOCK (Purchase / Stock In)
 */
const addStock = async ({
  variantId,
  locationId,
  quantity,
  purchasePrice = 0,
  vendorId = null,
  userId,
  notes = '',
  referenceType = 'PURCHASE',
  referenceId = ''
}) => {
  return await runTransaction(async (session) => {
    const inv = await getOrCreateInventory(variantId, locationId, session);

    const previousQuantity = inv.quantity;
    inv.quantity += quantity;
    const newQuantity = inv.quantity;

    await inv.save(session ? { session } : {});

    const movementDocs = await StockMovement.create(
      [
        {
          variantId,
          locationId,
          movementType: 'STOCK_IN',
          quantity,
          previousQuantity,
          newQuantity,
          unitPrice: purchasePrice,
          vendorId,
          performedBy: userId,
          referenceType,
          referenceId,
          notes
        }
      ],
      session ? { session } : {}
    );

    return {
      inventory: inv,
      movement: movementDocs[0]
    };
  });
};

/**
 * STOCK OUT (Sale / Manual stock reduction)
 */
const removeStock = async ({
  variantId,
  locationId,
  quantity,
  customerName = '',
  orderId = null,
  userId,
  reason = 'Sale',
  notes = '',
  referenceType = 'SALE',
  referenceId = ''
}) => {
  return await runTransaction(async (session) => {
    const inv = await getOrCreateInventory(variantId, locationId, session);

    const available = Math.max(0, inv.quantity - inv.reservedQuantity);
    if (quantity > available) {
      const error = new Error(
        `Insufficient available stock. Available: ${available}, Requested: ${quantity}`
      );
      error.statusCode = 400;
      throw error;
    }

    const previousQuantity = inv.quantity;
    inv.quantity -= quantity;
    const newQuantity = inv.quantity;

    await inv.save(session ? { session } : {});

    const movementDocs = await StockMovement.create(
      [
        {
          variantId,
          locationId,
          movementType: 'STOCK_OUT',
          quantity,
          previousQuantity,
          newQuantity,
          customerName,
          orderId,
          performedBy: userId,
          reason,
          referenceType,
          referenceId,
          notes
        }
      ],
      session ? { session } : {}
    );

    return {
      inventory: inv,
      movement: movementDocs[0]
    };
  });
};

/**
 * RESERVE STOCK (When order is confirmed)
 */
const reserveStock = async ({ variantId, locationId, quantity, session = null }) => {
  const inv = await getOrCreateInventory(variantId, locationId, session);

  const available = Math.max(0, inv.quantity - inv.reservedQuantity);
  if (quantity > available) {
    const error = new Error(
      `Cannot reserve stock for variant ${variantId}. Available: ${available}, Requested: ${quantity}`
    );
    error.statusCode = 400;
    throw error;
  }

  inv.reservedQuantity += quantity;
  await inv.save(session ? { session } : {});
  return inv;
};

/**
 * RELEASE RESERVATION (When order is cancelled)
 */
const releaseReservation = async ({ variantId, locationId, quantity, session = null }) => {
  const inv = await getOrCreateInventory(variantId, locationId, session);
  inv.reservedQuantity = Math.max(0, inv.reservedQuantity - quantity);
  await inv.save(session ? { session } : {});
  return inv;
};

/**
 * DISPATCH RESERVED STOCK (Converts reservation to actual stock out)
 */
const dispatchReservedStock = async ({
  variantId,
  locationId,
  quantity,
  customerName = '',
  orderId = null,
  userId,
  notes = 'Order Dispatched',
  session = null
}) => {
  const inv = await getOrCreateInventory(variantId, locationId, session);

  const previousQuantity = inv.quantity;
  inv.quantity = Math.max(0, inv.quantity - quantity);
  inv.reservedQuantity = Math.max(0, inv.reservedQuantity - quantity);
  const newQuantity = inv.quantity;

  await inv.save(session ? { session } : {});

  const movementDocs = await StockMovement.create(
    [
      {
        variantId,
        locationId,
        movementType: 'STOCK_OUT',
        quantity,
        previousQuantity,
        newQuantity,
        customerName,
        orderId,
        performedBy: userId,
        reason: 'Order Fulfillment Dispatch',
        referenceType: 'ORDER',
        referenceId: orderId ? orderId.toString() : '',
        notes
      }
    ],
    session ? { session } : {}
  );

  return {
    inventory: inv,
    movement: movementDocs[0]
  };
};

/**
 * TRANSFER STOCK (Between Warehouses)
 */
const transferStock = async ({
  fromLocationId,
  toLocationId,
  variantId,
  quantity,
  userId,
  notes = '',
  transferNumber = ''
}) => {
  if (fromLocationId.toString() === toLocationId.toString()) {
    const err = new Error('Source and destination locations cannot be the same');
    err.statusCode = 400;
    throw err;
  }

  return await runTransaction(async (session) => {
    const sourceInv = await getOrCreateInventory(variantId, fromLocationId, session);
    const availableSource = Math.max(0, sourceInv.quantity - sourceInv.reservedQuantity);

    if (quantity > availableSource) {
      const err = new Error(
        `Insufficient available stock at source location. Available: ${availableSource}, Requested: ${quantity}`
      );
      err.statusCode = 400;
      throw err;
    }

    const targetInv = await getOrCreateInventory(variantId, toLocationId, session);

    // Source Deduct
    const srcPrev = sourceInv.quantity;
    sourceInv.quantity -= quantity;
    const srcNew = sourceInv.quantity;
    await sourceInv.save(session ? { session } : {});

    // Target Add
    const tgtPrev = targetInv.quantity;
    targetInv.quantity += quantity;
    const tgtNew = targetInv.quantity;
    await targetInv.save(session ? { session } : {});

    // Create Out Movement at Source
    const outDocs = await StockMovement.create(
      [
        {
          variantId,
          locationId: fromLocationId,
          movementType: 'TRANSFER_OUT',
          quantity,
          previousQuantity: srcPrev,
          newQuantity: srcNew,
          performedBy: userId,
          referenceType: 'TRANSFER',
          referenceId: transferNumber,
          notes: `Transferred to warehouse ID: ${toLocationId}. ${notes}`
        }
      ],
      session ? { session } : {}
    );

    // Create In Movement at Destination
    const inDocs = await StockMovement.create(
      [
        {
          variantId,
          locationId: toLocationId,
          movementType: 'TRANSFER_IN',
          quantity,
          previousQuantity: tgtPrev,
          newQuantity: tgtNew,
          performedBy: userId,
          referenceType: 'TRANSFER',
          referenceId: transferNumber,
          notes: `Received from warehouse ID: ${fromLocationId}. ${notes}`
        }
      ],
      session ? { session } : {}
    );

    return {
      sourceInventory: sourceInv,
      targetInventory: targetInv,
      outMovement: outDocs[0],
      inMovement: inDocs[0]
    };
  });
};

/**
 * PROCESS GOOD RETURN (Returns item into available stock)
 */
const processGoodReturn = async ({
  variantId,
  locationId,
  quantity,
  customerName = '',
  orderId = null,
  userId,
  reason = 'Customer Return - Good Condition',
  notes = '',
  returnNumber = ''
}) => {
  return await runTransaction(async (session) => {
    const inv = await getOrCreateInventory(variantId, locationId, session);

    const previousQuantity = inv.quantity;
    inv.quantity += quantity;
    const newQuantity = inv.quantity;

    await inv.save(session ? { session } : {});

    const movementDocs = await StockMovement.create(
      [
        {
          variantId,
          locationId,
          movementType: 'RETURN_GOOD',
          quantity,
          previousQuantity,
          newQuantity,
          customerName,
          orderId,
          performedBy: userId,
          reason,
          referenceType: 'RETURN',
          referenceId: returnNumber,
          notes
        }
      ],
      session ? { session } : {}
    );

    return {
      inventory: inv,
      movement: movementDocs[0]
    };
  });
};

/**
 * PROCESS DAMAGED RETURN (Increases damaged stock, physical/available stock NOT increased)
 */
const processDamagedReturn = async ({
  variantId,
  locationId,
  quantity,
  customerName = '',
  orderId = null,
  userId,
  reason = 'Customer Return - Damaged Condition',
  notes = '',
  returnNumber = ''
}) => {
  return await runTransaction(async (session) => {
    const inv = await getOrCreateInventory(variantId, locationId, session);

    // Damaged returns do NOT increase available stock. They increase damagedQuantity.
    inv.damagedQuantity += quantity;
    await inv.save(session ? { session } : {});

    const movementDocs = await StockMovement.create(
      [
        {
          variantId,
          locationId,
          movementType: 'RETURN_DAMAGED',
          quantity,
          previousQuantity: inv.quantity,
          newQuantity: inv.quantity,
          customerName,
          orderId,
          performedBy: userId,
          reason,
          referenceType: 'RETURN',
          referenceId: returnNumber,
          notes: `Damaged item isolated. ${notes}`
        }
      ],
      session ? { session } : {}
    );

    return {
      inventory: inv,
      movement: movementDocs[0]
    };
  });
};

/**
 * STOCK ADJUSTMENT
 */
const adjustStock = async ({
  variantId,
  locationId,
  physicalCount,
  reason,
  notes = '',
  userId,
  adjustmentNumber = ''
}) => {
  return await runTransaction(async (session) => {
    const inv = await getOrCreateInventory(variantId, locationId, session);

    const previousQuantity = inv.quantity;
    const difference = physicalCount - previousQuantity;
    inv.quantity = physicalCount;
    const newQuantity = inv.quantity;

    await inv.save(session ? { session } : {});

    const movementDocs = await StockMovement.create(
      [
        {
          variantId,
          locationId,
          movementType: 'ADJUSTMENT',
          quantity: Math.abs(difference),
          previousQuantity,
          newQuantity,
          performedBy: userId,
          reason,
          referenceType: 'ADJUSTMENT',
          referenceId: adjustmentNumber,
          notes: `Count difference: ${difference > 0 ? '+' + difference : difference}. ${notes}`
        }
      ],
      session ? { session } : {}
    );

    return {
      inventory: inv,
      movement: movementDocs[0],
      difference
    };
  });
};

module.exports = {
  runTransaction,
  getOrCreateInventory,
  addStock,
  removeStock,
  reserveStock,
  releaseReservation,
  dispatchReservedStock,
  transferStock,
  processGoodReturn,
  processDamagedReturn,
  adjustStock
};
