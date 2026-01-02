// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * XSS koruması için HTML özel karakterlerini escape eder
 * @param {string} text - Escape edilecek metin
 * @returns {string} - Güvenli metin
 */
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Sanitize URL - Sadece safe protokollere izin ver
 * @param {string} url - Kontrol edilecek URL
 * @returns {string} - Güvenli URL veya '#'
 */
function sanitizeUrl(url) {
    if (!url) return '#';
    
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    try {
        const parsed = new URL(url);
        if (allowedProtocols.includes(parsed.protocol)) {
            return url;
        }
    } catch (e) {
        // Geçersiz URL
    }
    return '#';
}

/**
 * Güvenli JSON parse
 * @param {string} str - Parse edilecek string
 * @param {any} fallback - Hata durumunda döndürülecek değer
 * @returns {any}
 */
function safeJsonParse(str, fallback = null) {
    try {
        return JSON.parse(str);
    } catch (e) {
        console.error('JSON parse error:', e);
        return fallback;
    }
}

/**
 * Tarih formatla
 * @param {string|Date} date - Formatlanacak tarih
 * @returns {string} - Formatlanmış tarih
 */
function formatDate(date) {
    if (!date) return 'Tarih bilinmiyor';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
        return 'Tarih bilinmiyor';
    }
    
    return dateObj.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Debounce - Fonksiyon çağrılarını geciktir
 * @param {Function} func - Debounce edilecek fonksiyon
 * @param {number} wait - Bekleme süresi (ms)
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

console.log('✅ Utility functions yüklendi');

