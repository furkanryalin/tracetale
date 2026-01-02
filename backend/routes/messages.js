const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/auth');

// Tüm route'lar korumalı
router.use(authMiddleware);

router.get('/conversations', messageController.getConversations);
router.get('/conversation/:userId', messageController.getMessages);
router.post('/send', messageController.sendMessage);
router.get('/unread-count', messageController.getUnreadCount);
router.post('/typing', messageController.setTyping);
router.get('/typing/:otherUserId', messageController.checkTyping);

module.exports = router;

