const express = require('express');
const router = express.Router();
const {
  getAdjustments,
  createAdjustment,
  approveAdjustment,
  rejectAdjustment
} = require('../controllers/adjustmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getAdjustments)
  .post(createAdjustment);

router.patch('/:id/approve', authorize('ADMIN'), approveAdjustment);
router.patch('/:id/reject', authorize('ADMIN'), rejectAdjustment);

module.exports = router;
