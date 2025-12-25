const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Middleware kiểm tra cookies và Super Admin
const checkAuthAndSuperAdmin = (req, res, next) => {
  try {
    const userDataCookie = req.cookies.user_data;
    
    if (!userDataCookie) {
      return res.status(401).json({
        success: false,
        error: 'Chưa đăng nhập'
      });
    }
    
    const user = JSON.parse(userDataCookie);
    
    if (!user.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Chỉ Super Admin mới có quyền truy cập' 
      });
    }
    
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false,
      error: 'Lỗi xác thực' 
    });
  }
};

router.use(checkAuthAndSuperAdmin);

router.get('/', adminController.getAllAdmins);
router.get('/stats', adminController.getAdminStats);
router.get('/search', adminController.searchAdmins);
router.get('/:id', adminController.getAdminById);
router.post('/', adminController.createAdmin);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);

module.exports = router;
