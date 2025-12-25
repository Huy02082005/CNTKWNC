const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Lấy tất cả cài đặt
router.get('/', settingsController.getSettings);

// Cập nhật cài đặt
router.put('/', settingsController.updateSettings);

// Cập nhật từng phần cài đặt
router.patch('/notifications', settingsController.updateNotificationSettings);
router.patch('/security', settingsController.updateSecuritySettings);
router.patch('/payment', settingsController.updatePaymentSettings);

// Hành động hệ thống
router.post('/clear-cache', settingsController.clearCache);
router.post('/backup', settingsController.backupSystem);
router.post('/reset', settingsController.resetSystem);

module.exports = router;
