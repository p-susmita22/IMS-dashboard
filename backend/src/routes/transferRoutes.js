const express = require('express');
const router = express.Router();
const { getTransfers, createTransfer } = require('../controllers/transferController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getTransfers)
  .post(authorize('ADMIN', 'MANAGER'), createTransfer);

module.exports = router;
