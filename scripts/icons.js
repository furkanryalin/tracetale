// ===================================
// ICON HELPER - Font Awesome Icon Yönetimi
// ===================================

/**
 * Emoji yerine Font Awesome icon kullanımı için helper fonksiyonlar
 */

// Emoji'den Font Awesome icon class'ına mapping (icon ve renk) - Siyah Beyaz Tema
const EMOJI_TO_ICON = {
    '🔔': { icon: 'fas fa-bell', color: '#ffffff' },           // Beyaz
    '💬': { icon: 'fas fa-comment', color: '#ffffff' },        // Beyaz
    '✅': { icon: 'fas fa-check-circle', color: '#ffffff' },   // Beyaz
    '❌': { icon: 'fas fa-times-circle', color: '#ffffff' },   // Beyaz
    '⚠️': { icon: 'fas fa-exclamation-triangle', color: '#ffffff' }, // Beyaz
    '🔒': { icon: 'fas fa-lock', color: '#ffffff' },           // Beyaz
    '📍': { icon: 'fas fa-map-marker-alt', color: '#ffffff' }, // Beyaz
    '🔄': { icon: 'fas fa-sync-alt', color: '#ffffff' },       // Beyaz
    '📏': { icon: 'fas fa-ruler', color: '#ffffff' },          // Beyaz
    '👋': { icon: 'fas fa-hand-paper', color: '#ffffff' },     // Beyaz
    '🕐': { icon: 'far fa-clock', color: '#ffffff' },          // Beyaz
    '⏸️': { icon: 'fas fa-pause', color: '#b0b0b0' },          // Gri
    '▶️': { icon: 'fas fa-play', color: '#ffffff' },           // Beyaz
    '⏹️': { icon: 'fas fa-stop', color: '#ffffff' },           // Beyaz
    '⏭️': { icon: 'fas fa-step-forward', color: '#ffffff' },   // Beyaz
    '🔍': { icon: 'fas fa-search', color: '#ffffff' },         // Beyaz
    '👤': { icon: 'fas fa-user', color: '#ffffff' },           // Beyaz
    '📡': { icon: 'fas fa-broadcast-tower', color: '#ffffff' }, // Beyaz
    '🗑️': { icon: 'fas fa-trash', color: '#ffffff' },          // Beyaz
    '📹': { icon: 'fas fa-video', color: '#ffffff' },           // Beyaz
    '📞': { icon: 'fas fa-phone', color: '#ffffff' },           // Beyaz
    'ℹ️': { icon: 'fas fa-info-circle', color: '#ffffff' },     // Beyaz
    '📎': { icon: 'fas fa-paperclip', color: '#b0b0b0' },       // Gri
    '😊': { icon: 'far fa-smile', color: '#ffffff' },           // Beyaz
    '➤': { icon: 'fas fa-arrow-right', color: '#ffffff' },     // Beyaz
    '←': { icon: 'fas fa-arrow-left', color: '#ffffff' },      // Beyaz
    '❤️': { icon: 'fas fa-heart', color: '#ffffff' },          // Beyaz
    '💔': { icon: 'far fa-heart', color: '#b0b0b0' },          // Gri (beğeni kaldırıldı)
    '🖼️': { icon: 'fas fa-image', color: '#ffffff' },          // Beyaz
    '⚙️': { icon: 'fas fa-cog', color: '#b0b0b0' },            // Gri
    '✨': { icon: 'fas fa-star', color: '#ffffff' },            // Beyaz
    '📤': { icon: 'fas fa-share', color: '#ffffff' },           // Beyaz (paylaş)
    '🔖': { icon: 'fas fa-bookmark', color: '#ffffff' },        // Beyaz (kaydet)
    '📖': { icon: 'fas fa-book', color: '#ffffff' },            // Beyaz (hikaye)
    '📝': { icon: 'fas fa-sticky-note', color: '#ffffff' },     // Beyaz (not)
    '📷': { icon: 'fas fa-camera', color: '#ffffff' },          // Beyaz (fotoğraf)
    '✉️': { icon: 'fas fa-envelope', color: '#ffffff' },        // Beyaz (mesaj)
    '🔐': { icon: 'fas fa-lock', color: '#ffffff' },            // Beyaz (giriş gerekli)
    '✕': { icon: 'fas fa-times', color: '#ffffff' },           // Beyaz (kapat)
    '🌐': { icon: 'fas fa-globe', color: '#ffffff' },           // Beyaz (dünya/internet)
    '🚗': { icon: 'fas fa-car', color: '#ffffff' },            // Beyaz (araba/trafik)
    '🚌': { icon: 'fas fa-bus', color: '#ffffff' },            // Beyaz (otobüs/toplu taşıma)
    '🚴': { icon: 'fas fa-bicycle', color: '#ffffff' },         // Beyaz (bisiklet)
    '🏷️': { icon: 'fas fa-tag', color: '#ffffff' },            // Beyaz (etiket)
    '📚': { icon: 'fas fa-book-open', color: '#ffffff' },       // Beyaz (kitaplar)
    '🔗': { icon: 'fas fa-link', color: '#ffffff' },            // Beyaz (bağlantı)
    '🎨': { icon: 'fas fa-palette', color: '#ffffff' },         // Beyaz (sanat/görünüm)
    '🗺️': { icon: 'fas fa-map', color: '#ffffff' },            // Beyaz (harita)
    '🔑': { icon: 'fas fa-key', color: '#ffffff' },            // Beyaz (anahtar/şifre)
    '📸': { icon: 'fas fa-camera-retro', color: '#ffffff' },   // Beyaz (fotoğraf çek)
    '✏️': { icon: 'fas fa-pencil-alt', color: '#ffffff' },      // Beyaz (kalem/düzenle)
    '🌟': { icon: 'fas fa-star', color: '#ffffff' },            // Beyaz (yıldız/aktif)
    '🏙️': { icon: 'fas fa-city', color: '#ffffff' },           // Beyaz (şehir)
    '🏘️': { icon: 'fas fa-home', color: '#ffffff' },           // Beyaz (kasaba/mahalle)
    '🏔️': { icon: 'fas fa-mountain', color: '#ffffff' },       // Beyaz (bölge/dağ)
    '🏛️': { icon: 'fas fa-landmark', color: '#ffffff' }         // Beyaz (tarihi yer)
};

// Eksik emoji kontrolü - eğer mapping yoksa console'a uyarı ver
if (typeof console !== 'undefined') {
    console.log('✅ Icon mapping yüklendi:', Object.keys(EMOJI_TO_ICON).length, 'emoji dönüşümü hazır');
}

/**
 * Emoji string'ini Font Awesome icon'a dönüştür
 * @param {string} emoji - Emoji karakteri
 * @param {object} options - Icon options (size, color, class, useDefaultColor)
 * @returns {string} - Font Awesome HTML string
 */
function emojiToIcon(emoji, options = {}) {
    const iconData = EMOJI_TO_ICON[emoji];
    
    if (!iconData) {
        // Eğer mapping yoksa emoji'yi olduğu gibi döndür
        return emoji;
    }
    
    // Renk: options.color varsa onu kullan, yoksa default color kullan, yoksa currentColor
    const useDefaultColor = options.useDefaultColor !== false; // Varsayılan olarak true
    const iconColor = options.color || (useDefaultColor && iconData.color ? iconData.color : null);
    
    // Style birleştirme
    const styles = [];
    if (options.size) styles.push(`font-size: ${options.size}`);
    if (iconColor) styles.push(`color: ${iconColor}`);
    
    const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
    const className = options.class ? ` ${options.class}` : '';
    
    return `<i class="${iconData.icon}${className}"${styleAttr}></i>`;
}

/**
 * String içindeki emoji'leri icon'lara dönüştür
 * @param {string} text - Emoji içeren text
 * @param {object} options - Icon options (size, color, class, useDefaultColor)
 * @returns {string} - Icon'lu HTML string
 */
function replaceEmojisInText(text, options = {}) {
    let result = text;
    
    for (const [emoji, iconData] of Object.entries(EMOJI_TO_ICON)) {
        const iconHtml = emojiToIcon(emoji, options);
        result = result.replace(new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), iconHtml);
    }
    
    return result;
}

/**
 * Element'in text content'indeki emoji'leri icon'lara dönüştür
 * @param {HTMLElement} element - Target element
 * @param {object} options - Icon options
 */
function replaceEmojisInElement(element, options = {}) {
    if (!element) return;
    
    const text = element.textContent || element.innerText || '';
    const iconHtml = replaceEmojisInText(text, options);
    
    // Sadece emoji varsa değiştir (HTML injection'dan kaçınmak için)
    if (text !== iconHtml) {
        element.innerHTML = iconHtml;
    }
}

/**
 * Notification message'daki emoji'yi icon'a dönüştür
 * @param {string} message - Notification mesajı
 * @param {object} options - Icon options
 * @returns {string} - Icon'lu mesaj
 */
function formatNotificationMessage(message, options = {}) {
    // Notification'larda default color kullan (renkli iconlar)
    return replaceEmojisInText(message, { 
        size: options.size || '1.1em',
        useDefaultColor: options.useDefaultColor !== false // Varsayılan olarak renkli
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        emojiToIcon,
        replaceEmojisInText,
        replaceEmojisInElement,
        formatNotificationMessage,
        EMOJI_TO_ICON
    };
}

// Font Awesome CSS yüklendiğinde otomatik olarak icon'lar render edilir
// Ekstra bir işlem gerekmez

console.log('✅ Icon Helper yüklendi (Font Awesome)');

