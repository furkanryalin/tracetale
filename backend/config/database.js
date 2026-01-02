const mysql = require('mysql2');
require('dotenv').config();

// MySQL bağlantı havuzu oluştur
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tracetale',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promise wrapper
const promisePool = pool.promise();

// Bağlantıyı test et
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ MySQL veritabanına başarıyla bağlandı!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL bağlantı hatası:', error.message);
        return false;
    }
};

module.exports = {
    pool: promisePool,
    testConnection
};

