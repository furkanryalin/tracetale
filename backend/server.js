const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const storyRoutes = require('./routes/stories');
const messageRoutes = require('./routes/messages');
const followRoutes = require('./routes/follow');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting - DDoS ve brute force saldırılarını önle
// ÖNCE spesifik limit'leri uygula (Express middleware sırası önemli!)

// Daha sıkı rate limit - Giriş/Kayıt için (BRUTE FORCE ÖNLEME)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 5, // IP başına max 5 istek (brute force önleme)
    message: {
        success: false,
        message: 'Çok fazla giriş denemesi, lütfen 15 dakika sonra tekrar deneyin.'
    }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Genel rate limit - Tüm API rotaları için
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // IP başına max 100 istek
    message: {
        success: false,
        message: 'Çok fazla istek gönderdiniz, lütfen 15 dakika sonra tekrar deneyin.'
    },
    standardHeaders: true, // RateLimit-* headers gönder
    legacyHeaders: false, // X-RateLimit-* headers gönderme
});

// Tüm API rotalarına rate limit uygula (auth limit'lerden sonra!)
app.use('/api/', limiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'TraceTale API is running!',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint bulunamadı'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Server başlat
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Veritabanı bağlantısını test et
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.log('\n⚠️  MySQL bağlantısı kurulamadı!');
            console.log('📝 Lütfen aşağıdaki adımları izleyin:\n');
            console.log('1. MySQL servisinizin çalıştığından emin olun');
            console.log('2. .env dosyasındaki veritabanı bilgilerini kontrol edin');
            console.log('3. "npm run setup-db" komutunu çalıştırarak veritabanını oluşturun\n');
            process.exit(1);
        }

        app.listen(PORT, () => {
            console.log('\n🚀 TraceTale Backend Sunucusu Başlatıldı!\n');
            console.log(`📡 Server: http://localhost:${PORT}`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
            console.log('\n📋 Endpoints:');
            console.log('   - POST /api/auth/register (Kayıt)');
            console.log('   - POST /api/auth/login (Giriş)');
            console.log('   - GET  /api/auth/profile (Profil - Token Gerekli)');
            console.log('   - GET  /api/stories (Hikayeleri Listele)');
            console.log('   - POST /api/stories (Hikaye Ekle - Token Gerekli)');
            console.log('   - GET  /api/messages/conversations (Mesajlar - Token Gerekli)');
            console.log('\n✨ Backend hazır! Frontend\'i başlatabilirsiniz.\n');
        });

    } catch (error) {
        console.error('❌ Sunucu başlatılamadı:', error);
        process.exit(1);
    }
};

startServer();

