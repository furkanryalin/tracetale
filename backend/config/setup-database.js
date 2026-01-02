const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    let connection;
    
    try {
        // İlk olarak veritabanı olmadan bağlan
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        console.log('📦 MySQL\'e bağlanıldı...');

        // Veritabanını oluştur
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'tracetale'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Veritabanı '${process.env.DB_NAME || 'tracetale'}' oluşturuldu veya zaten mevcut.`);

        // Veritabanını seç
        await connection.query(`USE ${process.env.DB_NAME || 'tracetale'}`);

        // Users tablosu
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                avatar VARCHAR(255) DEFAULT NULL,
                bio TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Users tablosu oluşturuldu.');

        // Stories tablosu
        await connection.query(`
            CREATE TABLE IF NOT EXISTS stories (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                type ENUM('story', 'note', 'photo') DEFAULT 'story',
                photo_url VARCHAR(255) DEFAULT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                location_name VARCHAR(255) DEFAULT NULL,
                is_anonymous BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user (user_id),
                INDEX idx_type (type),
                INDEX idx_location (latitude, longitude),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Stories tablosu oluşturuldu.');

        // Conversations tablosu (DM için)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user1_id INT NOT NULL,
                user2_id INT NOT NULL,
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_conversation (user1_id, user2_id),
                INDEX idx_users (user1_id, user2_id),
                INDEX idx_last_message (last_message_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Conversations tablosu oluşturuldu.');

        // Messages tablosu
        await connection.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                conversation_id INT NOT NULL,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_conversation (conversation_id),
                INDEX idx_sender (sender_id),
                INDEX idx_receiver (receiver_id),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Messages tablosu oluşturuldu.');

        // Story Likes tablosu
        await connection.query(`
            CREATE TABLE IF NOT EXISTS story_likes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                story_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_like (story_id, user_id),
                INDEX idx_story (story_id),
                INDEX idx_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Story Likes tablosu oluşturuldu.');

        // Comments tablosu
        await connection.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                story_id INT NOT NULL,
                user_id INT NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_story (story_id),
                INDEX idx_user (user_id),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Comments tablosu oluşturuldu.');

        // Notifications tablosu
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                type ENUM('like', 'comment', 'follow', 'follow_request', 'system') NOT NULL,
                related_user_id INT DEFAULT NULL,
                story_id INT DEFAULT NULL,
                message TEXT DEFAULT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
                INDEX idx_user (user_id),
                INDEX idx_is_read (is_read),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Notifications tablosu oluşturuldu.');

        console.log('\n🎉 Tüm tablolar başarıyla oluşturuldu!');
        console.log('📊 Veritabanı yapısı hazır.');

    } catch (error) {
        console.error('❌ Hata:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Scripti çalıştır
if (require.main === module) {
    setupDatabase()
        .then(() => {
            console.log('\n✅ Kurulum tamamlandı!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Kurulum başarısız:', error);
            process.exit(1);
        });
}

module.exports = setupDatabase;

