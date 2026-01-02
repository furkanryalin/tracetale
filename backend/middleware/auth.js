const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT token doğrulama middleware
const authMiddleware = async (req, res, next) => {
    try {
        // Token'ı header'dan al
        const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Yetkilendirme token\'ı bulunamadı'
            });
        }

        // Token'ı doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Kullanıcı bilgisini request'e ekle
        req.user = {
            id: decoded.id,
            email: decoded.email
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token süresi dolmuş'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Yetkilendirme hatası'
        });
    }
};

// Optional auth - token varsa doğrula, yoksa devam et
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = {
                id: decoded.id,
                email: decoded.email
            };
        }

        next();
    } catch (error) {
        // Token yoksa veya geçersizse, sadece devam et
        next();
    }
};

module.exports = { authMiddleware, optionalAuth };

