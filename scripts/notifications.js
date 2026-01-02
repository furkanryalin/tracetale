// ===================================
// NOTIFICATIONS - Bildirim Sistemi
// ===================================

class NotificationManager {
    constructor() {
        this.permission = 'default';
        this.soundEnabled = true;
        this.messageNotifEnabled = true;
        this.storyNotifEnabled = false;
    }

    // Bildirim izni iste
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('Bu tarayıcı bildirimleri desteklemiyor');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        }

        return false;
    }

    // Tarayıcı bildirimi göster
    async showNotification(title, options = {}) {
        // Ayarları kontrol et
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        
        // Bildirim türüne göre kontrol
        if (options.type === 'message' && !settings.messageNotif) {
            return;
        }
        
        if (options.type === 'story' && !settings.storyNotif) {
            return;
        }

        // İzin kontrolü
        if (this.permission !== 'granted') {
            await this.requestPermission();
        }

        if (this.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/tracetalelogo.png',
                badge: '/tracetalelogo.png',
                ...options
            });

            // Bildirim tıklandığında
            notification.onclick = () => {
                window.focus();
                notification.close();
                if (options.onClick) {
                    options.onClick();
                }
            };

            // Ses çal
            if (settings.soundNotif) {
                this.playNotificationSound();
            }
        }
    }

    // Bildirim sesi çal
    playNotificationSound() {
        try {
            // Basit bildirim sesi (beep)
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.log('Ses çalınamadı:', error);
        }
    }

    // Yeni mesaj bildirimi
    notifyNewMessage(senderName, messagePreview) {
        this.showNotification('💬 Yeni Mesaj', {
            body: `${senderName}: ${messagePreview}`,
            type: 'message',
            tag: 'new-message',
            onClick: () => {
                // Mesajlaşma modalını aç
                const dmListBtn = document.getElementById('dm-list-btn');
                if (dmListBtn) {
                    dmListBtn.click();
                }
            }
        });
    }

    // Yeni hikaye bildirimi
    notifyNewStory(authorName, storyTitle) {
        this.showNotification('📖 Yakınınızda Yeni Hikaye', {
            body: `${authorName} bir hikaye paylaştı: "${storyTitle}"`,
            type: 'story',
            tag: 'new-story'
        });
    }
}

// Global notification manager instance
const notificationManager = new NotificationManager();

// Sayfa yüklendiğinde izin iste (eğer ayarlarda açıksa)
document.addEventListener('DOMContentLoaded', () => {
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    if (settings.messageNotif || settings.storyNotif) {
        setTimeout(() => {
            notificationManager.requestPermission();
        }, 3000); // 3 saniye sonra iste (kullanıcı deneyimi için)
    }
});

console.log('✅ Notification Manager yüklendi');

