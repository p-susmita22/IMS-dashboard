const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const StockMovement = require('../models/StockMovement');

/**
 * Get Stock Report Data
 */
const getStockReport = async (filters = {}) => {
  const query = {};
  if (filters.locationId) query.locationId = filters.locationId;
  if (filters.variantId) query.variantId = filters.variantId;

  const inventoryItems = await Inventory.find(query)
    .populate({
      path: 'variantId',
      populate: { path: 'productId' }
    })
    .populate('locationId');

  return inventoryItems
    .filter((item) => item.variantId && item.variantId.productId && item.locationId)
    .map((item) => {
      const p = item.variantId.productId;
      const v = item.variantId;
      const l = item.locationId;
      const available = Math.max(0, item.quantity - item.reservedQuantity);

      return {
        productName: p.name,
        category: p.category,
        sku: v.sku,
        size: v.size,
        colour: v.colour,
        location: l.name,
        totalStock: item.quantity,
        reservedStock: item.reservedQuantity,
        availableStock: available,
        damagedStock: item.damagedQuantity,
        status:
          available === 0
            ? 'OUT_OF_STOCK'
            : available <= v.minimumStockLevel
            ? 'LOW_STOCK'
            : 'IN_STOCK'
      };
    });
};

/**
 * Get Sales Report Data
 */
const getSalesReport = async (filters = {}) => {
  const query = { orderStatus: { $nin: ['CANCELLED'] } };
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }
  if (filters.locationId) query.locationId = filters.locationId;

  const orders = await Order.find(query)
    .populate('locationId')
    .sort({ createdAt: -1 });

  const salesRows = [];
  for (const o of orders) {
    for (const item of o.items) {
      salesRows.push({
        date: o.createdAt.toISOString().slice(0, 10),
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        productName: item.productName,
        sku: item.sku,
        size: item.size,
        colour: item.colour,
        location: o.locationId ? o.locationId.name : 'N/A',
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        status: o.orderStatus
      });
    }
  }
  return salesRows;
};

/**
 * Get Purchase Report Data (Derived from STOCK_IN movements)
 */
const getPurchaseReport = async (filters = {}) => {
  const query = { movementType: 'STOCK_IN' };
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }
  if (filters.locationId) query.locationId = filters.locationId;
  if (filters.vendorId) query.vendorId = filters.vendorId;

  const movements = await StockMovement.find(query)
    .populate({
      path: 'variantId',
      populate: { path: 'productId' }
    })
    .populate('locationId')
    .populate('vendorId')
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 });

  return movements
    .filter((m) => m.variantId && m.variantId.productId && m.locationId)
    .map((m) => {
      const p = m.variantId.productId;
      const v = m.variantId;
      const l = m.locationId;
      const vendor = m.vendorId ? m.vendorId.name : 'Direct Purchase';

      return {
        date: m.createdAt.toISOString().slice(0, 10),
        productName: p.name,
        sku: v.sku,
        size: v.size,
        colour: v.colour,
        vendor,
        location: l.name,
        quantity: m.quantity,
        purchasePrice: m.unitPrice || v.purchasePrice || 0,
        totalAmount: m.quantity * (m.unitPrice || v.purchasePrice || 0),
        performedBy: m.performedBy ? m.performedBy.name : 'System'
      };
    });
};

/**
 * Get Stock Movement Report Data
 */
const getStockMovementReport = async (filters = {}) => {
  const query = {};
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }
  if (filters.movementType) query.movementType = filters.movementType;
  if (filters.locationId) query.locationId = filters.locationId;
  if (filters.variantId) query.variantId = filters.variantId;

  const movements = await StockMovement.find(query)
    .populate({
      path: 'variantId',
      populate: { path: 'productId' }
    })
    .populate('locationId')
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(1000);

  return movements
    .filter((m) => m.variantId && m.variantId.productId && m.locationId)
    .map((m) => {
      const p = m.variantId.productId;
      const v = m.variantId;
      const l = m.locationId;

      return {
        date: m.createdAt.toISOString().slice(0, 10),
        productName: p.name,
        sku: v.sku,
        location: l.name,
        movementType: m.movementType,
        quantity: m.quantity,
        previousQuantity: m.previousQuantity,
        newQuantity: m.newQuantity,
        reason: m.reason || m.notes || '-',
        reference: m.referenceId || m.referenceType || '-',
        user: m.performedBy ? m.performedBy.name : 'System'
      };
    });
};

/**
 * Generate Excel Buffer from columns and data
 */
const generateExcelBuffer = async (title, columns, data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title);

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 18
  }));

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' } // Dark slate
  };

  data.forEach((row) => {
    worksheet.addRow(row);
  });

  return await workbook.xlsx.writeBuffer();
};

/**
 * Generate PDF buffer using PDFKit
 */
const generatePdfBuffer = (title, columns, data) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    doc.fontSize(16).text(title, { align: 'center' });
    doc.fontSize(9).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1);

    // Simple text tabular view
    const colKeys = columns.map((c) => c.key);
    const colHeaders = columns.map((c) => c.header);
    const colWidth = Math.floor(780 / columns.length);

    let y = doc.y;
    doc.fontSize(8).fillColor('#1E293B');
    colHeaders.forEach((h, i) => {
      doc.text(h, 30 + i * colWidth, y, { width: colWidth - 5, lineBreak: false });
    });
    doc.moveDown(0.5);
    doc.moveTo(30, doc.y).lineTo(810, doc.y).stroke('#CBD5E1');
    doc.moveDown(0.5);

    data.slice(0, 150).forEach((row) => {
      if (doc.y > 520) {
        doc.addPage({ layout: 'landscape', margin: 30 });
      }
      const currentY = doc.y;
      doc.fontSize(7).fillColor('#334155');
      colKeys.forEach((key, i) => {
        const textVal = String(row[key] !== undefined ? row[key] : '');
        doc.text(textVal, 30 + i * colWidth, currentY, { width: colWidth - 5, lineBreak: false });
      });
      doc.moveDown(0.4);
    });

    doc.end();
  });
};

module.exports = {
  getStockReport,
  getSalesReport,
  getPurchaseReport,
  getStockMovementReport,
  generateExcelBuffer,
  generatePdfBuffer
};
