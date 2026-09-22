const reportService = require('../services/reportService');

// @desc Get Stock Report (JSON or Excel or PDF)
// @route GET /api/reports/stock
// @access Private (Admin, Manager)
const getStockReport = async (req, res, next) => {
  try {
    const { locationId, variantId, export: exportType } = req.query;

    const data = await reportService.getStockReport({ locationId, variantId });

    if (exportType === 'excel') {
      const columns = [
        { header: 'Product', key: 'productName', width: 25 },
        { header: 'Category', key: 'category', width: 18 },
        { header: 'SKU', key: 'sku', width: 18 },
        { header: 'Size', key: 'size', width: 10 },
        { header: 'Colour', key: 'colour', width: 14 },
        { header: 'Location', key: 'location', width: 22 },
        { header: 'Total Stock', key: 'totalStock', width: 14 },
        { header: 'Reserved', key: 'reservedStock', width: 12 },
        { header: 'Available', key: 'availableStock', width: 14 },
        { header: 'Damaged', key: 'damagedStock', width: 12 },
        { header: 'Status', key: 'status', width: 15 }
      ];

      const buffer = await reportService.generateExcelBuffer('Stock Report', columns, data);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=stock-report.xlsx');
      return res.send(buffer);
    }

    if (exportType === 'pdf') {
      const columns = [
        { header: 'Product', key: 'productName' },
        { header: 'SKU', key: 'sku' },
        { header: 'Size', key: 'size' },
        { header: 'Colour', key: 'colour' },
        { header: 'Location', key: 'location' },
        { header: 'Total', key: 'totalStock' },
        { header: 'Reserved', key: 'reservedStock' },
        { header: 'Available', key: 'availableStock' }
      ];

      const buffer = await reportService.generatePdfBuffer('Inventory Stock Report', columns, data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=stock-report.pdf');
      return res.send(buffer);
    }

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Sales Report
// @route GET /api/reports/sales
// @access Private (Admin, Manager)
const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, locationId, export: exportType } = req.query;

    const data = await reportService.getSalesReport({ startDate, endDate, locationId });

    if (exportType === 'excel') {
      const columns = [
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Order #', key: 'orderNumber', width: 20 },
        { header: 'Customer', key: 'customerName', width: 20 },
        { header: 'Product', key: 'productName', width: 22 },
        { header: 'SKU', key: 'sku', width: 16 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Qty', key: 'quantity', width: 10 },
        { header: 'Price (₹)', key: 'price', width: 12 },
        { header: 'Total (₹)', key: 'total', width: 14 },
        { header: 'Status', key: 'status', width: 14 }
      ];

      const buffer = await reportService.generateExcelBuffer('Sales Report', columns, data);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
      return res.send(buffer);
    }

    if (exportType === 'pdf') {
      const columns = [
        { header: 'Date', key: 'date' },
        { header: 'Order #', key: 'orderNumber' },
        { header: 'Customer', key: 'customerName' },
        { header: 'SKU', key: 'sku' },
        { header: 'Qty', key: 'quantity' },
        { header: 'Price', key: 'price' },
        { header: 'Total', key: 'total' }
      ];

      const buffer = await reportService.generatePdfBuffer('Sales Order Report', columns, data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
      return res.send(buffer);
    }

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Purchase Report
// @route GET /api/reports/purchases
// @access Private (Admin, Manager)
const getPurchaseReport = async (req, res, next) => {
  try {
    const { startDate, endDate, locationId, vendorId, export: exportType } = req.query;

    const data = await reportService.getPurchaseReport({
      startDate,
      endDate,
      locationId,
      vendorId
    });

    if (exportType === 'excel') {
      const columns = [
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Product', key: 'productName', width: 22 },
        { header: 'SKU', key: 'sku', width: 16 },
        { header: 'Vendor', key: 'vendor', width: 22 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Qty', key: 'quantity', width: 10 },
        { header: 'Purchase Price (₹)', key: 'purchasePrice', width: 18 },
        { header: 'Total Amount (₹)', key: 'totalAmount', width: 18 },
        { header: 'Performed By', key: 'performedBy', width: 16 }
      ];

      const buffer = await reportService.generateExcelBuffer('Purchase Report', columns, data);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=purchase-report.xlsx');
      return res.send(buffer);
    }

    if (exportType === 'pdf') {
      const columns = [
        { header: 'Date', key: 'date' },
        { header: 'Product', key: 'productName' },
        { header: 'SKU', key: 'sku' },
        { header: 'Vendor', key: 'vendor' },
        { header: 'Qty', key: 'quantity' },
        { header: 'Price', key: 'purchasePrice' },
        { header: 'Total', key: 'totalAmount' }
      ];

      const buffer = await reportService.generatePdfBuffer('Purchase Report', columns, data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=purchase-report.pdf');
      return res.send(buffer);
    }

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Stock Movement Report
// @route GET /api/reports/movements
// @access Private (Admin, Manager)
const getStockMovementReport = async (req, res, next) => {
  try {
    const { startDate, endDate, movementType, locationId, variantId, export: exportType } =
      req.query;

    const data = await reportService.getStockMovementReport({
      startDate,
      endDate,
      movementType,
      locationId,
      variantId
    });

    if (exportType === 'excel') {
      const columns = [
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Product', key: 'productName', width: 22 },
        { header: 'SKU', key: 'sku', width: 16 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Type', key: 'movementType', width: 16 },
        { header: 'Qty', key: 'quantity', width: 10 },
        { header: 'Previous', key: 'previousQuantity', width: 12 },
        { header: 'New', key: 'newQuantity', width: 12 },
        { header: 'Reason', key: 'reason', width: 24 },
        { header: 'Reference', key: 'reference', width: 20 },
        { header: 'User', key: 'user', width: 16 }
      ];

      const buffer = await reportService.generateExcelBuffer(
        'Stock Movements Report',
        columns,
        data
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=stock-movements.xlsx');
      return res.send(buffer);
    }

    if (exportType === 'pdf') {
      const columns = [
        { header: 'Date', key: 'date' },
        { header: 'SKU', key: 'sku' },
        { header: 'Location', key: 'location' },
        { header: 'Type', key: 'movementType' },
        { header: 'Qty', key: 'quantity' },
        { header: 'Prev', key: 'previousQuantity' },
        { header: 'New', key: 'newQuantity' },
        { header: 'User', key: 'user' }
      ];

      const buffer = await reportService.generatePdfBuffer(
        'Stock Movements Audit Report',
        columns,
        data
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=stock-movements.pdf');
      return res.send(buffer);
    }

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStockReport,
  getSalesReport,
  getPurchaseReport,
  getStockMovementReport
};
