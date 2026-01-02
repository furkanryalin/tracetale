const { pool } = require('../config/database');
const { createNotification } = require('./notificationController');

// Kullanıcıyı takip et
exports.followUser = async (req, res) => {
    try {
        const followerId = req.user.id;
        const { userId: followingId } = req.params;

        if (followerId === parseInt(followingId)) {
            return res.status(400).json({
                success: false,
                message: 'Kendinizi takip edemezsiniz'
            });
        }

        // Kullanıcının privacy modunu kontrol et
        const [targetUser] = await pool.query(
            'SELECT privacy_mode FROM users WHERE id = ?',
            [followingId]
        );

        if (targetUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Takip et
        await pool.query(
            'INSERT INTO followers (follower_id, following_id) VALUES (?, ?)',
            [followerId, followingId]
        );

        // Takip edilen kullanıcıya bildirim gönder
        await createNotification(followingId, 'follow', followerId);

        res.json({
            success: true,
            message: 'Kullanıcı takip edildi',
            isPrivate: targetUser[0].privacy_mode === 'private'
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Zaten takip ediyorsunuz'
            });
        }
        console.error('Follow user error:', error);
        res.status(500).json({
            success: false,
            message: 'Takip edilirken hata oluştu'
        });
    }
};

// Kullanıcıyı takipten çık
exports.unfollowUser = async (req, res) => {
    try {
        const followerId = req.user.id;
        const { userId: followingId } = req.params;

        await pool.query(
            'DELETE FROM followers WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        res.json({
            success: true,
            message: 'Takipten çıkıldı'
        });

    } catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({
            success: false,
            message: 'Takipten çıkılırken hata oluştu'
        });
    }
};

// Takipçi listesi
exports.getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;

        const [followers] = await pool.query(
            `SELECT 
                u.id, u.name, u.email, u.avatar,
                f.created_at as followed_at
            FROM followers f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            followers
        });

    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({
            success: false,
            message: 'Takipçiler alınırken hata oluştu'
        });
    }
};

// Takip edilen listesi
exports.getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;

        const [following] = await pool.query(
            `SELECT 
                u.id, u.name, u.email, u.avatar,
                f.created_at as followed_at
            FROM followers f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            following
        });

    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({
            success: false,
            message: 'Takip edilenler alınırken hata oluştu'
        });
    }
};

// Takip durumunu kontrol et
exports.checkFollowStatus = async (req, res) => {
    try {
        const followerId = req.user.id;
        const { userId: followingId } = req.params;

        const [result] = await pool.query(
            'SELECT * FROM followers WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        res.json({
            success: true,
            isFollowing: result.length > 0
        });

    } catch (error) {
        console.error('Check follow status error:', error);
        res.status(500).json({
            success: false,
            message: 'Takip durumu kontrol edilemedi',
            isFollowing: false
        });
    }
};

// Takip istatistikleri
exports.getFollowStats = async (req, res) => {
    try {
        const { userId } = req.params;

        const [followers] = await pool.query(
            'SELECT COUNT(*) as count FROM followers WHERE following_id = ?',
            [userId]
        );

        const [following] = await pool.query(
            'SELECT COUNT(*) as count FROM followers WHERE follower_id = ?',
            [userId]
        );

        res.json({
            success: true,
            followers: followers[0].count,
            following: following[0].count
        });

    } catch (error) {
        console.error('Get follow stats error:', error);
        res.status(500).json({
            success: false,
            message: 'İstatistikler alınırken hata oluştu',
            followers: 0,
            following: 0
        });
    }
};

