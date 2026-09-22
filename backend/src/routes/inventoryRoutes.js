const express = require('express');
const router = express.Router();
const {
  getInventory,
  getVariantInventory,
  stockIn,
  stockOut,
  getMovements,
  globalSearch,
  getDashboardSummary
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardSummary);
router.get('/search', globalSearch);
router.get('/movements', getMovements);
router.post('/stock-in', stockIn);
router.post('/stock-out', stockOut);
router.get('/', getInventory);
router.get('/:variantId', getVariantInventory);

module.exports = router;
