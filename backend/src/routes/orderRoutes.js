const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getOrders)
  .post(createOrder);

router
  .route('/:id')
  .get(getOrderById)
  .delete(authorize('ADMIN'), deleteOrder);
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
