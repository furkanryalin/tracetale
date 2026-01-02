const { pool } = require('../config/database');
const { createNotification } = require('./notificationController');

// Tüm hikayeleri getir
exports.getAllStories = async (req, res) => {
    try {
        const { type, author, keyword, dateFrom, dateTo, lat, lng, radius } = req.query;
        
        let query = `
            SELECT 
                s.*,
                u.name as author_name,
                u.avatar as author_avatar,
                u.privacy_mode as author_privacy_mode,
                (SELECT COUNT(*) FROM story_likes WHERE story_id = s.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE story_id = s.id) as comments_count
        `;

        // Eğer kullanıcı giriş yapmışsa, beğenip beğenmediğini kontrol et
        if (req.user) {
            query += `,
                (SELECT COUNT(*) FROM story_likes WHERE story_id = s.id AND user_id = ?) as user_liked,
                (SELECT COUNT(*) FROM followers WHERE follower_id = ? AND following_id = s.user_id) as is_following
            `;
        }

        query += `
            FROM stories s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE 1=1
        `;

        const params = req.user ? [req.user.id, req.user.id] : [];

        // Filtreleme
        if (type) {
            query += ` AND s.type = ?`;
            params.push(type);
        }

        if (author) {
            query += ` AND u.name LIKE ?`;
            params.push(`%${author}%`);
        }

        if (keyword) {
            query += ` AND (s.title LIKE ? OR s.content LIKE ?)`;
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        if (dateFrom) {
            query += ` AND s.created_at >= ?`;
            params.push(dateFrom);
        }

        if (dateTo) {
            query += ` AND s.created_at <= ?`;
            params.push(dateTo + ' 23:59:59');
        }

        // Yarıçap filtresi (Haversine formülü)
        if (lat && lng && radius) {
            query += ` AND (
                6371000 * acos(
                    cos(radians(?)) * cos(radians(s.latitude)) *
                    cos(radians(s.longitude) - radians(?)) +
                    sin(radians(?)) * sin(radians(s.latitude))
                )
            ) <= ?`;
            params.push(lat, lng, lat, radius);
        }

        query += ` ORDER BY s.created_at DESC`;

        const [stories] = await pool.query(query, params);

        // Private account filtresi - sadece public hesapların veya takip edilen hesapların hikayelerini göster
        let filteredStories = stories;
        if (req.user) {
            // Giriş yapmış kullanıcı için: kendi hikayeleri + public hikayeler + takip ettiği private hesapların hikayeleri
            filteredStories = stories.filter(story => {
                const isOwnStory = story.user_id === req.user.id;
                const isPublic = story.author_privacy_mode === 'public' || !story.author_privacy_mode;
                const isFollowing = story.is_following > 0;
                
                return isOwnStory || isPublic || (story.author_privacy_mode === 'private' && isFollowing);
            });
        } else {
            // Giriş yapmamış kullanıcı için: sadece public hikayeler
            filteredStories = stories.filter(story => {
                return story.author_privacy_mode === 'public' || !story.author_privacy_mode;
            });
        }

        res.json({
            success: true,
            count: filteredStories.length,
            stories: filteredStories
        });

    } catch (error) {
        console.error('Get stories error:', error);
        res.status(500).json({
            success: false,
            message: 'Hikayeler alınırken hata oluştu'
        });
    }
};

// Tek hikaye getir
exports.getStoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const [stories] = await pool.query(
            `SELECT 
                s.*,
                u.name as author_name,
                u.avatar as author_avatar,
                (SELECT COUNT(*) FROM story_likes WHERE story_id = s.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE story_id = s.id) as comments_count
            FROM stories s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.id = ?`,
            [id]
        );

        if (stories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hikaye bulunamadı'
            });
        }

        res.json({
            success: true,
            story: stories[0]
        });

    } catch (error) {
        console.error('Get story error:', error);
        res.status(500).json({
            success: false,
            message: 'Hikaye alınırken hata oluştu'
        });
    }
};

// Yeni hikaye oluştur
exports.createStory = async (req, res) => {
    try {
        const { title, content, type, latitude, longitude, location_name, is_anonymous } = req.body;
        const userId = req.user.id;

        // Validation
        if (!title || !content || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Başlık, içerik ve konum gerekli'
            });
        }
        
        // Length validation
        if (title.trim().length === 0 || title.length > 200) {
            return res.status(400).json({
                success: false,
                message: 'Başlık 1-200 karakter arası olmalıdır'
            });
        }
        
        if (content.trim().length === 0 || content.length > 5000) {
            return res.status(400).json({
                success: false,
                message: 'İçerik 1-5000 karakter arası olmalıdır'
            });
        }
        
        // Coordinate validation
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz koordinatlar'
            });
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                success: false,
                message: 'Koordinatlar geçerli aralıkta olmalıdır'
            });
        }
        
        // Type validation
        const validTypes = ['story', 'note', 'photo'];
        if (type && !validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz tip'
            });
        }

        // Photo URL (eğer fotoğraf yüklendiyse)
        const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const [result] = await pool.query(
            `INSERT INTO stories (user_id, title, content, type, photo_url, latitude, longitude, location_name, is_anonymous)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, title, content, type || 'story', photoUrl, latitude, longitude, location_name, is_anonymous || false]
        );

        // Oluşturulan hikayeyi getir
        const [newStory] = await pool.query(
            `SELECT 
                s.*,
                u.name as author_name,
                u.avatar as author_avatar
            FROM stories s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Hikaye başarıyla oluşturuldu',
            story: newStory[0]
        });

    } catch (error) {
        console.error('Create story error:', error);
        res.status(500).json({
            success: false,
            message: 'Hikaye oluşturulurken hata oluştu'
        });
    }
};

// Hikaye güncelle
exports.updateStory = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, type } = req.body;
        const userId = req.user.id;

        // Hikaye sahibi mi kontrol et
        const [stories] = await pool.query('SELECT user_id FROM stories WHERE id = ?', [id]);

        if (stories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hikaye bulunamadı'
            });
        }

        if (stories[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bu hikayeyi düzenleme yetkiniz yok'
            });
        }

        await pool.query(
            'UPDATE stories SET title = ?, content = ?, type = ? WHERE id = ?',
            [title, content, type, id]
        );

        res.json({
            success: true,
            message: 'Hikaye başarıyla güncellendi'
        });

    } catch (error) {
        console.error('Update story error:', error);
        res.status(500).json({
            success: false,
            message: 'Hikaye güncellenirken hata oluştu'
        });
    }
};

// Hikaye sil
exports.deleteStory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Hikaye sahibi mi kontrol et
        const [stories] = await pool.query('SELECT user_id FROM stories WHERE id = ?', [id]);

        if (stories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hikaye bulunamadı'
            });
        }

        if (stories[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bu hikayeyi silme yetkiniz yok'
            });
        }

        await pool.query('DELETE FROM stories WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Hikaye başarıyla silindi'
        });

    } catch (error) {
        console.error('Delete story error:', error);
        res.status(500).json({
            success: false,
            message: 'Hikaye silinirken hata oluştu'
        });
    }
};

// Hikaye beğen/beğeniyi kaldır
exports.toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Beğeni var mı kontrol et
        const [existingLikes] = await pool.query(
            'SELECT id FROM story_likes WHERE story_id = ? AND user_id = ?',
            [id, userId]
        );

        if (existingLikes.length > 0) {
            // Beğeniyi kaldır
            await pool.query('DELETE FROM story_likes WHERE story_id = ? AND user_id = ?', [id, userId]);
            return res.json({
                success: true,
                message: 'Beğeni kaldırıldı',
                liked: false
            });
        } else {
            // Beğeni ekle
            await pool.query('INSERT INTO story_likes (story_id, user_id) VALUES (?, ?)', [id, userId]);
            
            // Hikaye sahibine bildirim gönder
            const [story] = await pool.query('SELECT user_id FROM stories WHERE id = ?', [id]);
            if (story.length > 0 && story[0].user_id !== userId) {
                await createNotification(story[0].user_id, 'like', userId, id);
            }
            
            return res.json({
                success: true,
                message: 'Hikaye beğenildi',
                liked: true
            });
        }

    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({
            success: false,
            message: 'Beğeni işlemi sırasında hata oluştu'
        });
    }
};

// Yorum ekle
exports.addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;
        const userId = req.user.id;

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Yorum boş olamaz'
            });
        }

        // Yorum ekle
        const [result] = await pool.query(
            'INSERT INTO comments (story_id, user_id, comment) VALUES (?, ?, ?)',
            [id, userId, comment]
        );

        // Hikaye sahibine bildirim gönder
        const [story] = await pool.query('SELECT user_id FROM stories WHERE id = ?', [id]);
        if (story.length > 0 && story[0].user_id !== userId) {
            await createNotification(story[0].user_id, 'comment', userId, id, comment.substring(0, 100));
        }

        res.json({
            success: true,
            message: 'Yorum eklendi',
            commentId: result.insertId
        });

    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Yorum eklenirken hata oluştu'
        });
    }
};

