// ===================================
// PROFILE - Profil Yönetimi
// ===================================

function setupProfileSystem() {
    console.log('Profil sistemi başlatılıyor...');
    
    const profileModal = document.getElementById('profile-modal');
    const profileClose = document.getElementById('profile-close');
    
    if (!profileModal) {
        console.error('Profile modal bulunamadı!');
        return;
    }
    
    console.log('Profil elementleri bulundu');
    
    profileClose.addEventListener('click', closeProfileModal);
    profileModal.addEventListener('click', function(e) {
        if (e.target === profileModal) {
            closeProfileModal();
        }
    });
    
    // Ayarlar modalını kur
    setupSettingsModal();
    
    const editProfileBtn = document.getElementById('edit-profile');
    const myStoriesBtn = document.getElementById('my-stories');
    const settingsBtn = document.getElementById('settings');
    const logoutBtn = document.getElementById('logout');
    const avatarEditBtn = document.querySelector('.avatar-edit');
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            console.log('Edit profile butonu tıklandı');
            showEditProfileModal();
        });
    } else {
        console.warn('Edit profile butonu bulunamadı');
    }
    
    // Çıkış yap butonu event listener
    const logoutBtnSettings = document.getElementById('logout-btn');
    if (logoutBtnSettings) {
        logoutBtnSettings.addEventListener('click', async () => {
            if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
                console.log('🚪 Çıkış yapılıyor...');
                
                // Settings modal'ı kapat
                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal) {
                    settingsModal.classList.add('hidden');
                }
                
                // Logout fonksiyonunu çağır
                if (typeof logout === 'function') {
                    await logout();
                } else {
                    console.error('❌ Logout fonksiyonu bulunamadı!');
                    localStorage.clear();
                    window.location.reload();
                }
            }
        });
        console.log('✅ Logout butonu event listener eklendi');
    }
    
    if (myStoriesBtn) {
        myStoriesBtn.addEventListener('click', () => {
            showMyStories();
        });
    }
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            showSettings();
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
        });
    }
    
    if (avatarEditBtn) {
        avatarEditBtn.addEventListener('click', () => {
            changeAvatar();
        });
    }
}

function closeProfileModal() {
    const profileModal = document.getElementById('profile-modal');
    profileModal.classList.add('hidden');
}

function updateProfileStats() {
    const stories = Object.values(storyMarkers).filter(marker => marker.storyData.type === 'story').length;
    const notes = Object.values(storyMarkers).filter(marker => marker.storyData.type === 'note').length;
    const photos = Object.values(storyMarkers).filter(marker => marker.storyData.type === 'photo').length;
    
    document.getElementById('profile-stories').textContent = stories;
    document.getElementById('profile-notes').textContent = notes;
    document.getElementById('profile-photos').textContent = photos;
}

function showEditProfileModal() {
    // Profil resmi yükleme
    uploadProfilePicture();
}

// Profil resmi yükleme
function uploadProfilePicture() {
    // Güvenlik: Sadece kendi profil resmini yükleyebilir
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Profil resmi yüklemek için giriş yapmalısınız! 🔐');
        return;
    }
    
    // Dosya input elementi oluştur
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Dosya boyutu kontrolü (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Dosya boyutu 5MB\'dan küçük olmalıdır! ⚠️');
            return;
        }
        
        // Dosya tipi kontrolü
        if (!file.type.startsWith('image/')) {
            showNotification('Sadece resim dosyaları yüklenebilir! 🖼️');
            return;
        }
        
        try {
            showNotification('Profil resmi yükleniyor... 📸');
            
            // FormData oluştur
            const formData = new FormData();
            formData.append('avatar', file);
            
            // Backend'e gönder (sadece kendi avatar'ı güncelleyebilir)
            const response = await fetch(API_URL + '/auth/upload-avatar', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + currentUser.token
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // LocalStorage'daki kullanıcı bilgisini güncelle
                currentUser.avatar = data.avatar;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Profil modalındaki avatar'ı güncelle
                const profileAvatarImg = document.getElementById('profile-avatar');
                if (profileAvatarImg) {
                    profileAvatarImg.src = data.avatar;
                    console.log('✅ Profil avatar güncellendi:', data.avatar.substring(0, 50) + '...');
                }
                
                // Profil sayfasındaki avatar'ı güncelle
                const profilePageAvatar = document.getElementById('profile-page-avatar');
                if (profilePageAvatar) {
                    profilePageAvatar.src = data.avatar;
                }
                
                // Header'daki avatar'ı da güncelle
                updateAuthButton();
                
                // Tüm avatar elementlerini güncelle
                const allAvatars = document.querySelectorAll('.profile-avatar img, #profile-avatar, .avatar-display img');
                allAvatars.forEach(avatar => {
                    if (avatar) {
                        avatar.src = data.avatar;
                    }
                });
                
                showNotification('Profil resmi güncellendi! ✨');
            } else {
                showNotification(data.message || 'Profil resmi yüklenemedi! ❌');
            }
            
        } catch (error) {
            console.error('Avatar upload error:', error);
            showNotification('Profil resmi yüklenirken hata oluştu! ❌');
        }
    });
    
    // Dosya seçiciyi aç
    fileInput.click();
}

function showMyStories() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Lütfen önce giriş yapın! 🔐');
        return;
    }
    
    const myStories = Object.values(storyMarkers).filter(marker => 
        marker.storyData.userId === currentUser.id
    );
    
    if (myStories.length === 0) {
        showNotification('Henüz hikayeniz yok. İlk hikayenizi ekleyin! 📖');
        return;
    }
    
    showNotification(`${myStories.length} hikayeniz bulundu! 📚`);
    
    Object.values(storyMarkers).forEach(marker => {
        if (myStories.includes(marker)) {
            marker.setOpacity(1);
            marker.openPopup();
        } else {
            marker.setOpacity(0.3);
        }
    });
    
    closeProfileModal();
}

function showSettings() {
    const settingsModal = document.getElementById('settings-modal');
    const profileModal = document.getElementById('profile-modal');
    
    if (settingsModal) {
        // Profil modalını kapat
        if (profileModal) {
            profileModal.classList.add('hidden');
        }
        
        // Ayarlar modalını aç
        settingsModal.classList.remove('hidden');
        
        // Ayarları yükle
        loadSettings();
    }
}

// Ayarları localStorage ve backend'den yükle
async function loadSettings() {
    // Default ayarlar
    const defaults = {
        darkMode: true,
        animations: true,
        messageNotif: true,
        storyNotif: false,
        soundNotif: true,
        showOnline: true,
        lastSeen: true,
        shareLocation: true,
        autoLocation: true,
        mapLabels: true
    };
    
    let settings = { ...defaults };
    
    // Önce localStorage'dan yükle
    const localSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    settings = { ...settings, ...localSettings };
    
    // Sonra backend'den yükle (varsa güncelle)
    try {
        if (typeof API !== 'undefined' && isLoggedIn()) {
            const response = await API.get('/auth/settings');
            if (response.success && response.settings) {
                settings = { ...settings, ...response.settings };
                // localStorage'ı da güncelle
                localStorage.setItem('userSettings', JSON.stringify(settings));
            }
        }
    } catch (error) {
        console.error('Ayarlar backend\'den yüklenemedi:', error);
        // localStorage ayarlarıyla devam et
    }
    
    // Toggle'ları güncelle
    document.getElementById('setting-dark-mode').checked = settings.darkMode;
    document.getElementById('setting-animations').checked = settings.animations;
    document.getElementById('setting-message-notif').checked = settings.messageNotif;
    document.getElementById('setting-story-notif').checked = settings.storyNotif;
    document.getElementById('setting-sound-notif').checked = settings.soundNotif;
    if (document.getElementById('setting-privacy-mode')) {
        document.getElementById('setting-privacy-mode').checked = settings.privacyMode || false;
    }
    document.getElementById('setting-show-online').checked = settings.showOnline;
    document.getElementById('setting-last-seen').checked = settings.lastSeen;
    document.getElementById('setting-share-location').checked = settings.shareLocation;
    document.getElementById('setting-auto-location').checked = settings.autoLocation;
    document.getElementById('setting-map-labels').checked = settings.mapLabels;
    
    // Ayarları uygula
    applySettings(settings);
}

// Ayarları kaydet
async function saveSettings() {
    const settings = {
        darkMode: document.getElementById('setting-dark-mode').checked,
        animations: document.getElementById('setting-animations').checked,
        messageNotif: document.getElementById('setting-message-notif').checked,
        storyNotif: document.getElementById('setting-story-notif').checked,
        soundNotif: document.getElementById('setting-sound-notif').checked,
        privacyMode: document.getElementById('setting-privacy-mode').checked,
        showOnline: document.getElementById('setting-show-online').checked,
        lastSeen: document.getElementById('setting-last-seen').checked,
        shareLocation: document.getElementById('setting-share-location').checked,
        autoLocation: document.getElementById('setting-auto-location').checked,
        mapLabels: document.getElementById('setting-map-labels').checked
    };
    
    // localStorage'a kaydet
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    // Backend'e kaydet
    try {
        if (typeof API !== 'undefined') {
            await API.post('/auth/update-settings', settings);
        }
    } catch (error) {
        console.error('Ayarlar backend\'e kaydedilemedi:', error);
        // Hata olsa bile devam et, localStorage'da kayıtlı
    }
    
    // Ayarları uygula
    applySettings(settings);
    
    showNotification('Ayarlar kaydedildi! ⚙️✨');
    closeSettingsModal();
}

// Ayarları uygula
function applySettings(settings) {
    // 1. Karanlık mod
    if (settings.darkMode) {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    }
    
    // 2. Animasyonlar
    if (!settings.animations) {
        document.body.style.setProperty('--animation-speed', '0s');
        document.body.classList.add('no-animations');
    } else {
        document.body.style.removeProperty('--animation-speed');
        document.body.classList.remove('no-animations');
    }
    
    // 3. Bildirimler - Tarayıcı bildirimi izni iste
    if (settings.messageNotif || settings.storyNotif) {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Bildirim izni:', permission);
            });
        }
    }
    
    // 4. Ses bildirimleri için global değişken
    window.SOUND_NOTIFICATIONS_ENABLED = settings.soundNotif;
    
    // 4.5. Gizli mod
    if (settings.privacyMode !== undefined) {
        console.log(`🔐 Gizli mod: ${settings.privacyMode ? 'AÇIK' : 'KAPALI'}`);
        window.PRIVACY_MODE_ENABLED = settings.privacyMode;
        
        // Kullanıcı bilgisini güncelle
        const currentUser = getCurrentUser();
        if (currentUser) {
            currentUser.privacy_mode = settings.privacyMode ? 'private' : 'public';
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }
    
    // 5. Gizlilik - Aktiflik durumu
    if (typeof activityTracker !== 'undefined') {
        if (settings.showOnline) {
            // Online durumu göster
            activityTracker.start();
        } else {
            // Online durumu gizle (ama backend'e yine de güncelleme gönder)
            activityTracker.updateOnlyBackend = true;
        }
    }
    
    // 6. Harita ayarları
    window.MAP_SETTINGS = {
        autoLocation: settings.autoLocation,
        mapLabels: settings.mapLabels,
        shareLocation: settings.shareLocation
    };
    
    // Eğer harita yüklüyse, etiketleri güncelle
    if (typeof map !== 'undefined' && map) {
        updateMapSettings(settings);
    }
    
    console.log('✅ Ayarlar uygulandı:', settings);
}

// Harita ayarlarını uygula
function updateMapSettings(settings) {
    if (typeof map === 'undefined' || !map) return;
    
    // Harita etiketlerini göster/gizle
    const tiles = document.querySelectorAll('.leaflet-tile-pane');
    tiles.forEach(tile => {
        if (settings.mapLabels) {
            tile.style.opacity = '1';
        } else {
            tile.style.opacity = '0.8';
        }
    });
    
    console.log('🗺️ Harita ayarları güncellendi');
}

// Ayarlar modalını kapat
function closeSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        settingsModal.classList.add('hidden');
    }
}

// Ayarlar modal event listener'ları
function setupSettingsModal() {
    const settingsClose = document.getElementById('settings-close');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const settingsModal = document.getElementById('settings-modal');
    
    if (settingsClose) {
        settingsClose.addEventListener('click', closeSettingsModal);
    }
    
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    if (cancelSettingsBtn) {
        cancelSettingsBtn.addEventListener('click', closeSettingsModal);
    }
    
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            showNotification('Şifre değiştirme özelliği yakında eklenecek! 🔑');
        });
    }
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            const confirm = window.confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!');
            if (confirm) {
                showNotification('Hesap silme özelliği yakında eklenecek! 🗑️');
            }
        });
    }
    
    // Modal dışına tıklayınca kapat
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                closeSettingsModal();
            }
        });
    }
}

function changeAvatar() {
    uploadProfilePicture();
}

async function openProfileModal() {
    const user = getCurrentUser();
    
    if (!user) {
        showNotification('Lütfen önce giriş yapın! 🔐');
        return;
    }
    
    // Yeni profil sayfasını aç
    if (typeof ProfilePage !== 'undefined') {
        ProfilePage.open();
        return;
    }
    
    const profileModal = document.getElementById('profile-modal');
    
    // Temel bilgileri göster
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email;
    
    // Avatar'ı göster (eğer varsa)
    if (user.avatar) {
        const profileAvatarImg = document.getElementById('profile-avatar');
        if (profileAvatarImg) {
            profileAvatarImg.src = user.avatar;
            console.log('✅ Avatar yüklendi:', user.avatar.substring(0, 50) + '...');
        }
        
        // Alternatif selector
        const profileAvatarByClass = document.querySelector('.profile-avatar img');
        if (profileAvatarByClass) {
            profileAvatarByClass.src = user.avatar;
        }
    }
    
    // İstatistikleri yükle
    try {
        const response = await API.get(Endpoints.PROFILE);
        
        if (response.success && response.stats) {
            document.getElementById('profile-stories').textContent = response.stats.stories || 0;
            document.getElementById('profile-notes').textContent = response.stats.notes || 0;
            document.getElementById('profile-photos').textContent = response.stats.photos || 0;
        } else {
            // Fallback: Default değerler
            document.getElementById('profile-stories').textContent = '0';
            document.getElementById('profile-notes').textContent = '0';
            document.getElementById('profile-photos').textContent = '0';
        }
    } catch (error) {
        console.error('Profil istatistikleri yüklenemedi:', error);
        // Hata durumunda default değerler
        document.getElementById('profile-stories').textContent = '0';
        document.getElementById('profile-notes').textContent = '0';
        document.getElementById('profile-photos').textContent = '0';
    }
    
    profileModal.classList.remove('hidden');
}

