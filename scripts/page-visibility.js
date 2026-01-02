// ===================================
// PAGE VISIBILITY MANAGER
// ===================================

/**
 * Sayfa görünürlüğünü yönetir ve polling sistemlerini kontrol eder
 * Kullanıcı başka sekmeyeye geçince polling'leri durdurur (memory leak önleme)
 */
const PageVisibilityManager = {
    isVisible: true,
    listeners: [],
    
    // Başlat
    init() {
        // Page Visibility API event listener
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // Sayfa yüklendiğinde başlangıç durumunu kaydet
        this.isVisible = !document.hidden;
        
        console.log('✅ Page Visibility Manager başlatıldı');
    },
    
    // Görünürlük değişimini handle et
    handleVisibilityChange() {
        if (document.hidden) {
            // Sayfa background'a gitti
            this.isVisible = false;
            this.pauseAllPolling();
            console.log('⏸️ Sayfa arka plana gitti - Polling durduruldu');
        } else {
            // Sayfa tekrar görünür oldu
            this.isVisible = true;
            this.resumeAllPolling();
            console.log('▶️ Sayfa tekrar aktif - Polling devam ediyor');
        }
    },
    
    // Tüm polling sistemlerini durdur
    pauseAllPolling() {
        // Activity Tracker'ı durdur
        if (typeof activityTracker !== 'undefined') {
            activityTracker.pause();
        }
        
        // Notification Polling'i durdur
        if (typeof NotificationsPage !== 'undefined') {
            NotificationsPage.stopPolling();
        }
        
        // Messaging Polling'i durdur
        if (typeof MessagingAPI !== 'undefined') {
            MessagingAPI.stopPolling();
            MessagingAPI.stopConversationListPolling();
        }
        
        // Messaging Page Polling'i durdur
        if (typeof MessagingPage !== 'undefined') {
            MessagingPage.stopPolling();
        }
        
        // Custom listener'ları çağır
        this.listeners.forEach(listener => {
            if (listener.onPause) {
                listener.onPause();
            }
        });
    },
    
    // Tüm polling sistemlerini devam ettir
    resumeAllPolling() {
        // Kullanıcı giriş yapmışsa polling'leri başlat
        if (typeof isLoggedIn !== 'undefined' && isLoggedIn()) {
            // Activity Tracker'ı başlat
            if (typeof activityTracker !== 'undefined') {
                activityTracker.resume();
            }
            
            // Notification Polling'i başlat
            if (typeof NotificationsPage !== 'undefined') {
                NotificationsPage.startPolling();
            }
            
            // Messaging polling'lerini sadece modal açıksa başlat
            if (typeof MessagingAPI !== 'undefined') {
                const dmModal = document.getElementById('dm-modal');
                const dmListModal = document.getElementById('dm-list-modal');
                
                if (dmModal && !dmModal.classList.contains('hidden')) {
                    // DM modal açık - messaging polling başlat
                    const userId = MessagingAPI.state.currentChatUserId;
                    if (userId) {
                        MessagingAPI.startPolling(userId);
                    }
                }
                
                if (dmListModal && !dmListModal.classList.contains('hidden')) {
                    // DM list modal açık - conversation list polling başlat
                    MessagingAPI.startConversationListPolling();
                }
            }
            
            // Messaging Page polling'ini sadece açıksa başlat
            if (typeof MessagingPage !== 'undefined') {
                const messagingPage = document.getElementById('messaging-page');
                if (messagingPage && messagingPage.classList.contains('active')) {
                    const userId = MessagingPage.currentUserId;
                    if (userId) {
                        MessagingPage.startPolling(userId);
                    }
                }
            }
            
            // Custom listener'ları çağır
            this.listeners.forEach(listener => {
                if (listener.onResume) {
                    listener.onResume();
                }
            });
        }
    },
    
    // Custom listener ekle
    addListener(listener) {
        this.listeners.push(listener);
    },
    
    // Custom listener kaldır
    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
};

console.log('✅ Page Visibility Manager yüklendi');

