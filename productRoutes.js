const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.get('/categories', productController.getAllCategories);
router.get('/brands', productController.getAllBrands);
router.get('/clubs', productController.getAllClubs);
router.get('/sizes', productController.getAllSizes);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
