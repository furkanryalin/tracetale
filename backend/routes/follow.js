const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { authMiddleware } = require('../middleware/auth');

// Tüm route'lar korumalı
router.use(authMiddleware);

router.post('/follow/:userId', followController.followUser);
router.delete('/unfollow/:userId', followController.unfollowUser);
router.get('/followers/:userId', followController.getFollowers);
router.get('/following/:userId', followController.getFollowing);
router.get('/status/:userId', followController.checkFollowStatus);
router.get('/stats/:userId', followController.getFollowStats);

module.exports = router;

