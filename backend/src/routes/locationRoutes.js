const express = require('express');
const router = express.Router();
const {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation
} = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getLocations)
  .post(authorize('ADMIN', 'STAFF'), createLocation);

router
  .route('/:id')
  .put(authorize('ADMIN', 'STAFF'), updateLocation)
  .delete(authorize('ADMIN', 'STAFF'), deleteLocation);

module.exports = router;
