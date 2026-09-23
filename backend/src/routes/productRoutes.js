const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/categories', getCategories);

router
  .route('/')
  .get(getProducts)
  .post(authorize('ADMIN', 'MANAGER', 'STAFF'), createProduct);

router
  .route('/:id')
  .get(getProductById)
  .put(authorize('ADMIN', 'MANAGER', 'STAFF'), updateProduct)
  .delete(authorize('ADMIN', 'MANAGER', 'STAFF'), deleteProduct);

router.post('/:id/variants', authorize('ADMIN', 'MANAGER', 'STAFF'), createVariant);
router.put('/variants/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), updateVariant);

module.exports = router;
