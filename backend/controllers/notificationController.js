const { pool } = require('../config/database');

// Bildirimleri getir
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;
        
        const [notifications] = await pool.query(`
            SELECT 
                n.*,
                u.name as related_user_name,
                u.avatar as related_user_avatar,
                s.title as story_title,
                s.photo_url as story_thumbnail
            FROM notifications n
            LEFT JOIN users u ON n.related_user_id = u.id
            LEFT JOIN stories s ON n.story_id = s.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, parseInt(limit), parseInt(offset)]);
        
        res.json({
            success: true,
            notifications
        });
        
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Bildirimler alınırken hata oluştu'
        });
    }
};

// Okunmamış bildirim sayısı
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [result] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        
        res.json({
            success: true,
            count: result[0].count
        });
        
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Okunmamış bildirim sayısı alınırken hata oluştu'
        });
    }
};

// Bildirimi okundu olarak işaretle
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const [result] = await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bildirim bulunamadı'
            });
        }
        
        res.json({
            success: true,
            message: 'Bildirim okundu olarak işaretlendi'
        });
        
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Bildirim güncellenirken hata oluştu'
        });
    }
};

// Tüm bildirimleri okundu olarak işaretle
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        
        res.json({
            success: true,
            message: 'Tüm bildirimler okundu olarak işaretlendi'
        });
        
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Bildirimler güncellenirken hata oluştu'
        });
    }
};

// Bildirim oluşturma helper fonksiyonu
exports.createNotification = async (userId, type, relatedUserId = null, storyId = null, message = null) => {
    try {
        // Kendine bildirim gönderme
        if (userId === relatedUserId) {
            return;
        }
        
        await pool.query(
            'INSERT INTO notifications (user_id, type, related_user_id, story_id, message) VALUES (?, ?, ?, ?, ?)',
            [userId, type, relatedUserId, storyId, message]
        );
        
        console.log(`✅ Bildirim oluşturuldu: ${type} -> User ${userId}`);
        
    } catch (error) {
        console.error('Create notification error:', error);
    }
};

