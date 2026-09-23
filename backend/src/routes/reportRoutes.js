const express = require('express');
const router = express.Router();
const {
  getStockReport,
  getSalesReport,
  getPurchaseReport,
  getStockMovementReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/stock', getStockReport);
router.get('/sales', getSalesReport);
router.get('/purchases', getPurchaseReport);
router.get('/movements', getStockMovementReport);

module.exports = router;
