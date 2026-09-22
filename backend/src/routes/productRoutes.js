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
  .post(authorize('ADMIN', 'MANAGER'), createProduct);

router
  .route('/:id')
  .get(getProductById)
  .put(authorize('ADMIN', 'MANAGER'), updateProduct)
  .delete(authorize('ADMIN', 'MANAGER'), deleteProduct);

router.post('/:id/variants', authorize('ADMIN', 'MANAGER'), createVariant);
router.put('/variants/:id', authorize('ADMIN', 'MANAGER'), updateVariant);

module.exports = router;
