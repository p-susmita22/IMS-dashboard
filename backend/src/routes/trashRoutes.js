const express = require('express');
const router = express.Router();
const {
  getTrash,
  restoreItem,
  hardDeleteItem,
  emptyTrash
} = require('../controllers/trashController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('ADMIN', 'STAFF'));

router.get('/', getTrash);
router.delete('/empty', emptyTrash);
router.put('/:type/:id/restore', restoreItem);
router.delete('/:type/:id', hardDeleteItem);

module.exports = router;
