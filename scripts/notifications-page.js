// ===================================
// NOTIFICATIONS PAGE - Instagram Style
// ===================================

const NotificationsPage = {
    notifications: [],
    pollingInterval: null,
    
    // Bildirimleri aç
    open() {
        const page = document.getElementById('notifications-page');
        if (page) {
            page.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.loadNotifications();
        }
    },
    
    // Bildirimleri kapat
    close() {
        const page = document.getElementById('notifications-page');
        if (page) {
            page.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    },
    
    // Bildirimleri yükle
    async loadNotifications() {
        try {
            const response = await API.get(Endpoints.NOTIFICATIONS);
            
            if (response.success) {
                this.notifications = response.notifications.map(n => ({
                    id: n.id,
                    type: n.type,
                    username: n.related_user_name,
                    userId: n.related_user_id,
                    avatar: n.related_user_avatar,
                    storyId: n.story_id,
                    thumbnail: n.story_thumbnail,
                    comment: n.message,
                    message: n.message,
                    timestamp: n.created_at,
                    unread: !n.is_read
                }));
                
                this.renderNotifications();
            }
        } catch (error) {
            console.error('Bildirimler yüklenemedi:', error);
            // Fallback: boş liste göster
            this.notifications = [];
            this.renderNotifications();
        }
    },
    
    // Bildirimleri render et
    renderNotifications() {
        const container = document.getElementById('notifications-content');
        if (!container) return;
        
        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="notifications-empty">
                    <div class="notifications-empty-icon">🔔</div>
                    <h3 class="notifications-empty-title">Bildirim Yok</h3>
                    <p class="notifications-empty-text">Henüz hiç bildirimin yok.</p>
                </div>
            `;
            return;
        }
        
        // Bildirimleri kategorilere ayır
        const categorized = this.categorizeNotifications(this.notifications);
        
        let html = '';
        
        // Takip istekleri (varsa)
        if (categorized.followRequests.length > 0) {
            html += this.renderFollowRequestsSection(categorized.followRequests);
        }
        
        // Diğer kategoriler
        const sections = [
            { key: 'today', title: 'Bugün', data: categorized.today },
            { key: 'thisWeek', title: 'Bu Hafta', data: categorized.thisWeek },
            { key: 'thisMonth', title: 'Bu Ay', data: categorized.thisMonth },
            { key: 'earlier', title: 'Daha Eski', data: categorized.earlier }
        ];
        
        sections.forEach(section => {
            if (section.data.length > 0) {
                html += this.renderSection(section.title, section.data);
            }
        });
        
        container.innerHTML = html;
    },
    
    // Bildirimleri kategorilere ayır
    categorizeNotifications(notifications) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        return {
            followRequests: notifications.filter(n => n.type === 'follow_request'),
            today: notifications.filter(n => n.type !== 'follow_request' && new Date(n.timestamp) >= today),
            thisWeek: notifications.filter(n => n.type !== 'follow_request' && new Date(n.timestamp) < today && new Date(n.timestamp) >= weekAgo),
            thisMonth: notifications.filter(n => n.type !== 'follow_request' && new Date(n.timestamp) < weekAgo && new Date(n.timestamp) >= monthAgo),
            earlier: notifications.filter(n => n.type !== 'follow_request' && new Date(n.timestamp) < monthAgo)
        };
    },
    
    // Takip istekleri bölümü
    renderFollowRequestsSection(requests) {
        return `
            <div class="notification-section">
                <div class="notification-follow-request" onclick="NotificationsPage.openFollowRequests()">
                    <img src="${this.getDefaultAvatar()}" alt="Avatar" class="notification-avatar">
                    <div class="follow-request-info">
                        <p class="follow-request-title">Takip istekleri</p>
                        <p class="follow-request-subtitle">${requests[0].username} + ${requests.length} diğer</p>
                    </div>
                    <span class="follow-request-arrow">›</span>
                </div>
            </div>
        `;
    },
    
    // Normal bölüm
    renderSection(title, notifications) {
        let html = `
            <div class="notification-section">
                <h2 class="notification-section-title">${title}</h2>
        `;
        
        notifications.forEach(notif => {
            html += this.renderNotification(notif);
        });
        
        html += `</div>`;
        return html;
    },
    
    // Tek bildirim
    renderNotification(notif) {
        const avatar = notif.avatar || this.getDefaultAvatar();
        const timeAgo = this.getTimeAgo(notif.timestamp);
        const unreadClass = notif.unread ? 'unread' : '';
        const unreadBadge = notif.unread ? '<span class="notification-badge"></span>' : '';
        
        let content = '';
        
        switch(notif.type) {
            case 'like':
                content = `
                    <div class="notification-item ${unreadClass}" onclick="NotificationsPage.handleNotificationClick(${notif.id})">
                        ${unreadBadge}
                        <img src="${avatar}" alt="${notif.username}" class="notification-avatar">
                        <div class="notification-content">
                            <p class="notification-text">
                                <span class="username">${notif.username}</span>
                                <span class="action"> hikayeni beğendi.</span>
                            </p>
                            <span class="notification-time">${timeAgo}</span>
                        </div>
                        ${notif.thumbnail ? `<img src="${notif.thumbnail}" alt="Story" class="notification-image">` : ''}
                    </div>
                `;
                break;
                
            case 'comment':
                content = `
                    <div class="notification-item ${unreadClass}" onclick="NotificationsPage.handleNotificationClick(${notif.id})">
                        ${unreadBadge}
                        <img src="${avatar}" alt="${notif.username}" class="notification-avatar">
                        <div class="notification-content">
                            <p class="notification-text">
                                <span class="username">${notif.username}</span>
                                <span class="action"> hikayene yorum yaptı: "${notif.comment}"</span>
                            </p>
                            <span class="notification-time">${timeAgo}</span>
                        </div>
                        ${notif.thumbnail ? `<img src="${notif.thumbnail}" alt="Story" class="notification-image">` : ''}
                    </div>
                `;
                break;
                
            case 'follow':
                content = `
                    <div class="notification-item ${unreadClass}" onclick="NotificationsPage.handleNotificationClick(${notif.id})" style="cursor: pointer;">
                        ${unreadBadge}
                        <img src="${avatar}" alt="${notif.username}" class="notification-avatar">
                        <div class="notification-content">
                            <p class="notification-text">
                                <span class="username">${notif.username}</span>
                                <span class="action"> seni takip etmeye başladı.</span>
                            </p>
                            <span class="notification-time">${timeAgo}</span>
                        </div>
                    </div>
                `;
                break;
                
            case 'system':
                content = `
                    <div class="notification-item ${unreadClass}">
                        <img src="${avatar}" alt="System" class="notification-avatar">
                        <div class="notification-content">
                            <p class="notification-text">
                                <span class="action">${notif.message}</span>
                            </p>
                            <span class="notification-time">${timeAgo}</span>
                        </div>
                    </div>
                `;
                break;
        }
        
        return content;
    },
    
    // Bildirime tıklama
    async handleNotificationClick(notifId) {
        console.log('Bildirime tıklandı:', notifId);
        const notif = this.notifications.find(n => n.id === notifId);
        if (notif) {
            // Bildirimi okundu olarak işaretle (backend'e)
            try {
                await API.post(Endpoints.NOTIFICATIONS_READ(notifId));
                notif.unread = false;
                this.renderNotifications(); // Yeniden render et
            } catch (error) {
                console.error('Bildirim okundu olarak işaretlenemedi:', error);
            }
            
            // İlgili içeriğe git
            if (notif.storyId) {
                // TODO: Hikayeyi popup'ta aç
                console.log('Hikaye açılıyor:', notif.storyId);
                this.close();
            } else if (notif.userId) {
                // Profili aç
                if (typeof ProfilePage !== 'undefined') {
                    this.close();
                    ProfilePage.open(notif.userId);
                }
            }
        }
    },
    
    // Takip isteklerini aç
    openFollowRequests() {
        showNotification('Takip istekleri özelliği yakında! 🚀');
    },
    
    // Zaman farkı hesapla
    getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diff = Math.floor((now - then) / 1000); // saniye
        
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}d`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}s`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}g`;
        if (diff < 2592000) return `${Math.floor(diff / 604800)}h`;
        return `${Math.floor(diff / 2592000)}ay`;
    },
    
    // Varsayılan avatar
    getDefaultAvatar() {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Ccircle cx='22' cy='22' r='22' fill='%232196F3'/%3E%3C/svg%3E";
    },
    
    // Okunmamış bildirim sayısını getir
    async getUnreadCount() {
        try {
            const response = await API.get(Endpoints.NOTIFICATIONS_UNREAD_COUNT);
            return response.count || 0;
        } catch (error) {
            console.error('Okunmamış bildirim sayısı alınamadı:', error);
            return 0;
        }
    },
    
    // Tüm bildirimleri okundu olarak işaretle
    async markAllAsRead() {
        try {
            await API.post(Endpoints.NOTIFICATIONS_READ_ALL);
            this.notifications.forEach(n => n.unread = false);
            this.renderNotifications();
            this.updateBadge();
        } catch (error) {
            console.error('Tüm bildirimler okundu olarak işaretlenemedi:', error);
        }
    },
    
    // Header'daki badge'i güncelle
    async updateBadge() {
        const count = await this.getUnreadCount();
        const notificationsBtn = document.getElementById('notifications-header-btn');
        
        if (notificationsBtn) {
            // Badge'i güncelle veya oluştur
            let badge = notificationsBtn.querySelector('.notification-badge');
            
            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'notification-badge';
                    notificationsBtn.appendChild(badge);
                }
                badge.textContent = count > 99 ? '99+' : count;
            } else {
                if (badge) {
                    badge.remove();
                }
            }
        }
    },
    
    // Polling başlat
    startPolling() {
        // İlk badge güncellemesi
        this.updateBadge();
        
        // Her 30 saniyede bir kontrol et
        this.pollingInterval = setInterval(() => {
            this.updateBadge();
        }, 30000);
        
        console.log('✅ Bildirim polling başlatıldı (30 saniye aralıkla)');
    },
    
    // Polling durdur
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('notifications-back');
    const filterBtn = document.getElementById('notifications-filter');
    const notificationsHeaderBtn = document.getElementById('notifications-header-btn');
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            NotificationsPage.close();
        });
    }
    
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            showNotification('Filtreleme özelliği yakında! 🔍');
        });
    }
    
    if (notificationsHeaderBtn) {
        notificationsHeaderBtn.addEventListener('click', () => {
            NotificationsPage.open();
        });
    }
    
    console.log('✅ Notifications Page sistemi yüklendi');
});

