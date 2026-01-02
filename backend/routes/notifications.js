const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

// Tüm rotalar authentication gerektiriyor
router.use(authMiddleware);

// Bildirimleri getir
router.get('/', notificationController.getNotifications);

// Okunmamış bildirim sayısı
router.get('/unread-count', notificationController.getUnreadCount);

// Bildirimi okundu olarak işaretle
router.post('/read/:id', notificationController.markAsRead);

// Tüm bildirimleri okundu olarak işaretle
router.post('/read-all', notificationController.markAllAsRead);

module.exports = router;

