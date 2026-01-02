const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Multer için memory storage kullan (base64 için)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Sadece resim dosyalarına izin ver
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir'), false);
        }
    }
});

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);
router.get('/user/:userId', authController.getUserProfile);  // Herkese açık - herhangi bir kullanıcının profilini görebilir
router.post('/update-last-seen', authMiddleware, authController.updateLastSeen);
router.post('/logout', authMiddleware, authController.logout);
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), authController.uploadAvatar);
router.post('/update-settings', authMiddleware, authController.updateSettings);
router.get('/settings', authMiddleware, authController.getSettings);
router.post('/update-bio', authMiddleware, authController.updateBio);

module.exports = router;

