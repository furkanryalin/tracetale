const { pool } = require('../config/database');

// Konuşma listesini getir
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        const [conversations] = await pool.query(
            `SELECT 
                c.id as conversation_id,
                c.last_message_at,
                CASE 
                    WHEN c.user1_id = ? THEN c.user2_id
                    ELSE c.user1_id
                END as other_user_id,
                CASE 
                    WHEN c.user1_id = ? THEN u2.name
                    ELSE u1.name
                END as other_user_name,
                CASE 
                    WHEN c.user1_id = ? THEN u2.avatar
                    ELSE u1.avatar
                END as other_user_avatar,
                CASE 
                    WHEN c.user1_id = ? THEN u2.last_seen
                    ELSE u1.last_seen
                END as other_user_last_seen,
                (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND receiver_id = ? AND is_read = FALSE) as unread_count
            FROM conversations c
            LEFT JOIN users u1 ON c.user1_id = u1.id
            LEFT JOIN users u2 ON c.user2_id = u2.id
            WHERE c.user1_id = ? OR c.user2_id = ?
            ORDER BY c.last_message_at DESC`,
            [userId, userId, userId, userId, userId, userId, userId]
        );

        res.json({
            success: true,
            conversations
        });

    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Konuşmalar alınırken hata oluştu'
        });
    }
};

// Belirli bir konuşmanın mesajlarını getir
exports.getMessages = async (req, res) => {
    try {
        const { userId: otherUserId } = req.params;
        const currentUserId = req.user.id;

        // Konuşmayı bul veya oluştur
        let [conversations] = await pool.query(
            `SELECT id FROM conversations 
            WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
            [currentUserId, otherUserId, otherUserId, currentUserId]
        );

        let conversationId;

        if (conversations.length === 0) {
            // Yeni konuşma oluştur
            const [result] = await pool.query(
                'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
                [currentUserId, otherUserId]
            );
            conversationId = result.insertId;
        } else {
            conversationId = conversations[0].id;
        }

        // Mesajları getir
        const [messages] = await pool.query(
            `SELECT 
                m.*,
                u.name as sender_name,
                u.avatar as sender_avatar
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC`,
            [conversationId]
        );

        // Okunmamış mesajları oku olarak işaretle
        await pool.query(
            `UPDATE messages 
            SET is_read = TRUE 
            WHERE conversation_id = ? AND receiver_id = ? AND is_read = FALSE`,
            [conversationId, currentUserId]
        );

        res.json({
            success: true,
            conversation_id: conversationId,
            messages
        });

    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Mesajlar alınırken hata oluştu'
        });
    }
};

// Mesaj gönder
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, message } = req.body;
        const senderId = req.user.id;

        if (!receiverId || !message) {
            return res.status(400).json({
                success: false,
                message: 'Alıcı ve mesaj gerekli'
            });
        }

        // Güvenlik: Kendine mesaj gönderemez
        if (senderId === receiverId || senderId === parseInt(receiverId)) {
            return res.status(400).json({
                success: false,
                message: 'Kendinize mesaj gönderemezsiniz'
            });
        }

        // Konuşmayı bul veya oluştur
        let [conversations] = await pool.query(
            `SELECT id FROM conversations 
            WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
            [senderId, receiverId, receiverId, senderId]
        );

        let conversationId;

        if (conversations.length === 0) {
            // Yeni konuşma oluştur
            const [result] = await pool.query(
                'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
                [senderId, receiverId]
            );
            conversationId = result.insertId;
        } else {
            conversationId = conversations[0].id;
        }

        // Mesajı kaydet
        const [result] = await pool.query(
            'INSERT INTO messages (conversation_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)',
            [conversationId, senderId, receiverId, message]
        );

        // Konuşmanın son mesaj zamanını güncelle
        await pool.query(
            'UPDATE conversations SET last_message_at = NOW() WHERE id = ?',
            [conversationId]
        );

        // Oluşturulan mesajı getir
        const [newMessage] = await pool.query(
            `SELECT 
                m.*,
                u.name as sender_name,
                u.avatar as sender_avatar
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Mesaj gönderildi',
            data: newMessage[0]
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Mesaj gönderilirken hata oluştu'
        });
    }
};

// Okunmamış mesaj sayısını getir
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const [result] = await pool.query(
            'SELECT COUNT(*) as unread_count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({
            success: true,
            unread_count: result[0].unread_count
        });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Okunmamış mesaj sayısı alınırken hata oluştu'
        });
    }
};

// Yazıyor durumunu bildir
exports.setTyping = async (req, res) => {
    try {
        const userId = req.user.id;
        const { receiverId } = req.body;

        if (!receiverId) {
            return res.status(400).json({
                success: false,
                message: 'Alıcı ID gerekli'
            });
        }

        // typing_status tablosuna kaydet (veya güncelle)
        await pool.query(
            `INSERT INTO typing_status (user_id, receiver_id, last_typing) 
             VALUES (?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE last_typing = NOW()`,
            [userId, receiverId]
        );

        res.json({
            success: true,
            message: 'Yazıyor durumu güncellendi'
        });

    } catch (error) {
        console.error('Set typing error:', error);
        res.status(500).json({
            success: false,
            message: 'Yazıyor durumu kaydedilemedi'
        });
    }
};

// Karşı tarafın yazıyor mu kontrol et
exports.checkTyping = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;

        // Son 3 saniye içinde yazıyor mu kontrol et
        const [result] = await pool.query(
            `SELECT * FROM typing_status 
             WHERE user_id = ? AND receiver_id = ? 
             AND last_typing > DATE_SUB(NOW(), INTERVAL 3 SECOND)`,
            [otherUserId, userId]
        );

        res.json({
            success: true,
            isTyping: result.length > 0
        });

    } catch (error) {
        console.error('Check typing error:', error);
        res.status(500).json({
            success: false,
            message: 'Yazıyor durumu kontrol edilemedi',
            isTyping: false
        });
    }
};

