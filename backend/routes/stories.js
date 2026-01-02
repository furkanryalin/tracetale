const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// Public routes (with optional auth)
router.get('/', optionalAuth, storyController.getAllStories);
router.get('/:id', optionalAuth, storyController.getStoryById);

// Protected routes
router.post('/', authMiddleware, storyController.createStory);
router.put('/:id', authMiddleware, storyController.updateStory);
router.delete('/:id', authMiddleware, storyController.deleteStory);
router.post('/:id/like', authMiddleware, storyController.toggleLike);
router.post('/:id/comment', authMiddleware, storyController.addComment);

module.exports = router;

