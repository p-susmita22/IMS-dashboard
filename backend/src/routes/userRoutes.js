const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('ADMIN'));

router
  .route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id').put(updateUser);
router.patch('/:id/status', updateUserStatus);

module.exports = router;
