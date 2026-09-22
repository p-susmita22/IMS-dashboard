const { reserveStock, releaseReservation, dispatchReservedStock } = require('./stockService');
const Inventory = require('../models/Inventory');

/**
 * Validates that all items in an order have sufficient available stock.
 */
const checkOrderStockAvailability = async (items, locationId) => {
  for (const item of items) {
    const inv = await Inventory.findOne({
      variantId: item.variantId,
      locationId
    });
    const currentQty = inv ? inv.quantity : 0;
    const reservedQty = inv ? inv.reservedQuantity : 0;
    const available = Math.max(0, currentQty - reservedQty);

    if (item.quantity > available) {
      return {
        available: false,
        error: `Insufficient stock for SKU ${item.sku} (${item.productName} - ${item.size}/${item.colour}). Available: ${available}, Required: ${item.quantity}`
      };
    }
  }
  return { available: true };
};

/**
 * Reserve stock for all items in an order
 */
const reserveOrderItems = async (items, locationId) => {
  for (const item of items) {
    await reserveStock({
      variantId: item.variantId,
      locationId,
      quantity: item.quantity
    });
  }
};

/**
 * Release reserved stock for all items in an order
 */
const releaseOrderItems = async (items, locationId) => {
  for (const item of items) {
    await releaseReservation({
      variantId: item.variantId,
      locationId,
      quantity: item.quantity
    });
  }
};

/**
 * Dispatch reserved stock for all items in an order
 */
const dispatchOrderItems = async (items, locationId, customerName, orderId, userId) => {
  for (const item of items) {
    await dispatchReservedStock({
      variantId: item.variantId,
      locationId,
      quantity: item.quantity,
      customerName,
      orderId,
      userId,
      notes: `Dispatched order #${orderId}`
    });
  }
};

module.exports = {
  checkOrderStockAvailability,
  reserveOrderItems,
  releaseOrderItems,
  dispatchOrderItems
};
