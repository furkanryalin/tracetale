// ===================================
// MESSAGING API - Mesajlaşma API Entegrasyonu
// ===================================

// Global mesajlaşma state'i
const MessagingAPI = {
    currentConversationUserId: null,
    pollingInterval: null,
    conversationListPolling: null,
    statusPolling: null,
    typingPolling: null,
    unreadBadge: null,
    typingTimeout: null,
    isTyping: false,
    
    // Kullanıcılarla konuşma başlatma fonksiyonu
    async startConversationWithUser(userName, userId) {
        // Yeni messaging page'i kullan
        if (typeof MessagingPage !== 'undefined') {
            MessagingPage.open(userId, userName);
        } else {
            // Fallback: Eski modal
            const dmListModal = document.getElementById('dm-list-modal');
            if (dmListModal) {
                dmListModal.classList.remove('hidden');
            }
            
            // Konuşmaları yükle
            await this.renderConversations();
            
            // Belirtilen kullanıcı ile konuşmayı aç
            await this.openConversation(userId, userName);
        }
    },

    // Konuşma listesini yükle
    async loadConversations() {
        try {
            if (!isLoggedIn()) return [];

            const response = await API.get(Endpoints.CONVERSATIONS);
            
            if (response.success) {
                return response.conversations || [];
            }
            return [];
        } catch (error) {
            console.error('Konuşmalar yüklenirken hata:', error);
            return [];
        }
    },

    // Belirli kullanıcı ile mesajları yükle
    async loadMessages(otherUserId) {
        try {
            if (!isLoggedIn()) return [];

            const response = await API.get(Endpoints.CONVERSATION(otherUserId));
            
            if (response.success) {
                this.currentConversationUserId = otherUserId;
                return response.messages || [];
            }
            return [];
        } catch (error) {
            console.error('Mesajlar yüklenirken hata:', error);
            return [];
        }
    },

    // Mesaj gönder
    async sendMessage(receiverId, message) {
        try {
            if (!isLoggedIn()) {
                showNotification('Mesaj göndermek için giriş yapın! 🔐');
                return null;
            }

            if (!message || message.trim() === '') {
                return null;
            }

            const response = await API.post(Endpoints.SEND_MESSAGE, {
                receiverId: receiverId,
                message: message.trim()
            });

            if (response.success) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Mesaj gönderme hatası:', error);
            showNotification('Mesaj gönderilemedi! ❌');
            return null;
        }
    },

    // Okunmamış mesaj sayısını al
    async getUnreadCount() {
        try {
            if (!isLoggedIn()) return 0;

            const response = await API.get(Endpoints.UNREAD_COUNT);
            
            if (response.success) {
                return response.unread_count || 0;
            }
            return 0;
        } catch (error) {
            // 401 hatası config.js'de handle ediliyor, sessizce geç
            if (error.message && error.message.includes('Token')) {
                return 0;
            }
            console.error('Okunmamış mesaj sayısı alınamadı:', error);
            return 0;
        }
    },

    // Konuşma listesini render et
    async renderConversations(startPolling = true) {
        const conversations = await this.loadConversations();
        const conversationsContainer = document.querySelector('.dm-conversations');
        const emptyState = document.getElementById('dm-empty-state');

        if (!conversationsContainer) return;

        if (conversations.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            conversationsContainer.innerHTML = '';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        conversationsContainer.innerHTML = conversations.map(conv => {
            const lastMessagePreview = conv.last_message 
                ? (conv.last_message.length > 40 ? conv.last_message.substring(0, 40) + '...' : conv.last_message)
                : 'Henüz mesaj yok';

            const unreadBadge = conv.unread_count > 0 
                ? `<span class="unread-badge">${conv.unread_count}</span>` 
                : '';

            const time = this.formatTime(conv.last_message_at);
            
            // Aktivite durumu
            let statusIndicator = '';
            if (typeof ActivityTracker !== 'undefined' && conv.other_user_last_seen) {
                if (ActivityTracker.isUserActive(conv.other_user_last_seen)) {
                    statusIndicator = '<span class="online-indicator" title="Aktif">🟢</span>';
                }
            }

            return `
                <div class="dm-conversation-item" data-user-id="${conv.other_user_id}" data-user-name="${conv.other_user_name}" data-user-last-seen="${conv.other_user_last_seen || ''}">
                    <div style="position: relative;">
                        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzMzMiLz4KPHN2ZyB4PSIxMCIgeT0iMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZmZmIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIxIDEyIDE2IDEwLjIxIDE2IDhDMTYgNS43OSAxNC4yMSA0IDEyIDRDOS43OSA0IDggNS43OSA4IDhDOCAxMC4yMSA5Ljc5IDEyIDEyIDEyWk0xMiAxNE05LjMzIDE0IDcgMTYuMzMgNyAxOUgxN0MxNyAxNi4zMyAxNC42NyAxNCAxMiAxNFoiLz4KPC9zdmc+Cjwvc3ZnPgo=" alt="Avatar" class="dm-conversation-avatar">
                        ${statusIndicator}
                    </div>
                    <div class="dm-conversation-info">
                        <div class="dm-conversation-header">
                            <h4 class="dm-conversation-name">${conv.other_user_name}</h4>
                            <span class="dm-conversation-time">${time}</span>
                        </div>
                        <div class="dm-conversation-preview">
                            <p>${lastMessagePreview}</p>
                            ${unreadBadge}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Konuşma itemlerine click event ekle
        conversationsContainer.querySelectorAll('.dm-conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = parseInt(item.dataset.userId);
                const userName = item.dataset.userName;
                const userLastSeen = item.dataset.userLastSeen;
                this.openConversation(userId, userName, userLastSeen);
            });
        });

        // Otomatik güncelleme başlat (ilk render'da)
        if (startPolling) {
            this.startConversationListPolling();
        }
    },

    // Konuşma listesi otomatik güncelleme
    startConversationListPolling() {
        // Önceki polling'i durdur
        this.stopConversationListPolling();

        // Her 10 saniyede bir konuşma listesini güncelle
        this.conversationListPolling = setInterval(async () => {
            const dmListModal = document.getElementById('dm-list-modal');
            // Sadece modal açıksa güncelle
            if (dmListModal && !dmListModal.classList.contains('hidden')) {
                await this.renderConversations(false); // Polling'i yeniden başlatma
            }
        }, 10000); // 10 saniye

        console.log('📋 Konuşma listesi otomatik güncelleme başlatıldı (10 saniye)');
    },

    // Konuşma listesi polling'i durdur
    stopConversationListPolling() {
        if (this.conversationListPolling) {
            clearInterval(this.conversationListPolling);
            this.conversationListPolling = null;
            console.log('📋 Konuşma listesi otomatik güncelleme durduruldu');
        }
    },

    // Konuşmayı aç
    async openConversation(userId, userName, userLastSeen = null) {
        const dmModal = document.getElementById('dm-modal');
        const dmListModal = document.getElementById('dm-list-modal');
        const dmUsername = document.querySelector('.dm-username');
        const dmStatus = document.querySelector('.dm-status');
        const dmConversation = document.getElementById('dm-conversation');

        if (!dmModal || !dmConversation) return;

        // Kullanıcı adını göster
        if (dmUsername) dmUsername.textContent = userName;
        
        // Aktivite durumunu göster
        if (dmStatus && typeof ActivityTracker !== 'undefined') {
            if (userLastSeen && ActivityTracker.isUserActive(userLastSeen)) {
                dmStatus.textContent = 'Aktif';
                dmStatus.style.color = '#4CAF50';
            } else {
                dmStatus.textContent = userLastSeen ? ActivityTracker.formatLastSeen(userLastSeen) : 'Çevrimdışı';
                dmStatus.style.color = '#888';
            }
        }

        // Konuşmayı kapat, DM modalını aç
        if (dmListModal) dmListModal.classList.add('hidden');
        dmModal.classList.remove('hidden');

        // Mesajları yükle
        const messages = await this.loadMessages(userId);
        this.renderMessages(messages);

        // Mesaj gönderme olayını ayarla
        this.setupMessageSending(userId);

        // Otomatik polling başlat (3 saniyede bir yeni mesajları ve durumu kontrol et)
        this.startPolling(userId, userLastSeen);
    },

    // Mesajları render et
    renderMessages(messages) {
        const dmConversation = document.getElementById('dm-conversation');
        if (!dmConversation) return;

        const currentUser = getCurrentUser();
        if (!currentUser) return;

        dmConversation.innerHTML = messages.map(msg => {
            const isSent = msg.sender_id === currentUser.id;
            const messageClass = isSent ? 'sent' : 'received';
            const time = this.formatTime(msg.created_at);

            let avatarHtml = '';
            if (!isSent) {
                avatarHtml = `
                    <div class="dm-message-avatar">
                        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMzMzMiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZiI+CjxwYXRoIGQ9Ik0xMiAxMkMxNC4yMSAxMiAxNiAxMC4yMSAxNiA4QzE2IDUuNzkgMTQuMjEgNCAxMiA0QzkuNzkgNCA4IDUuNzkgOCA4QzggMTAuMjEgOS43OSAxMiAxMiAxMlpNMTIgMTRNOS4zMyAxNCA3IDE2LjMzIDcgMTlIMTdDMTcgMTYuMzMgMTQuNjcgMTQgMTIgMTRaIi8+Cjwvc3ZnPgo=" alt="Avatar">
                    </div>
                `;
            }

            return `
                <div class="dm-message ${messageClass}">
                    ${avatarHtml}
                    <div class="dm-message-content">
                        <div class="dm-message-bubble">
                            <p>${escapeHtml(msg.message)}</p>
                            <span class="dm-message-time">${time}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // En alta scroll
        dmConversation.scrollTop = dmConversation.scrollHeight;
    },

    // Mesaj gönderme işlemini ayarla
    setupMessageSending(receiverId) {
        const dmInput = document.getElementById('dm-input');
        const dmSend = document.getElementById('dm-send');

        if (!dmInput || !dmSend) return;

        // Önceki event listener'ları temizle
        const newDmSend = dmSend.cloneNode(true);
        dmSend.parentNode.replaceChild(newDmSend, dmSend);

        const newDmInput = dmInput.cloneNode(true);
        dmInput.parentNode.replaceChild(newDmInput, dmInput);

        // Yazıyor göstergesi
        newDmInput.addEventListener('input', () => {
            this.handleTyping(receiverId);
        });

        // Yeni event listener'lar
        newDmSend.addEventListener('click', () => this.handleSendMessage(receiverId));
        newDmInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage(receiverId);
            }
        });
    },
    
    // Yazıyor göstergesi (kendi yazınca)
    handleTyping(userId) {
        // Backend'e bildir (karşı taraf görsün)
        this.sendTypingStatus(userId);
        
        // Timeout'u temizle
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        // 2 saniye sonra backend'e tekrar bildir (durdu)
        this.typingTimeout = setTimeout(() => {
            // Typing durmuş, bir şey yapmaya gerek yok
        }, 2000);
    },
    
    // Backend'e yazıyor durumunu bildir
    async sendTypingStatus(receiverId) {
        try {
            await API.post('/messages/typing', { receiverId });
        } catch (error) {
            // Hata olsa da devam et, kritik değil
            console.log('Typing status gönderilemedi');
        }
    },
    
    // Karşı tarafın yazıyor mu kontrol et
    async checkTypingStatus(otherUserId) {
        try {
            const response = await API.get(`/messages/typing/${otherUserId}`);
            if (response.success && response.isTyping) {
                this.showTypingIndicator();
            } else {
                this.hideTypingIndicator();
            }
        } catch (error) {
            // Hata olsa da devam et
            this.hideTypingIndicator();
        }
    },
    
    // Yazıyor göstergesini göster
    showTypingIndicator() {
        let indicator = document.querySelector('.typing-indicator');
        if (!indicator) {
            const dmConversation = document.getElementById('dm-conversation');
            if (dmConversation) {
                indicator = document.createElement('div');
                indicator.className = 'typing-indicator';
                indicator.innerHTML = `
                    <div class="typing-bubble">
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span class="typing-text">yazıyor...</span>
                    </div>
                `;
                dmConversation.appendChild(indicator);
                dmConversation.scrollTop = dmConversation.scrollHeight;
            }
        }
    },
    
    // Yazıyor göstergesini gizle
    hideTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    },

    // Mesaj gönder
    async handleSendMessage(receiverId) {
        const dmInput = document.getElementById('dm-input');
        if (!dmInput) return;

        const message = dmInput.value.trim();
        if (!message) return;

        // Güvenlik: Kendine mesaj gönderemez
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === receiverId) {
            showNotification('Kendinize mesaj gönderemezsiniz! ⚠️');
            return;
        }

        const sentMessage = await this.sendMessage(receiverId, message);
        
        if (sentMessage) {
            dmInput.value = '';
            
            // Mesajları yeniden yükle
            const messages = await this.loadMessages(receiverId);
            this.renderMessages(messages);
        }
    },

    // Polling başlat (yeni mesajları, aktivite durumunu ve yazıyor durumunu kontrol et)
    startPolling(userId, userLastSeen) {
        // Önceki polling'i durdur
        this.stopPolling();

        // Her 3 saniyede bir yeni mesajları kontrol et
        this.pollingInterval = setInterval(async () => {
            if (this.currentConversationUserId === userId) {
                const messages = await this.loadMessages(userId);
                this.renderMessages(messages);
            }
        }, 3000);

        // Her 5 saniyede bir aktivite durumunu kontrol et
        this.statusPolling = setInterval(async () => {
            if (this.currentConversationUserId === userId) {
                await this.updateUserStatus(userId);
            }
        }, 5000);

        // Her 1 saniyede bir yazıyor durumunu kontrol et
        this.typingPolling = setInterval(async () => {
            if (this.currentConversationUserId === userId) {
                await this.checkTypingStatus(userId);
            }
        }, 1000);

        console.log('🔄 Mesaj, durum ve yazıyor polling başlatıldı');
    },

    // Polling'i durdur
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        if (this.statusPolling) {
            clearInterval(this.statusPolling);
            this.statusPolling = null;
        }
        if (this.typingPolling) {
            clearInterval(this.typingPolling);
            this.typingPolling = null;
        }
        // Yazıyor göstergesini temizle
        this.hideTypingIndicator();
        console.log('🔄 Polling durduruldu');
    },

    // Kullanıcı aktivite durumunu güncelle
    async updateUserStatus(userId) {
        try {
            // Kullanıcının mevcut durumunu konuşma listesinden al
            const conversations = await this.loadConversations();
            const conversation = conversations.find(c => c.other_user_id === userId);
            
            if (conversation && conversation.other_user_last_seen) {
                const dmStatus = document.querySelector('.dm-status');
                
                if (dmStatus && typeof ActivityTracker !== 'undefined') {
                    const isActive = ActivityTracker.isUserActive(conversation.other_user_last_seen);
                    const statusText = isActive ? 'Aktif' : ActivityTracker.formatLastSeen(conversation.other_user_last_seen);
                    const statusColor = isActive ? '#4CAF50' : '#888';
                    
                    // Sadece değişiklik varsa güncelle (gereksiz DOM manipülasyonunu önle)
                    if (dmStatus.textContent !== statusText) {
                        dmStatus.textContent = statusText;
                        dmStatus.style.color = statusColor;
                        console.log(`👤 Durum güncellendi: ${statusText}`);
                    }
                }
            }
        } catch (error) {
            console.error('Kullanıcı durumu güncellenemedi:', error);
        }
    },

    // Okunmamış mesaj badge'ini güncelle
    async updateUnreadBadge() {
        if (!isLoggedIn()) return;

        const unreadCount = await this.getUnreadCount();
        const dmHeaderBtn = document.getElementById('dm-header-btn');
        
        if (dmHeaderBtn) {
            // Mevcut badge'i kaldır
            const existingBadge = dmHeaderBtn.querySelector('.unread-count-badge');
            if (existingBadge) existingBadge.remove();

            // Yeni badge ekle
            if (unreadCount > 0) {
                const badge = document.createElement('span');
                badge.className = 'unread-count-badge';
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                // Position relative zaten CSS'de var, sadece emin olmak için
                if (getComputedStyle(dmHeaderBtn).position === 'static') {
                    dmHeaderBtn.style.position = 'relative';
                }
                dmHeaderBtn.appendChild(badge);
            }
        }
    },

    // Yardımcı fonksiyonlar
    formatTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Bugün ise sadece saat
        if (diff < 86400000) {
            return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }

        // Bu hafta ise gün
        if (diff < 604800000) {
            return date.toLocaleDateString('tr-TR', { weekday: 'short' });
        }

        // Geçmiş ise tarih
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    },

};

// Mesajlaşma sistemini başlat
function setupMessagingAPI() {
    console.log('Mesajlaşma API sistemi başlatılıyor...');

    const dmHeaderBtn = document.getElementById('dm-header-btn');
    const dmListModal = document.getElementById('dm-list-modal');
    const dmListClose = document.getElementById('dm-list-close');
    const dmModal = document.getElementById('dm-modal');
    const dmBack = document.getElementById('dm-back');

    if (!dmListModal || !dmModal) {
        console.error('Mesajlaşma modalları bulunamadı!');
        return;
    }

    // DM listesi açma
    if (dmHeaderBtn) {
        dmHeaderBtn.addEventListener('click', async () => {
            if (!isLoggedIn()) {
                showNotification('Mesajlaşmak için giriş yapın! 🔐');
                openAuthModal();
                return;
            }

            dmListModal.classList.remove('hidden');
            await MessagingAPI.renderConversations();
        });
    }

    // DM listesi kapatma
    if (dmListClose) {
        dmListClose.addEventListener('click', () => {
            dmListModal.classList.add('hidden');
            MessagingAPI.stopConversationListPolling();
        });
    }

    // DM modal kapatma
    if (dmBack) {
        dmBack.addEventListener('click', () => {
            MessagingAPI.stopPolling();
            dmModal.classList.add('hidden');
            dmListModal.classList.remove('hidden');
            MessagingAPI.renderConversations(true); // Polling'i yeniden başlat
        });
    }

    // Modal dışına tıklayınca kapat
    dmListModal.addEventListener('click', (e) => {
        if (e.target === dmListModal) {
            dmListModal.classList.add('hidden');
            MessagingAPI.stopConversationListPolling();
        }
    });

    dmModal.addEventListener('click', (e) => {
        if (e.target === dmModal) {
            MessagingAPI.stopPolling();
            dmModal.classList.add('hidden');
        }
    });

    // Okunmamış mesaj sayısını güncelle (her 30 saniyede)
    if (isLoggedIn()) {
        MessagingAPI.updateUnreadBadge();
        setInterval(() => {
            if (isLoggedIn()) {
                MessagingAPI.updateUnreadBadge();
            }
        }, 30000);
    }

    console.log('Mesajlaşma API sistemi hazır!');
}

// ===================================
// USER MESSAGING - Hikaye Popup'larına Mesaj Butonu
// ===================================

// Kullanıcılar arası mesajlaşma için gelişmiş özellikler
function initUserMessaging() {
    console.log('Kullanıcılar arası mesajlaşma sistemi başlatılıyor...');
    
    // Hikaye popuplarına mesaj butonu ekle
    addMessageButtonsToStories();
    
    console.log('✅ Kullanıcılar arası mesajlaşma sistemi hazır!');
}

// Hikayelere mesaj gönderme butonu ekle
function addMessageButtonsToStories() {
    // Story popup açıldığında çalışacak
    document.addEventListener('storyPopupOpened', function(e) {
        const storyData = e.detail;
        addMessageButtonToPopup(storyData);
    });
}

function addMessageButtonToPopup(storyData) {
    // Anonim hikayelere mesaj gönderilemez
    if (storyData.anonymous || !storyData.userId) {
        return;
    }
    
    // Kendi hikayene mesaj gönderilemez
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === storyData.userId) {
        return;
    }
    
    setTimeout(() => {
        const popupContent = document.querySelector('.story-popup-content');
        if (!popupContent) return;
        
        // Mesaj butonu zaten eklendiyse ekleme
        if (popupContent.querySelector('.message-author-btn')) return;
        
        const interactionsDiv = popupContent.querySelector('.story-interactions');
        if (interactionsDiv) {
            const messageBtn = document.createElement('button');
            messageBtn.className = 'interaction-btn message-author-btn';
            messageBtn.setAttribute('data-author', storyData.author);
            messageBtn.setAttribute('data-user-id', storyData.userId);
            messageBtn.innerHTML = `
                <span class="interaction-icon">${typeof emojiToIcon !== 'undefined' ? emojiToIcon('✉️', { size: '1em' }) : '✉️'}</span>
                <span style="font-size: 11px;">Mesaj</span>
            `;
            messageBtn.title = `${storyData.author} ile mesajlaş`;
            
            messageBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                if (!isLoggedIn()) {
                    showNotification('Mesaj göndermek için giriş yapın! 🔐');
                    openAuthModal();
                    return;
                }
                
                // MessagingAPI ile konuşmayı başlat
                await MessagingAPI.startConversationWithUser(storyData.author, storyData.userId);
            });
            
            interactionsDiv.appendChild(messageBtn);
        }
    }, 150);
}

