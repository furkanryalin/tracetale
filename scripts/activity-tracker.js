// ===================================
// ACTIVITY TRACKER - Kullanıcı Aktivite Takibi
// ===================================

class ActivityTracker {
    constructor() {
        this.lastSeenInterval = null;
        this.activityCheckInterval = 60000; // 1 dakikada bir güncelle
    }

    // Aktivite takibini başlat
    start() {
        if (!isLoggedIn()) return;

        // İlk güncellemeyii yap
        this.updateLastSeen();

        // Periyodik güncelleme başlat
        this.lastSeenInterval = setInterval(() => {
            if (isLoggedIn()) {
                this.updateLastSeen();
            } else {
                this.stop();
            }
        }, this.activityCheckInterval);

        console.log('✅ Aktivite takibi başlatıldı (1 dakika aralıkla)');
    }

    // Aktivite takibini durdur
    stop() {
        if (this.lastSeenInterval) {
            clearInterval(this.lastSeenInterval);
            this.lastSeenInterval = null;
            console.log('⏹️ Aktivite takibi durduruldu');
        }
    }
    
    // Aktivite takibini duraklat (Page Visibility için)
    pause() {
        if (this.lastSeenInterval) {
            clearInterval(this.lastSeenInterval);
            this.lastSeenInterval = null;
            console.log('⏸️ Aktivite takibi duraklatıldı');
        }
    }
    
    // Aktivite takibini devam ettir (Page Visibility için)
    resume() {
        if (!isLoggedIn()) return;
        
        // Zaten çalışıyorsa tekrar başlatma
        if (this.lastSeenInterval) return;
        
        // İlk güncellemeyi yap
        this.updateLastSeen();
        
        // Periyodik güncelleme başlat
        this.lastSeenInterval = setInterval(() => {
            if (isLoggedIn()) {
                this.updateLastSeen();
            } else {
                this.stop();
            }
        }, this.activityCheckInterval);
        
        console.log('▶️ Aktivite takibi devam ediyor');
    }

    // Son görülme zamanını güncelle
    async updateLastSeen() {
        try {
            await API.post('/auth/update-last-seen');
            console.log('🕐 Son görülme güncellendi');
        } catch (error) {
            // 401 hatası config.js'de handle ediliyor, sessizce geç
            if (error.message && error.message.includes('Token')) {
                return;
            }
            console.error('Son görülme güncellenemedi:', error);
        }
    }

    // Kullanıcının aktif olup olmadığını kontrol et
    static isUserActive(lastSeen) {
        if (!lastSeen) return false;

        const now = new Date();
        const lastSeenDate = new Date(lastSeen);
        const diffMinutes = (now - lastSeenDate) / 1000 / 60;

        return diffMinutes < 5; // Son 5 dakikada aktifse "online"
    }

    // Son görülme zamanını formatla
    static formatLastSeen(lastSeen) {
        if (!lastSeen) return 'Bilinmiyor';

        const now = new Date();
        const lastSeenDate = new Date(lastSeen);
        const diffMs = now - lastSeenDate;
        const diffMinutes = Math.floor(diffMs / 1000 / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 5) {
            return 'Aktif';
        } else if (diffMinutes < 60) {
            return `${diffMinutes} dakika önce`;
        } else if (diffHours < 24) {
            return `${diffHours} saat önce`;
        } else if (diffDays < 7) {
            return `${diffDays} gün önce`;
        } else {
            return lastSeenDate.toLocaleDateString('tr-TR', { 
                day: 'numeric', 
                month: 'short' 
            });
        }
    }

    // Aktivite badge'i göster
    static getStatusBadge(lastSeen) {
        if (this.isUserActive(lastSeen)) {
            return '<span class="status-badge active">🟢 Aktif</span>';
        } else {
            return `<span class="status-badge">${this.formatLastSeen(lastSeen)}</span>`;
        }
    }
}

// Global activity tracker instance
const activityTracker = new ActivityTracker();

// Sayfa yüklendiğinde veya kullanıcı giriş yaptığında başlat
document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) {
        activityTracker.start();
    }
});

// Çıkış yapılırken durdur
window.addEventListener('beforeunload', () => {
    activityTracker.stop();
});

console.log('✅ Activity Tracker yüklendi');

