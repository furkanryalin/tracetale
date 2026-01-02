// ===================================
// INSTAGRAM-STYLE PROFILE PAGE
// ===================================

const ProfilePage = {
    currentTab: 'stories',
    userId: null,
    userData: null,
    userStories: [],
    isFollowing: false,
    isOwnProfile: false,
    
    // Profil sayfasını aç
    async open(userId = null) {
        const profilePage = document.getElementById('profile-page');
        if (!profilePage) {
            console.error('Profile page bulunamadı!');
            return;
        }
        
        const currentUser = getCurrentUser();
        
        // userId parametresi varsa onu kullan, yoksa current user'ı kullan
        if (userId !== null && userId !== undefined) {
            this.userId = parseInt(userId);
            console.log('👤 Belirtilen userId ile profil açılıyor:', this.userId, 'Type:', typeof this.userId);
        } else {
            this.userId = currentUser?.id;
            console.log('👤 Kendi profilim açılıyor:', this.userId);
        }
        
        // isOwnProfile kontrolünü doğru yap - ZORUNLU parseInt
        const currentUserId = currentUser ? parseInt(currentUser.id) : null;
        this.isOwnProfile = (currentUserId !== null && this.userId === currentUserId);
        
        console.log('👤 Profil açılıyor:', {
            targetUserId: this.userId,
            targetType: typeof this.userId,
            currentUserId: currentUserId,
            currentType: typeof currentUserId,
            isOwnProfile: this.isOwnProfile,
            strictEquality: this.userId === currentUserId,
            comparison: `${this.userId} (${typeof this.userId}) === ${currentUserId} (${typeof currentUserId})`
        });
        
        if (!this.userId) {
            showNotification('Kullanıcı bilgisi bulunamadı! ❌');
            return;
        }
        
        // Profil sayfasını göster
        profilePage.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Kullanıcı bilgilerini yükle
        await this.loadUserData();
        
        // Takip durumunu kontrol et (kendi profilimiz değilse)
        if (!this.isOwnProfile) {
            await this.checkFollowStatus();
        }
        
        // Takip istatistiklerini yükle
        await this.loadFollowStats();
        
        // İlk tab'ı yükle
        this.switchTab('stories');
    },
    
    // Profil sayfasını kapat
    close() {
        const profilePage = document.getElementById('profile-page');
        if (profilePage) {
            profilePage.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    },
    
    // Kullanıcı bilgilerini yükle
    async loadUserData() {
        try {
            console.log('📡 Kullanıcı bilgileri yükleniyor, userId:', this.userId, 'isOwnProfile:', this.isOwnProfile);
            
            // Kendi profilimiz mi başkasının mı?
            if (this.isOwnProfile) {
                // Kendi profilimiz - /auth/profile kullan
                const response = await API.get('/auth/profile');
                
                if (response.success) {
                    this.userData = response.user;
                    console.log('✅ Kendi profil bilgisi yüklendi:', this.userData);
                    this.renderUserInfo();
                }
            } else {
                // Başka birinin profili - /auth/user/:userId endpoint'ini kullan
                console.log('👤 Başka birinin profili yükleniyor, userId:', this.userId);
                
                const response = await API.get(`/auth/user/${this.userId}`);
                
                if (response.success) {
                    this.userData = response.user;
                    console.log('✅ Kullanıcı profil bilgisi yüklendi:', this.userData);
                    console.log('🔍 isOwnProfile kontrol:', this.isOwnProfile, 'userData:', this.userData);
                    this.renderUserInfo();
                } else {
                    console.error('❌ Kullanıcı profili yüklenemedi');
                    showNotification('Kullanıcı bulunamadı! ❌');
                }
            }
        } catch (error) {
            console.error('Kullanıcı bilgileri yüklenemedi:', error);
            showNotification('Profil bilgileri yüklenemedi! ❌');
        }
    },
    
    // Kullanıcı bilgilerini render et
    renderUserInfo() {
        const user = this.userData;
        
        // Avatar
        const avatar = document.getElementById('profile-page-avatar');
        if (avatar) {
            if (user.avatar) {
                avatar.src = user.avatar;
            } else {
                // Varsayılan avatar (SVG data URL - emoji kaldırıldı)
                avatar.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%232196F3'/%3E%3C/svg%3E";
            }
        }
        
        // İsim ve kullanıcı adı
        const name = document.getElementById('profile-page-name');
        const username = document.getElementById('profile-page-username');
        const handle = document.getElementById('profile-page-handle');
        
        // Privacy mode badge ekle
        const isPrivate = user.privacy_mode === 'private';
        const privacyBadge = isPrivate ? ' 🔒' : '';
        
        if (name) name.textContent = (user.name || 'Kullanıcı') + privacyBadge;
        if (username) username.textContent = `@${user.name?.toLowerCase().replace(/\s+/g, '') || 'user'}`;
        if (handle) handle.textContent = `@${user.name?.toLowerCase().replace(/\s+/g, '') || 'user'}`;
        
        // Bio
        const bio = document.getElementById('profile-page-bio');
        if (bio) {
            const bioText = user.bio || 'Henüz bir bio eklenmedi...';
            const privacyInfo = isPrivate ? '\n\n🔒 Gizli hesap - Sadece takipçiler görebilir' : '';
            bio.textContent = bioText + privacyInfo;
        }
        
        // Ayarlar butonunu sadece kendi profilinde göster
        const settingsBtn = document.getElementById('profile-page-settings-btn');
        if (settingsBtn) {
            settingsBtn.style.display = this.isOwnProfile ? 'flex' : 'none';
        }
        
        console.log('🎯 updateActionButtons çağrılıyor, isOwnProfile:', this.isOwnProfile);
        
        // Takip butonu veya düzenle butonu göster
        this.updateActionButtons();
    },
    
    // Aksiyon butonlarını güncelle
    updateActionButtons() {
        // Önce profil page içindeki actions div'i bul
        const profilePage = document.getElementById('profile-page');
        if (!profilePage) {
            console.error('❌ profile-page bulunamadı!');
            return;
        }
        
        const actionsDiv = profilePage.querySelector('.profile-actions');
        if (!actionsDiv) {
            console.error('❌ profile-actions div bulunamadı!');
            console.log('🔍 Profil page:', profilePage);
            console.log('🔍 Tüm profile-actions divleri:', document.querySelectorAll('.profile-actions'));
            return;
        }
        
        console.log('🔧 Butonlar güncelleniyor:', {
            isOwnProfile: this.isOwnProfile,
            userId: this.userId,
            isFollowing: this.isFollowing,
            actionsDiv: actionsDiv,
            parentElement: actionsDiv.parentElement
        });
        
        // Önce mevcut içeriği temizle
        actionsDiv.innerHTML = '';
        
        // Force reflow
        void actionsDiv.offsetHeight;
        
        if (this.isOwnProfile === true) {
            // Kendi profilimiz - SADECE düzenle ve paylaş butonları
            console.log('✅ Kendi profil butonları gösteriliyor');
            const html = `
                <button class="profile-action-btn primary" id="profile-page-edit-btn">
                    <i class="fas fa-pencil-alt"></i> Profili Düzenle
                </button>
                <button class="profile-action-btn secondary" id="profile-page-share-btn">
                    <i class="fas fa-share"></i> Paylaş
                </button>
            `;
            actionsDiv.innerHTML = html;
            console.log('✅ HTML güncellendi:', html);
        } else {
            // Başka birinin profili - takip/mesaj/daha fazla butonları (Instagram tarzı)
            console.log('✅ Başkasının profil butonları gösteriliyor');
            const followBtnText = this.isFollowing ? 'Takip Ediliyor' : 'Takip Et';
            const followBtnClass = this.isFollowing ? 'following' : '';
            
            const html = `
                <button class="profile-action-btn-main ${followBtnClass}" id="profile-page-follow-btn">
                    ${followBtnText}
                </button>
                <button class="profile-action-btn-main secondary" id="profile-page-message-btn">
                    Mesaj Gönder
                </button>
                <button class="profile-action-btn-icon" id="profile-page-more-btn">
                    <span class="more-icon">+</span>
                </button>
            `;
            actionsDiv.innerHTML = html;
            console.log('✅ HTML güncellendi:', html);
        }
        
        // Force reflow again
        void actionsDiv.offsetHeight;
        
        // Debug: Butonların gerçekten oluştuğunu kontrol et
        console.log('🔍 ActionsDiv içeriği:', actionsDiv.innerHTML);
        console.log('🔍 ActionsDiv children:', actionsDiv.children.length);
        console.log('🔍 ActionsDiv display:', window.getComputedStyle(actionsDiv).display);
        console.log('🔍 ActionsDiv visibility:', window.getComputedStyle(actionsDiv).visibility);
        
        // Event listener'ları yeniden kur (setTimeout ile)
        setTimeout(() => {
            this.setupActionButtons();
        }, 0);
    },
    
    // Takip durumunu kontrol et
    async checkFollowStatus() {
        try {
            const response = await API.get(`/follow/status/${this.userId}`);
            if (response.success) {
                this.isFollowing = response.isFollowing;
                this.updateActionButtons();
            }
        } catch (error) {
            console.error('Takip durumu kontrol edilemedi:', error);
        }
    },
    
    // Takip istatistiklerini yükle
    async loadFollowStats() {
        try {
            const response = await API.get(`/follow/stats/${this.userId}`);
            if (response.success) {
                // Takipçi ve takip edilen sayılarını güncelle
                const followersCount = document.getElementById('profile-page-followers-count');
                const followingCount = document.getElementById('profile-page-following-count');
                
                if (followersCount) followersCount.textContent = response.followers || 0;
                if (followingCount) followingCount.textContent = response.following || 0;
            }
        } catch (error) {
            console.error('Takip istatistikleri yüklenemedi:', error);
        }
    },
    
    // Takip et / Takipten çık
    async toggleFollow() {
        try {
            if (this.isFollowing) {
                // Takipten çık
                const response = await API.delete(`/follow/unfollow/${this.userId}`);
                if (response.success) {
                    this.isFollowing = false;
                    showNotification('Takipten çıkıldı');
                    this.updateActionButtons();
                    this.loadFollowStats();
                }
            } else {
                // Takip et
                const response = await API.post(`/follow/follow/${this.userId}`);
                if (response.success) {
                    this.isFollowing = true;
                    showNotification('Takip edildi ✓');
                    this.updateActionButtons();
                    this.loadFollowStats();
                }
            }
        } catch (error) {
            console.error('Takip işlemi başarısız:', error);
            showNotification('Bir hata oluştu! ❌');
        }
    },
    
    // Tab değiştir
    async switchTab(tabName) {
        this.currentTab = tabName;
        
        // Tab butonlarını güncelle
        document.querySelectorAll('.profile-tab').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Tab panellerini güncelle
        document.querySelectorAll('.profile-tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`).classList.add('active');
        
        // İçeriği yükle
        await this.loadTabContent(tabName);
    },
    
    // Tab içeriğini yükle
    async loadTabContent(tabName) {
        switch(tabName) {
            case 'stories':
                await this.loadStories();
                break;
            case 'notes':
                await this.loadNotes();
                break;
            case 'photos':
                await this.loadPhotos();
                break;
        }
    },
    
    // Hikayeleri yükle
    async loadStories() {
        const loading = document.getElementById('stories-loading');
        const grid = document.getElementById('stories-grid');
        const empty = document.getElementById('stories-empty');
        const countElement = document.getElementById('profile-page-stories-count');
        
        // Loading göster
        loading.style.display = 'flex';
        grid.innerHTML = '';
        empty.style.display = 'none';
        
        try {
            // API'den hikayeleri çek (backend'de privacy filtresi var)
            const response = await API.get('/stories');
            
            if (response.success && response.stories) {
                // Sadece bu kullanıcının hikayelerini filtrele
                const userStories = response.stories.filter(story => 
                    story.user_id === this.userId && story.type === 'story'
                );
                
                this.userStories = userStories;
                
                // Count güncelle
                if (countElement) {
                    countElement.textContent = userStories.length;
                }
                
                // Loading gizle
                loading.style.display = 'none';
                
                // Private hesap kontrolü
                const currentUser = getCurrentUser();
                const isPrivateAccount = this.userData?.privacy_mode === 'private';
                const isOwnProfile = currentUser && currentUser.id === this.userId;
                
                if (userStories.length === 0) {
                    // Eğer private hesapsa ve kendi profili değilse, özel mesaj göster
                    if (isPrivateAccount && !isOwnProfile && !this.isFollowing) {
                        const emptyText = empty.querySelector('p');
                        if (emptyText) {
                            emptyText.innerHTML = '<i class="fas fa-lock" style="font-size: 1.2em; vertical-align: middle; margin-right: 6px;"></i> Bu hesap gizli. Hikayeleri görmek için takip edin.';
                        }
                    }
                    empty.style.display = 'block';
                } else {
                    this.renderStories(userStories);
                }
            }
        } catch (error) {
            console.error('Hikayeler yüklenemedi:', error);
            loading.style.display = 'none';
            empty.style.display = 'block';
        }
    },
    
    // Hikayeleri render et
    renderStories(stories) {
        const grid = document.getElementById('stories-grid');
        grid.innerHTML = '';
        
        stories.forEach(story => {
            const card = document.createElement('div');
            card.className = 'story-card';
            card.innerHTML = `
                <div class="story-card-header">
                    <h3 class="story-card-title">${story.title || 'Başlıksız'}</h3>
                    <span class="story-card-date">${this.formatDate(story.created_at)}</span>
                </div>
                <p class="story-card-content">${story.content || ''}</p>
                <div class="story-card-location">
                    <span>📍</span>
                    <span>${story.location || 'Konum bilinmiyor'}</span>
                </div>
            `;
            
            // Hikayeye tıklayınca haritada göster
            card.addEventListener('click', () => {
                this.showStoryOnMap(story);
            });
            
            grid.appendChild(card);
        });
    },
    
    // Notları yükle
    async loadNotes() {
        const loading = document.getElementById('notes-loading');
        const list = document.getElementById('notes-list');
        const empty = document.getElementById('notes-empty');
        const countElement = document.getElementById('profile-page-notes-count');
        
        // Loading göster
        loading.style.display = 'flex';
        list.innerHTML = '';
        empty.style.display = 'none';
        
        try {
            // API'den notları çek (backend'de privacy filtresi var)
            const response = await API.get('/stories');
            
            if (response.success && response.stories) {
                // Sadece bu kullanıcının notlarını filtrele
                const userNotes = response.stories.filter(story => 
                    story.user_id === this.userId && story.type === 'note'
                );
                
                // Count güncelle
                if (countElement) {
                    countElement.textContent = userNotes.length;
                }
                
                // Loading gizle
                loading.style.display = 'none';
                
                // Private hesap kontrolü
                const currentUser = getCurrentUser();
                const isPrivateAccount = this.userData?.privacy_mode === 'private';
                const isOwnProfile = currentUser && currentUser.id === this.userId;
                
                if (userNotes.length === 0) {
                    // Eğer private hesapsa ve kendi profili değilse, özel mesaj göster
                    if (isPrivateAccount && !isOwnProfile && !this.isFollowing) {
                        const emptyText = empty.querySelector('p');
                        if (emptyText) {
                            emptyText.innerHTML = '<i class="fas fa-lock" style="font-size: 1.2em; vertical-align: middle; margin-right: 6px;"></i> Bu hesap gizli. Notları görmek için takip edin.';
                        }
                    }
                    empty.style.display = 'block';
                } else {
                    this.renderNotes(userNotes);
                }
            }
        } catch (error) {
            console.error('Notlar yüklenemedi:', error);
            loading.style.display = 'none';
            empty.style.display = 'block';
        }
    },
    
    // Notları render et
    renderNotes(notes) {
        const list = document.getElementById('notes-list');
        list.innerHTML = '';
        
        notes.forEach(note => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.innerHTML = `
                <div class="note-card-header">
                    <h3 class="note-card-title">${note.title || 'Başlıksız'}</h3>
                    <span class="note-card-date">${this.formatDate(note.created_at)}</span>
                </div>
                <p class="note-card-content">${note.content || ''}</p>
            `;
            
            // Nota tıklayınca haritada göster
            card.addEventListener('click', () => {
                this.showStoryOnMap(note);
            });
            
            list.appendChild(card);
        });
    },
    
    // Fotoğrafları yükle
    async loadPhotos() {
        const loading = document.getElementById('photos-loading');
        const grid = document.getElementById('photos-grid');
        const empty = document.getElementById('photos-empty');
        const countElement = document.getElementById('profile-page-photos-count');
        
        // Loading göster
        loading.style.display = 'flex';
        grid.innerHTML = '';
        empty.style.display = 'none';
        
        try {
            // API'den fotoğrafları çek (backend'de privacy filtresi var)
            const response = await API.get('/stories');
            
            if (response.success && response.stories) {
                // Sadece bu kullanıcının fotoğraflarını filtrele
                const userPhotos = response.stories.filter(story => 
                    story.user_id === this.userId && story.type === 'photo' && story.photo
                );
                
                // Count güncelle
                if (countElement) {
                    countElement.textContent = userPhotos.length;
                }
                
                // Loading gizle
                loading.style.display = 'none';
                
                // Private hesap kontrolü
                const currentUser = getCurrentUser();
                const isPrivateAccount = this.userData?.privacy_mode === 'private';
                const isOwnProfile = currentUser && currentUser.id === this.userId;
                
                if (userPhotos.length === 0) {
                    // Eğer private hesapsa ve kendi profili değilse, özel mesaj göster
                    if (isPrivateAccount && !isOwnProfile && !this.isFollowing) {
                        const emptyText = empty.querySelector('p');
                        if (emptyText) {
                            emptyText.innerHTML = '<i class="fas fa-lock" style="font-size: 1.2em; vertical-align: middle; margin-right: 6px;"></i> Bu hesap gizli. Fotoğrafları görmek için takip edin.';
                        }
                    }
                    empty.style.display = 'block';
                } else {
                    this.renderPhotos(userPhotos);
                }
            }
        } catch (error) {
            console.error('Fotoğraflar yüklenemedi:', error);
            loading.style.display = 'none';
            empty.style.display = 'block';
        }
    },
    
    // Fotoğrafları render et
    renderPhotos(photos) {
        const grid = document.getElementById('photos-grid');
        grid.innerHTML = '';
        
        photos.forEach(photo => {
            const item = document.createElement('div');
            item.className = 'photo-item';
            item.innerHTML = `
                <img src="${photo.photo}" alt="${photo.title || 'Fotoğraf'}">
                <div class="photo-overlay">
                    <span>📍 ${photo.location || 'Konum'}</span>
                </div>
            `;
            
            // Fotoğrafa tıklayınca haritada göster
            item.addEventListener('click', () => {
                this.showStoryOnMap(photo);
            });
            
            grid.appendChild(item);
        });
    },
    
    // Hikayeyi haritada göster
    showStoryOnMap(story) {
        // Profil sayfasını kapat
        this.close();
        
        // Haritayı story'nin konumuna taşı
        if (story.lat && story.lng && typeof window.map !== 'undefined') {
            window.map.setView([story.lat, story.lng], 15);
            
            // Story marker'ını bul ve popup'ını aç
            setTimeout(() => {
                if (typeof markers !== 'undefined') {
                    markers.forEach(marker => {
                        if (marker.storyData && marker.storyData.id === story.id) {
                            marker.openPopup();
                        }
                    });
                }
            }, 500);
        }
    },
    
    // Tarih formatlama
    formatDate(dateString) {
        if (!dateString) return 'Tarih bilinmiyor';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Tarih bilinmiyor';
        
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Bugün';
        if (days === 1) return 'Dün';
        if (days < 7) return `${days} gün önce`;
        if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
        if (days < 365) return `${Math.floor(days / 30)} ay önce`;
        
        return date.toLocaleDateString('tr-TR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    },
    
    // Event listener'ları kur
    setupEventListeners() {
        // Geri butonu
        const backBtn = document.getElementById('profile-page-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.close());
        }
        
        // Ayarlar butonu (sadece kendi profilinde)
        const settingsBtn = document.getElementById('profile-page-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                // Güvenlik: Sadece kendi profilinde ayarlar açılabilir
                const currentUser = getCurrentUser();
                if (!currentUser || this.userId !== currentUser.id) {
                    showNotification('Sadece kendi ayarlarınızı açabilirsiniz! ❌');
                    return;
                }
                
                this.close();
                // Ayarlar modalını aç
                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal) {
                    settingsModal.classList.remove('hidden');
                }
            });
        }
        
        // Tab butonları
        document.querySelectorAll('.profile-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Takipçi ve takip edilen sayılarına tıklama
        const followersBtn = document.querySelector('.profile-stat-item:nth-child(1)');
        const followingBtn = document.querySelector('.profile-stat-item:nth-child(2)');
        
        if (followersBtn) {
            followersBtn.style.cursor = 'pointer';
            followersBtn.addEventListener('click', () => this.showFollowersList());
        }
        
        if (followingBtn) {
            followingBtn.style.cursor = 'pointer';
            followingBtn.addEventListener('click', () => this.showFollowingList());
        }
        
        console.log('✅ Profile Page event listeners kuruldu');
    },
    
    // Aksiyon butonları için event listener
    setupActionButtons() {
        const editBtn = document.getElementById('profile-page-edit-btn');
        const shareBtn = document.getElementById('profile-page-share-btn');
        const followBtn = document.getElementById('profile-page-follow-btn');
        const messageBtn = document.getElementById('profile-page-message-btn');
        const moreBtn = document.getElementById('profile-page-more-btn');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.showEditProfileModal();
            });
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareProfile();
            });
        }
        
        if (followBtn) {
            followBtn.addEventListener('click', () => {
                this.toggleFollow();
            });
        }
        
        if (messageBtn) {
            messageBtn.addEventListener('click', () => {
                this.startConversation();
            });
        }
        
        if (moreBtn) {
            moreBtn.addEventListener('click', (e) => {
                this.showMoreMenu(e);
            });
        }
    },
    
    // Daha fazla menüsü göster
    showMoreMenu(event) {
        event.stopPropagation();
        
        // Eski menüyü kaldır
        const oldMenu = document.getElementById('profile-more-menu');
        if (oldMenu) oldMenu.remove();
        
        // Menü oluştur
        const menu = document.createElement('div');
        menu.id = 'profile-more-menu';
        menu.style.cssText = `
            position: fixed;
            background: #1a1a2e;
            border: 1px solid #363636;
            border-radius: 12px;
            padding: 8px 0;
            z-index: 10000;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            min-width: 200px;
        `;
        
        // Menü seçenekleri
        const options = [];
        
        if (this.isFollowing) {
            options.push({
                icon: '🔕',
                text: 'Bildirimleri Kapat',
                action: () => {
                    showNotification('Bildirimler kapatıldı (yakında aktif)');
                    menu.remove();
                }
            });
            options.push({
                icon: '👥',
                text: 'Yakın Arkadaşlara Ekle',
                action: () => {
                    showNotification('Yakın arkadaşlar özelliği yakında!');
                    menu.remove();
                }
            });
            options.push({
                icon: '❌',
                text: 'Takipten Çık',
                action: async () => {
                    menu.remove();
                    await this.toggleFollow();
                }
            });
            options.push({
                icon: '🚫',
                text: 'Takipçilerden Çıkar',
                action: () => {
                    this.showRemoveFollowerConfirm();
                    menu.remove();
                }
            });
        } else {
            options.push({
                icon: '📋',
                text: 'Profili Kopyala',
                action: () => {
                    this.shareProfile();
                    menu.remove();
                }
            });
        }
        
        options.push({
            icon: '⚠️',
            text: 'Kullanıcıyı Bildir',
            action: () => {
                showNotification('Bildirme özelliği yakında!');
                menu.remove();
            }
        });
        
        options.push({
            icon: '🚫',
            text: 'Engelle',
            danger: true,
            action: () => {
                this.showBlockConfirm();
                menu.remove();
            }
        });
        
        // Seçenekleri ekle
        options.forEach(option => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 12px 20px;
                cursor: pointer;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                gap: 12px;
                color: ${option.danger ? '#ff4757' : '#fff'};
                font-size: 15px;
            `;
            item.innerHTML = `
                <span style="font-size: 18px;">${option.icon}</span>
                <span>${option.text}</span>
            `;
            item.onmouseover = () => item.style.background = 'rgba(255,255,255,0.1)';
            item.onmouseout = () => item.style.background = 'transparent';
            item.onclick = option.action;
            menu.appendChild(item);
        });
        
        // Menüyü konumlandır
        document.body.appendChild(menu);
        const rect = event.target.getBoundingClientRect();
        menu.style.top = (rect.bottom + 8) + 'px';
        menu.style.right = '20px';
        
        // Dışarı tıklayınca kapat
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 100);
    },
    
    // Takipçiden çıkarma onayı
    showRemoveFollowerConfirm() {
        const confirmed = confirm(`${this.userData?.name} kişisini takipçilerinizden çıkarmak istediğinize emin misiniz?`);
        if (confirmed) {
            // TODO: API endpoint'i eklendiğinde
            showNotification('Takipçilerden çıkarma özelliği yakında aktif olacak!');
        }
    },
    
    // Engelleme onayı
    showBlockConfirm() {
        const confirmed = confirm(`${this.userData?.name} kişisini engellemek istediğinize emin misiniz? Bu kullanıcı sizi göremeyecek ve mesaj gönderemeyecek.`);
        if (confirmed) {
            // TODO: API endpoint'i eklendiğinde
            showNotification('Engelleme özelliği yakında aktif olacak!');
        }
    },
    
    // Profili düzenle modalını göster
    showEditProfileModal() {
        // Güvenlik: Sadece kendi profilini düzenleyebilir
        if (!this.isOwnProfile) {
            showNotification('Sadece kendi profilinizi düzenleyebilirsiniz! ❌');
            return;
        }
        
        // Bio düzenleme modalı
        const bioText = prompt('Bio (max 300 karakter):', this.userData?.bio || '');
        if (bioText !== null) {
            // Uzunluk kontrolü
            if (bioText.length > 300) {
                showNotification('Bio en fazla 300 karakter olabilir! ⚠️');
                return;
            }
            this.updateBio(bioText);
        }
    },
    
    // Bio güncelle
    async updateBio(bio) {
        // Güvenlik: Sadece kendi bio'sunu güncelleyebilir
        if (!this.isOwnProfile) {
            showNotification('Sadece kendi profilinizi düzenleyebilirsiniz! ❌');
            return;
        }
        
        try {
            const response = await API.post('/auth/update-bio', { bio });
            if (response.success) {
                showNotification('Bio güncellendi! ✓');
                this.userData.bio = bio;
                const bioElement = document.getElementById('profile-page-bio');
                if (bioElement) bioElement.textContent = bio || 'Henüz bir bio eklenmedi...';
                
                // LocalStorage'daki kullanıcı bilgisini de güncelle
                const currentUser = getCurrentUser();
                if (currentUser) {
                    currentUser.bio = bio;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                }
            }
        } catch (error) {
            console.error('Bio güncellenemedi:', error);
            showNotification('Bio güncellenemedi! ❌');
        }
    },
    
    // Mesaj başlat
    startConversation() {
        // Güvenlik: Kendine mesaj gönderemez
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === this.userId) {
            showNotification('Kendinize mesaj gönderemezsiniz! ⚠️');
            return;
        }
        
        if (typeof MessagingAPI !== 'undefined') {
            this.close();
            MessagingAPI.startConversationWithUser(this.userData.name, this.userId);
        }
    },
    
    // Takipçiler listesini göster
    async showFollowersList() {
        try {
            const response = await API.get(`/follow/followers/${this.userId}`);
            if (response.success) {
                this.showUserList('Takipçiler', response.followers);
            }
        } catch (error) {
            console.error('Takipçiler yüklenemedi:', error);
        }
    },
    
    // Takip edilenler listesini göster
    async showFollowingList() {
        try {
            const response = await API.get(`/follow/following/${this.userId}`);
            if (response.success) {
                this.showUserList('Takip Edilenler', response.following);
            }
        } catch (error) {
            console.error('Takip edilenler yüklenemedi:', error);
        }
    },
    
    // Kullanıcı listesini göster (takipçi/takip edilen)
    showUserList(title, users) {
        // Basit bir modal ile göster
        let html = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                 background: #1a1a2e; padding: 30px; border-radius: 20px; z-index: 20000; 
                 max-width: 400px; width: 90%; max-height: 600px; overflow-y: auto;
                 box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                <h2 style="color: white; margin-bottom: 20px;">${title}</h2>
        `;
        
        if (users.length === 0) {
            html += '<p style="color: rgba(255,255,255,0.6); text-align: center;">Henüz kimse yok</p>';
        } else {
            users.forEach(user => {
                const avatar = user.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Ccircle cx='25' cy='25' r='25' fill='%232196F3'/%3E%3C/svg%3E";
                html += `
                    <div style="display: flex; align-items: center; gap: 15px; padding: 12px; 
                         border-radius: 10px; margin-bottom: 10px; background: rgba(255,255,255,0.05);
                         cursor: pointer; transition: all 0.3s;"
                         onmouseover="this.style.background='rgba(255,255,255,0.1)'"
                         onmouseout="this.style.background='rgba(255,255,255,0.05)'"
                         onclick="ProfilePage.open(${user.id}); document.getElementById('user-list-overlay').remove();">
                        <img src="${avatar}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                        <div>
                            <div style="color: white; font-weight: 600;">${user.name}</div>
                            <div style="color: rgba(255,255,255,0.5); font-size: 13px;">@${user.name.toLowerCase().replace(/\s+/g, '')}</div>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `
                <button onclick="document.getElementById('user-list-overlay').remove();" 
                    style="width: 100%; padding: 12px; margin-top: 20px; background: rgba(255,255,255,0.1); 
                    color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 15px;">
                    Kapat
                </button>
            </div>
            <div onclick="document.getElementById('user-list-overlay').remove();" 
                 style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                 background: rgba(0,0,0,0.7); z-index: 19999;"></div>
        `;
        
        const overlay = document.createElement('div');
        overlay.id = 'user-list-overlay';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
    },
    
    // Profili paylaş
    shareProfile() {
        const user = getCurrentUser();
        if (!user) return;
        
        const username = user.name?.toLowerCase().replace(/\s+/g, '') || 'user';
        const shareText = `TraceMark'ta beni takip et! @${username}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'TraceMark Profilim',
                text: shareText,
            }).catch(err => console.log('Paylaşım iptal edildi'));
        } else {
            // Clipboard'a kopyala
            navigator.clipboard.writeText(shareText);
            showNotification('Profil linki kopyalandı! 📋');
        }
    }
};

// Sayfa yüklendiğinde event listener'ları kur
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ProfilePage.setupEventListeners();
    });
} else {
    ProfilePage.setupEventListeners();
}

// Global erişim için
window.ProfilePage = ProfilePage;

console.log('✅ Profile Page sistemi yüklendi');

