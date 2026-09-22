const express = require('express');
const router = express.Router();
const {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor
} = require('../controllers/vendorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getVendors)
  .post(authorize('ADMIN', 'STAFF'), createVendor);

router
  .route('/:id')
  .get(getVendorById)
  .put(authorize('ADMIN', 'STAFF'), updateVendor)
  .delete(authorize('ADMIN', 'STAFF'), deleteVendor);

module.exports = router;
