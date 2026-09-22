const Order = require('../models/Order');

const generateOrderNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ORD-${dateStr}-`;

  const lastOrder = await Order.findOne({
    orderNumber: new RegExp(`^${prefix}`)
  }).sort({ createdAt: -1 });

  let sequence = 1;
  if (lastOrder && lastOrder.orderNumber) {
    const parts = lastOrder.orderNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

module.exports = { generateOrderNumber };
