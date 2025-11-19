const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/', orderController.getAllOrders);
router.get('/stats', orderController.getOrderStats); // THÊM DÒNG NÀY
router.get('/:id', orderController.getOrderDetail);
router.put('/:id/status', orderController.updateOrderStatus);

module.exports = router;