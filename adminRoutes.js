// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateAdmin = require('../middlewares/auth');
const requireSuperAdmin = require('../middlewares/requireSuperAdmin');

// Áp dụng middleware xác thực và SUPER ADMIN cho TẤT CẢ routes
router.use(authenticateAdmin);
router.use(requireSuperAdmin);  // Thêm dòng này

// Routes cho quản lý tài khoản admin
router.get('/', adminController.getAllAdmins);
router.get('/stats', adminController.getAdminStats);
router.get('/search', adminController.searchAdmins);
router.get('/:id', adminController.getAdminById);
router.post('/', adminController.createAdmin);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);

module.exports = router;