const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Kullanıcı kaydı
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validasyon
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Tüm alanları doldurun'
            });
        }

        // Email formatı kontrolü
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Geçerli bir email adresi girin'
            });
        }

        // Şifre uzunluğu kontrolü
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Şifre en az 6 karakter olmalıdır'
            });
        }

        // Kullanıcı zaten var mı kontrol et
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu email adresi zaten kullanılıyor'
            });
        }

        // Şifreyi hashle
        const hashedPassword = await bcrypt.hash(password, 10);

        // Kullanıcıyı veritabanına ekle
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // JWT token oluştur
        const token = jwt.sign(
            { id: result.insertId, email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.status(201).json({
            success: true,
            message: 'Kayıt başarılı',
            token,
            user: {
                id: result.insertId,
                name,
                email
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Kayıt sırasında bir hata oluştu'
        });
    }
};

// Kullanıcı girişi
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validasyon
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email ve şifre gerekli'
            });
        }

        // Kullanıcıyı bul
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email veya şifre hatalı'
            });
        }

        const user = users[0];

        // Şifreyi kontrol et
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email veya şifre hatalı'
            });
        }

        // JWT token oluştur
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
            success: true,
            message: 'Giriş başarılı',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Giriş sırasında bir hata oluştu'
        });
    }
};

// Kullanıcı profilini getir
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // Son görülme zamanını güncelle
        await pool.query(
            'UPDATE users SET last_seen = NOW() WHERE id = ?',
            [userId]
        );

        const [users] = await pool.query(
            'SELECT id, name, email, avatar, bio, last_seen, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Kullanıcının hikaye sayılarını al
        const [storyCounts] = await pool.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN type = 'story' THEN 1 ELSE 0 END) as stories,
                SUM(CASE WHEN type = 'note' THEN 1 ELSE 0 END) as notes,
                SUM(CASE WHEN type = 'photo' THEN 1 ELSE 0 END) as photos
            FROM stories WHERE user_id = ?`,
            [userId]
        );

        res.json({
            success: true,
            user: users[0],
            stats: storyCounts[0]
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Profil bilgileri alınırken hata oluştu'
        });
    }
};

// Son görülme zamanını güncelle
exports.updateLastSeen = async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.query(
            'UPDATE users SET last_seen = NOW() WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Son görülme güncellendi'
        });

    } catch (error) {
        console.error('Update last seen error:', error);
        res.status(500).json({
            success: false,
            message: 'Son görülme güncellenemedi'
        });
    }
};

// Çıkış yap - Son görülme zamanını güncelle
exports.logout = async (req, res) => {
    try {
        const userId = req.user.id;

        // Son görülme zamanını 10 dakika öncesine çek (çevrimdışı görünsün)
        await pool.query(
            'UPDATE users SET last_seen = DATE_SUB(NOW(), INTERVAL 10 MINUTE) WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Çıkış yapıldı'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Çıkış yapılırken hata oluştu'
        });
    }
};

// Avatar yükle
exports.uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Dosya yüklenmedi'
            });
        }

        // Güvenlik: Sadece kendi avatar'ını güncelleyebilir (zaten req.user.id kullanılıyor)
        // Bu kontrol middleware tarafından sağlanıyor ama ekstra güvenlik için burada da not düşelim

        // Avatar'ı base64'e çevir
        const avatarBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        // Veritabanını güncelle - WHERE id = ? ile sadece kendi kaydını güncelleyebilir
        const [result] = await pool.query(
            'UPDATE users SET avatar = ? WHERE id = ?',
            [avatarBase64, userId]
        );

        // Güncelleme başarılı mı kontrol et
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Profil resmi güncellendi',
            avatar: avatarBase64
        });

    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Profil resmi yüklenirken hata oluştu'
        });
    }
};

// Kullanıcı ayarlarını güncelle
exports.updateSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const settings = req.body;

        // Güvenlik: Sadece kendi ayarlarını güncelleyebilir (req.user.id kullanılıyor)

        // Privacy mode'u ayrı olarak sakla
        if (settings.privacyMode !== undefined) {
            const privacyMode = settings.privacyMode ? 'private' : 'public';
            const [result] = await pool.query(
                'UPDATE users SET privacy_mode = ? WHERE id = ?',
                [privacyMode, userId]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Kullanıcı bulunamadı'
                });
            }
        }

        // Diğer ayarları JSON olarak sakla
        await pool.query(
            'UPDATE users SET settings = ? WHERE id = ?',
            [JSON.stringify(settings), userId]
        );

        res.json({
            success: true,
            message: 'Ayarlar güncellendi',
            settings
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Ayarlar güncellenirken hata oluştu'
        });
    }
};

// Bio güncelle
exports.updateBio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio } = req.body;

        // Güvenlik: Sadece kendi bio'sunu güncelleyebilir (req.user.id kullanılıyor)
        
        // Bio uzunluk kontrolü (max 300 karakter)
        if (bio && bio.length > 300) {
            return res.status(400).json({
                success: false,
                message: 'Bio en fazla 300 karakter olabilir'
            });
        }

        const [result] = await pool.query(
            'UPDATE users SET bio = ? WHERE id = ?',
            [bio, userId]
        );

        // Güncelleme başarılı mı kontrol et
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Bio güncellendi',
            bio
        });

    } catch (error) {
        console.error('Update bio error:', error);
        res.status(500).json({
            success: false,
            message: 'Bio güncellenirken hata oluştu'
        });
    }
};

// Kullanıcı ayarlarını getir
exports.getSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await pool.query(
            'SELECT settings FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Eğer settings NULL ise default değerler dön
        const settings = users[0].settings ? JSON.parse(users[0].settings) : {
            darkMode: true,
            animations: true,
            messageNotif: true,
            storyNotif: false,
            soundNotif: true,
            showOnline: true,
            lastSeen: true,
            shareLocation: true,
            autoLocation: true,
            mapLabels: true
        };

        res.json({
            success: true,
            settings
        });

    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Ayarlar alınırken hata oluştu'
        });
    }
};

// Başka bir kullanıcının profilini getir (public endpoint)
exports.getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const [users] = await pool.query(
            'SELECT id, name, avatar, bio, last_seen, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Kullanıcının hikaye sayılarını al
        const [storyCounts] = await pool.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN type = 'story' THEN 1 ELSE 0 END) as stories,
                SUM(CASE WHEN type = 'note' THEN 1 ELSE 0 END) as notes,
                SUM(CASE WHEN type = 'photo' THEN 1 ELSE 0 END) as photos
            FROM stories WHERE user_id = ?`,
            [userId]
        );

        res.json({
            success: true,
            user: users[0],
            stats: storyCounts[0]
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Kullanıcı profili alınırken hata oluştu'
        });
    }
};

