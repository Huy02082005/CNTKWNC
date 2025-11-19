// customerRoutes.js - ĐẢM BẢO ĐÚNG
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// TẤT CẢ CÁC ROUTES
router.get('/', customerController.getAllCustomers);
router.get('/stats', customerController.getCustomerStats);
router.post('/', customerController.createCustomer);    // QUAN TRỌNG: DÒNG NÀY
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;