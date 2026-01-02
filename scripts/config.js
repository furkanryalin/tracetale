// ===================================
// CONFIG - API Yapılandırması
// ===================================

// Backend API URL'i
const API_URL = 'http://localhost:3000/api';

// API yardımcı fonksiyonları
const API = {
    // Get token from localStorage
    getToken() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            const userData = JSON.parse(user);
            return userData.token;
        }
        return null;
    },

    // Set authorization header
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        return headers;
    },

    // Generic fetch wrapper
    async request(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`;
        const defaultOptions = {
            headers: this.getHeaders(options.auth !== false)
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // 401 Unauthorized - Token süresi dolmuş veya geçersiz
                if (response.status === 401) {
                    // Sadece auth gerektiren endpoint'lerde logout yap
                    if (options.auth !== false) {
                        this.handleUnauthorized();
                    }
                    throw new Error(data.message || 'Token süresi dolmuş');
                }
                throw new Error(data.message || 'Bir hata oluştu');
            }

            return data;
        } catch (error) {
            // 401 hatası için özel mesaj
            if (error.message === 'Token süresi dolmuş' || error.message.includes('Token')) {
                // Sessizce logla, handleUnauthorized zaten bildirim gösteriyor
                console.warn('API Request Error (401):', error.message);
            } else {
                console.error('API Request Error:', error);
            }
            throw error;
        }
    },

    // 401 Unauthorized hatası durumunda kullanıcıyı logout yap
    handleUnauthorized() {
        // Kullanıcı zaten logout olmuşsa tekrar logout yapma
        if (!this.getToken()) {
            return;
        }

        // Kullanıcıyı logout yap
        localStorage.removeItem('currentUser');
        
        // Auth butonunu güncelle
        if (typeof updateAuthButton === 'function') {
            updateAuthButton();
        }
        
        // Bildirim göster (sadece bir kez)
        if (typeof showNotification === 'function' && !this._unauthorizedNotified) {
            showNotification('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
            this._unauthorizedNotified = true;
            
            // 5 saniye sonra flag'i sıfırla (tekrar giriş yapıldığında)
            setTimeout(() => {
                this._unauthorizedNotified = false;
            }, 5000);
        }
        
        // Auth modal'ı aç (sadece bir kez)
        if (typeof openAuthModal === 'function' && !this._authModalOpened) {
            openAuthModal();
            this._authModalOpened = true;
            
            // Modal kapatıldığında flag'i sıfırla
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                const resetFlag = () => {
                    this._authModalOpened = false;
                    authModal.removeEventListener('click', resetFlag);
                };
                authModal.addEventListener('click', resetFlag);
            }
        }
        
        // Aktivite takibini durdur
        if (typeof activityTracker !== 'undefined' && activityTracker.stop) {
            activityTracker.stop();
        }
        
        // Bildirim polling durdur
        if (typeof NotificationsPage !== 'undefined' && NotificationsPage.stopPolling) {
            NotificationsPage.stopPolling();
        }
        
        console.log('🔒 Oturum süresi doldu, kullanıcı çıkış yapıldı');
    },

    // GET request
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options
        });
    },

    // POST request
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    },

    // PUT request
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    },

    // DELETE request
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options
        });
    }
};

// API endpoint'leri
const Endpoints = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    
    // Stories
    STORIES: '/stories',
    STORY_BY_ID: (id) => `/stories/${id}`,
    STORY_LIKE: (id) => `/stories/${id}/like`,
    STORY_COMMENT: (id) => `/stories/${id}/comment`,
    
    // Messages
    CONVERSATIONS: '/messages/conversations',
    CONVERSATION: (userId) => `/messages/conversation/${userId}`,
    SEND_MESSAGE: '/messages/send',
    UNREAD_COUNT: '/messages/unread-count',
    
    // Notifications
    NOTIFICATIONS: '/notifications',
    NOTIFICATIONS_UNREAD_COUNT: '/notifications/unread-count',
    NOTIFICATIONS_READ: (id) => `/notifications/read/${id}`,
    NOTIFICATIONS_READ_ALL: '/notifications/read-all'
};

console.log('API Configuration loaded:', API_URL);

