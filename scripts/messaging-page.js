// ===================================
// MESSAGING PAGE - Instagram-Style Messaging
// ===================================

const MessagingPage = {
    currentChatUserId: null,
    pollingInterval: null,
    typingTimeout: null,
    lastMessageCount: 0, // Son mesaj sayısını takip et
    
    // Sayfayı aç
    open(userId = null, userName = null) {
        const page = document.getElementById('messaging-page');
        if (page) {
            page.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.loadConversations();
            this.setupEventListeners();
            
            // Eğer userId verilmişse direkt o sohbeti aç
            if (userId && userName) {
                setTimeout(() => {
                    this.openChat(userId, userName, null);
                }, 500);
            }
        }
    },
    
    // Sayfayı kapat
    close() {
        const page = document.getElementById('messaging-page');
        if (page) {
            page.classList.remove('active');
            document.body.style.overflow = 'auto';
            this.stopPolling();
            this.lastMessageCount = 0; // Sıfırla
            this.currentChatUserId = null;
            
            // Eski mesaj modallarını da kapat
            const dmListModal = document.getElementById('dm-list-modal');
            const dmModal = document.getElementById('dm-modal');
            
            if (dmListModal) {
                dmListModal.classList.add('hidden');
            }
            if (dmModal) {
                dmModal.classList.add('hidden');
            }
        }
    },
    
    // Event listener'ları kur
    setupEventListeners() {
        // Geri butonu
        const backBtn = document.getElementById('messaging-back');
        if (backBtn) {
            backBtn.onclick = () => this.close();
        }
        
        // Yeni mesaj butonu
        const newBtn = document.getElementById('messaging-new');
        if (newBtn) {
            newBtn.onclick = () => {
                // TODO: Yeni mesaj modal'ı aç
                showNotification('Yeni mesaj özelliği yakında! 📝');
            };
        }
        
        // Arama
        const searchInput = document.getElementById('messaging-search');
        if (searchInput) {
            searchInput.oninput = (e) => this.filterConversations(e.target.value);
        }
        
        // Mesaj gönderme
        const sendBtn = document.getElementById('messaging-send-btn');
        const input = document.getElementById('messaging-input');
        
        if (sendBtn) {
            sendBtn.onclick = () => this.sendMessage();
        }
        
        if (input) {
            input.onkeydown = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            };
            
            input.oninput = () => {
                this.handleTyping();
                // Auto-resize textarea
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 120) + 'px';
            };
        }
    },
    
    // Konuşmaları yükle
    async loadConversations() {
        try {
            if (!isLoggedIn()) {
                showNotification('Mesajları görmek için giriş yapmalısınız! 🔐');
                this.close();
                return;
            }
            
            const response = await API.get(Endpoints.CONVERSATIONS);
            
            if (response.success) {
                this.renderConversations(response.conversations || []);
            }
        } catch (error) {
            console.error('Konuşmalar yüklenemedi:', error);
        }
    },
    
    // Konuşmaları render et
    renderConversations(conversations) {
        const container = document.getElementById('messaging-conversations');
        if (!container) return;
        
        if (conversations.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #8e8e8e;">
                    <i class="fas fa-comment" style="font-size: 48px; margin-bottom: 16px; color: #8e8e8e;"></i>
                    <p style="font-size: 16px;">Henüz mesajınız yok</p>
                    <p style="font-size: 14px; margin-top: 8px;">Bir arkadaşına mesaj göndererek başla!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        conversations.forEach(conv => {
            const isActive = this.currentChatUserId === conv.other_user_id;
            const isUnread = conv.unread_count > 0;
            const isOnline = this.isUserOnline(conv.other_user_last_seen);
            
            const avatar = conv.other_user_avatar || this.getDefaultAvatar();
            const lastMessage = conv.last_message || 'Henüz mesaj yok';
            const time = this.formatTime(conv.last_message_at);
            
            const item = document.createElement('div');
            item.className = `messaging-conversation-item ${isActive ? 'active' : ''} ${isUnread ? 'unread' : ''}`;
            item.onclick = () => this.openChat(conv.other_user_id, conv.other_user_name, conv.other_user_last_seen);
            
            item.innerHTML = `
                <img src="${avatar}" alt="${conv.other_user_name}" class="messaging-conversation-avatar">
                <div class="messaging-conversation-details">
                    <div class="messaging-conversation-top">
                        <span class="messaging-conversation-name">${conv.other_user_name}</span>
                        <span class="messaging-conversation-time">${time}</span>
                    </div>
                    <div class="messaging-conversation-bottom">
                        <span class="messaging-conversation-message">${lastMessage}</span>
                        ${isUnread ? `<span class="messaging-conversation-badge">${conv.unread_count}</span>` : ''}
                    </div>
                </div>
            `;
            
            container.appendChild(item);
        });
    },
    
    // Konuşmaları filtrele
    filterConversations(query) {
        const items = document.querySelectorAll('.messaging-conversation-item');
        const lowerQuery = query.toLowerCase();
        
        items.forEach(item => {
            const name = item.querySelector('.messaging-conversation-name').textContent.toLowerCase();
            const message = item.querySelector('.messaging-conversation-message').textContent.toLowerCase();
            
            if (name.includes(lowerQuery) || message.includes(lowerQuery)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    // Chat aç
    async openChat(userId, userName, lastSeen) {
        this.currentChatUserId = userId;
        this.lastMessageCount = 0; // Yeni chat açılınca sıfırla
        
        // Sidebar'ı mobile'da gizle
        const sidebar = document.getElementById('messaging-sidebar');
        if (window.innerWidth <= 768) {
            sidebar.classList.add('has-active-chat');
        }
        
        // Empty state gizle, chat göster
        const emptyState = document.getElementById('messaging-empty');
        const activeChat = document.getElementById('messaging-active-chat');
        const content = document.getElementById('messaging-content');
        
        if (emptyState) emptyState.style.display = 'none';
        if (activeChat) activeChat.style.display = 'flex';
        if (content) content.classList.add('active');
        
        // Header render et
        this.renderChatHeader(userId, userName, lastSeen);
        
        // Mesajları yükle
        await this.loadMessages(userId);
        
        // Polling başlat
        this.startPolling(userId);
        
        // Conversation items güncelle
        this.updateConversationItems();
    },
    
    // Chat header render et
    renderChatHeader(userId, userName, lastSeen) {
        const header = document.getElementById('messaging-chat-header');
        if (!header) return;
        
        const currentUser = getCurrentUser();
        const avatar = currentUser?.avatar || this.getDefaultAvatar();
        const isOnline = this.isUserOnline(lastSeen);
        const statusText = isOnline ? 'Aktif' : this.formatLastSeen(lastSeen);
        
        header.innerHTML = `
            <img src="${avatar}" alt="${userName}" class="messaging-chat-avatar" onclick="ProfilePage.open(${userId})">
            <div class="messaging-chat-info" onclick="ProfilePage.open(${userId})">
                <div class="messaging-chat-name">${userName}</div>
                <div class="messaging-chat-status ${isOnline ? 'online' : ''}">${statusText}</div>
            </div>
            <div class="messaging-chat-actions">
                <button class="messaging-chat-action-btn" onclick="showNotification('Arama özelliği yakında!')">${typeof emojiToIcon !== 'undefined' ? emojiToIcon('📞', { size: '1.2em' }) : '📞'}</button>
                <button class="messaging-chat-action-btn" onclick="showNotification('Video arama özelliği yakında!')">${typeof emojiToIcon !== 'undefined' ? emojiToIcon('📹', { size: '1.2em' }) : '📹'}</button>
                <button class="messaging-chat-action-btn" onclick="ProfilePage.open(${userId})">${typeof emojiToIcon !== 'undefined' ? emojiToIcon('ℹ️', { size: '1.2em' }) : 'ℹ️'}</button>
            </div>
        `;
    },
    
    // Mesajları yükle
    async loadMessages(userId) {
        try {
            const response = await API.get(Endpoints.CONVERSATION(userId));
            
            if (response.success) {
                this.renderMessages(response.messages || []);
            }
        } catch (error) {
            console.error('Mesajlar yüklenemedi:', error);
        }
    },
    
    // Mesajları render et
    renderMessages(messages) {
        const container = document.getElementById('messaging-messages');
        if (!container) return;
        
        const currentUser = getCurrentUser();
        if (!currentUser) return;
        
        // Eğer mesaj sayısı değişmediyse render etme (optimizasyon)
        if (messages.length === this.lastMessageCount && this.lastMessageCount > 0) {
            return; // Hiçbir şey değişmedi, render etme
        }
        
        // Sadece yeni mesajları ekle
        if (messages.length > this.lastMessageCount && this.lastMessageCount > 0) {
            // Yeni mesajlar var, sadece onları ekle
            const newMessages = messages.slice(this.lastMessageCount);
            
            newMessages.forEach(msg => {
                const isSent = msg.sender_id === currentUser.id;
                const avatar = msg.sender_avatar || this.getDefaultAvatar();
                const time = this.formatMessageTime(msg.created_at);
                
                const messageDiv = document.createElement('div');
                messageDiv.className = `messaging-message ${isSent ? 'sent' : 'received'}`;
                messageDiv.dataset.messageId = msg.id; // Mesaj ID'sini sakla
                
                messageDiv.innerHTML = `
                    ${!isSent ? `<img src="${avatar}" alt="Avatar" class="messaging-message-avatar">` : ''}
                    <div class="messaging-message-content">
                        <div class="messaging-message-bubble">
                            <p class="messaging-message-text">${escapeHtml(msg.message)}</p>
                        </div>
                        <span class="messaging-message-time">${time}</span>
                    </div>
                `;
                
                container.appendChild(messageDiv);
            });
            
            // Scroll to bottom (smooth)
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            // İlk yükleme veya mesaj sayısı azaldı, tümünü render et
            container.innerHTML = '';
            
            messages.forEach(msg => {
                const isSent = msg.sender_id === currentUser.id;
                const avatar = msg.sender_avatar || this.getDefaultAvatar();
                const time = this.formatMessageTime(msg.created_at);
                
                const messageDiv = document.createElement('div');
                messageDiv.className = `messaging-message ${isSent ? 'sent' : 'received'}`;
                messageDiv.dataset.messageId = msg.id;
                
                messageDiv.innerHTML = `
                    ${!isSent ? `<img src="${avatar}" alt="Avatar" class="messaging-message-avatar">` : ''}
                    <div class="messaging-message-content">
                        <div class="messaging-message-bubble">
                            <p class="messaging-message-text">${escapeHtml(msg.message)}</p>
                        </div>
                        <span class="messaging-message-time">${time}</span>
                    </div>
                `;
                
                container.appendChild(messageDiv);
            });
            
            // Scroll to bottom (instant)
            container.scrollTop = container.scrollHeight;
        }
        
        // Son mesaj sayısını güncelle
        this.lastMessageCount = messages.length;
    },
    
    // Mesaj gönder
    async sendMessage() {
        const input = document.getElementById('messaging-input');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message || !this.currentChatUserId) return;
        
        try {
            const response = await API.post(Endpoints.SEND_MESSAGE, {
                receiverId: this.currentChatUserId,
                message: message
            });
            
            if (response.success) {
                input.value = '';
                input.style.height = 'auto';
                await this.loadMessages(this.currentChatUserId);
                await this.loadConversations(); // Liste güncelle
            }
        } catch (error) {
            console.error('Mesaj gönderilemedi:', error);
            showNotification('Mesaj gönderilemedi! ❌');
        }
    },
    
    // Typing indicator
    handleTyping() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        if (this.currentChatUserId) {
            API.post(Endpoints.TYPING_STATUS, { receiverId: this.currentChatUserId });
        }
        
        this.typingTimeout = setTimeout(() => {
            // Typing stopped
        }, 2000);
    },
    
    // Polling başlat
    startPolling(userId) {
        this.stopPolling();
        
        this.pollingInterval = setInterval(async () => {
            if (this.currentChatUserId === userId) {
                await this.loadMessages(userId);
            }
        }, 3000);
    },
    
    // Polling durdur
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    },
    
    // Conversation items güncelle
    updateConversationItems() {
        const items = document.querySelectorAll('.messaging-conversation-item');
        items.forEach(item => {
            item.classList.remove('active');
        });
        
        // Aktif conversation'ı işaretle
        items.forEach(item => {
            const onClick = item.onclick.toString();
            if (onClick.includes(`openChat(${this.currentChatUserId}`)) {
                item.classList.add('active');
            }
        });
    },
    
    // Helper functions
    getDefaultAvatar() {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Ccircle cx='28' cy='28' r='28' fill='%232196F3'/%3E%3C/svg%3E";
    },
    
    isUserOnline(lastSeen) {
        if (!lastSeen) return false;
        const lastSeenDate = new Date(lastSeen);
        const now = new Date();
        const diffMinutes = (now - lastSeenDate) / 1000 / 60;
        return diffMinutes < 5;
    },
    
    formatTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Şimdi';
        if (diffMins < 60) return `${diffMins}d`;
        if (diffHours < 24) return `${diffHours}s`;
        if (diffDays < 7) return `${diffDays}g`;
        
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    },
    
    formatMessageTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    },
    
    formatLastSeen(lastSeen) {
        if (!lastSeen) return 'Çevrimdışı';
        
        const lastSeenDate = new Date(lastSeen);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastSeenDate) / 1000 / 60);
        
        if (diffMinutes < 5) return 'Aktif';
        if (diffMinutes < 60) return `${diffMinutes} dakika önce aktifti`;
        
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} saat önce aktifti`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} gün önce aktifti`;
        
        return 'Uzun zaman önce aktifti';
    }
};

// Global erişim
window.MessagingPage = MessagingPage;

// Header'daki DM butonunu güncelle
document.addEventListener('DOMContentLoaded', () => {
    const dmHeaderBtn = document.getElementById('dm-header-btn');
    if (dmHeaderBtn) {
        // Eski event listener'ı kaldır ve yenisini ekle
        const newBtn = dmHeaderBtn.cloneNode(true);
        dmHeaderBtn.parentNode.replaceChild(newBtn, dmHeaderBtn);
        
        newBtn.addEventListener('click', () => {
            MessagingPage.open();
        });
    }
});

console.log('✅ Messaging Page sistemi yüklendi');

