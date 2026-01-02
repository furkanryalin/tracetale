// ===================================
// STORIES - Hikaye Yönetimi
// ===================================

// Global değişkenler
let isLoadingStories = false; // Race condition önleme
let loadedStoryIds = new Set(); // Yüklenen hikaye ID'lerini takip et

// Modal açma/kapama
function openModal() {
    const storyModal = document.getElementById('story-modal');
    storyModal.classList.remove('hidden');
}

function closeModalFunc() {
    const storyModal = document.getElementById('story-modal');
    storyModal.classList.add('hidden');
    document.getElementById('story-form').reset();
    clearPhotoPreview();
    document.getElementById('photo-upload-group').style.display = 'none';
    
    // Konum seçim marker'ını temizle
    if (locationSelectionMarker && window.map) {
        window.map.removeLayer(locationSelectionMarker);
        locationSelectionMarker = null;
    }
    
    // Konum seçimini iptal et
    if (isSelectingLocation) {
        isSelectingLocation = false;
        showNotification('Konum seçimi iptal edildi');
    }
}

function addStoryAtLocation(latLng) {
    currentLocation = latLng;
    openModal();
}

function showContextMenu(event, latLng) {
    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu) return;
    
    currentLocation = latLng;
    
    updateLocationDisplay(latLng);
    
    contextMenu.style.left = event.clientX + 'px';
    contextMenu.style.top = event.clientY + 'px';
    contextMenu.classList.remove('hidden');
    contextMenuVisible = true;
}

function hideContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu) return;
    
    contextMenu.classList.add('hidden');
    contextMenuVisible = false;
}

function openModalWithType(type) {
    const storyModal = document.getElementById('story-modal');
    const storyTypeSelect = document.getElementById('story-type');
    const photoUploadGroup = document.getElementById('photo-upload-group');
    
    if (!isLoggedIn()) {
        showNotification('Paylaşım yapmak için giriş yapın! 🔐');
        openAuthModal();
        return;
    }
    
    storyTypeSelect.value = type;
    
    if (type === 'photo') {
        photoUploadGroup.style.display = 'block';
    } else {
        photoUploadGroup.style.display = 'none';
        clearPhotoPreview();
    }
    
    storyModal.classList.remove('hidden');
    
    if (currentLocation) {
        updateLocationDisplay(currentLocation);
    }
}

// Konum seçme modu
let isSelectingLocation = false;
let locationSelectionMarker = null;

function updateLocationDisplay(latLng) {
    const locationSpan = document.getElementById('selected-location');
    if (locationSpan && latLng) {
        locationSpan.textContent = `${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)}`;
        locationSpan.style.color = '#2196F3';
        locationSpan.style.cursor = 'default';
    }
}

function startLocationSelection() {
    if (!window.map) {
        showNotification('Harita henüz yüklenmedi! 📍');
        return;
    }
    
    isSelectingLocation = true;
    
    // Modal'ı geçici olarak gizle
    const storyModal = document.getElementById('story-modal');
    if (storyModal) {
        storyModal.classList.add('hidden');
    }
    
    // Floating bilgi kutusu göster
    showLocationSelectionHelper();
    
    // Harita tıklama event'ini ekle (tek sefer için)
    mapClickHandler = function(e) {
        selectLocation(e.latlng);
        isSelectingLocation = false;
        // Event'i kaldır
        window.map.off('click', mapClickHandler);
        mapClickHandler = null;
    };
    
    window.map.on('click', mapClickHandler);
}

function selectLocation(latlng) {
    // Eski marker'ı temizle
    if (locationSelectionMarker) {
        window.map.removeLayer(locationSelectionMarker);
    }
    
    // Yeni marker ekle
    locationSelectionMarker = L.marker([latlng.lat, latlng.lng], {
        icon: L.divIcon({
            className: 'location-selection-marker',
            html: '<div style="background: #2196F3; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    }).addTo(window.map);
    
    // Konumu kaydet
    currentLocation = latlng;
    updateLocationDisplay(latlng);
    
    // Helper'ı kaldır
    hideLocationSelectionHelper();
    
    // Modal'ı otomatik aç
    const storyModal = document.getElementById('story-modal');
    if (storyModal) {
        storyModal.classList.remove('hidden');
        
        // Koordinatları vurgula
        const locationSpan = document.getElementById('selected-location');
        if (locationSpan) {
            locationSpan.style.animation = 'highlightPulse 0.6s ease-out';
            setTimeout(() => {
                locationSpan.style.animation = 'none';
            }, 600);
        }
    }
    
    showNotification('Konum seçildi! ✅ Artık hikayeni oluşturabilirsin.');
}

// Konum seçme yardımcısı (floating box)
function showLocationSelectionHelper() {
    // Eski helper'ı kaldır
    hideLocationSelectionHelper();
    
    const helper = document.createElement('div');
    helper.id = 'location-selection-helper';
    helper.innerHTML = `
        <div class="helper-content">
            <div class="helper-icon">📍</div>
            <div class="helper-text">
                <strong>Konum Seç</strong>
                <p>Haritada istediğin yere tıkla</p>
            </div>
            <button class="helper-cancel" onclick="cancelLocationSelection()">✕</button>
        </div>
    `;
    
    document.body.appendChild(helper);
    
    // Animasyon için küçük gecikme
    setTimeout(() => {
        helper.classList.add('show');
    }, 10);
}

function hideLocationSelectionHelper() {
    const helper = document.getElementById('location-selection-helper');
    if (helper) {
        helper.classList.remove('show');
        setTimeout(() => helper.remove(), 300);
    }
}

// Event handler'ı global scope'da sakla
let mapClickHandler = null;

function cancelLocationSelection() {
    isSelectingLocation = false;
    
    // Event handler'ı kaldır
    if (mapClickHandler && window.map) {
        window.map.off('click', mapClickHandler);
        mapClickHandler = null;
    }
    
    // Modal'ı tekrar göster
    const storyModal = document.getElementById('story-modal');
    if (storyModal) {
        storyModal.classList.remove('hidden');
    }
    
    // Helper'ı kaldır
    hideLocationSelectionHelper();
    
    showNotification('Konum seçimi iptal edildi');
}

async function handleStorySubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('story-title').value;
    const content = document.getElementById('story-content').value;
    const type = document.getElementById('story-type').value;
    const anonymous = document.getElementById('anonymous').checked;
    
    if (!title || !content) {
        showNotification('Lütfen başlık ve içerik alanlarını doldurun ⚠️');
        return;
    }
    
    if (!currentLocation) {
        showNotification('Lütfen haritada bir konum seçin 📍');
        return;
    }
    
    if (!isLoggedIn()) {
        showNotification('Hikaye eklemek için giriş yapmalısınız! 🔐');
        openAuthModal();
        return;
    }
    
    try {
        // API'ye hikaye ekleme isteği gönder
        const storyPayload = {
            title: title,
            content: content,
            type: type,
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            location_name: `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`,
            is_anonymous: anonymous
        };
        
        const response = await API.post(Endpoints.STORIES, storyPayload);
        
        if (response.success) {
            showNotification('Hikaye başarıyla eklendi! ✅');
            
            // Haritaya marker ekle
            const storyData = {
                ...response.story,
                location: {
                    lat: response.story.latitude,
                    lng: response.story.longitude
                },
                author: response.story.is_anonymous ? 'Anonim' : response.story.author_name,
                timestamp: response.story.created_at || new Date().toISOString(),
                created_at: response.story.created_at || new Date().toISOString()
            };
            
            addMarkerToMap(storyData);
            closeModalFunc();
            removeWaypoint();
        }
    } catch (error) {
        // 401 hatası config.js'de handle ediliyor, sadece mesaj göster
        if (error.message && error.message.includes('Token')) {
            // Token hatası için özel mesaj gösterilmez, config.js'de zaten gösteriliyor
            return;
        }
        console.error('Story submit error:', error);
        showNotification(error.message || 'Hikaye eklenirken hata oluştu! ❌');
    }
}

function addMarkerToMap(storyData) {
    // Eğer bu hikaye zaten marker'ı varsa, yeniden ekleme
    const existingMarker = markers.find(m => 
        m.storyData && m.storyData.id === storyData.id
    );
    
    if (existingMarker) {
        // Marker zaten var, sadece haritada olduğundan emin ol
        const mg = typeof window !== 'undefined' && window.markerLayerGroup ? window.markerLayerGroup : (typeof markerLayerGroup !== 'undefined' ? markerLayerGroup : null);
        if (mg) {
            if (!mg.hasLayer(existingMarker)) {
                mg.addLayer(existingMarker);
            }
        } else if (!map.hasLayer(existingMarker)) {
            existingMarker.addTo(map);
        }
        return;
    }
    
    const marker = L.marker([storyData.location.lat, storyData.location.lng], {
        title: storyData.title,
        icon: getMarkerIcon(storyData.type)
    });
    
    // LayerGroup varsa ona ekle, yoksa direkt haritaya ekle
    const mg = typeof window !== 'undefined' && window.markerLayerGroup ? window.markerLayerGroup : (typeof markerLayerGroup !== 'undefined' ? markerLayerGroup : null);
    if (mg) {
        mg.addLayer(marker);
    } else {
        marker.addTo(map);
    }
    
    const popup = L.popup({
        maxWidth: 300,
        className: 'custom-popup'
    }).setContent(createInfoWindowContent(storyData));
    
    marker.on('popupopen', function() {
        setTimeout(() => {
            const photoImg = document.querySelector('.story-photo');
            if (photoImg) {
                photoImg.addEventListener('click', function() {
                    const photoData = JSON.parse(this.dataset.photo);
                    const storyData = JSON.parse(this.dataset.story);
                    openPhotoModal(photoData, storyData);
                });
            }
            
            // Kullanıcı adına tıklanınca profile git
            const authorElements = document.querySelectorAll('.clickable-author');
            console.log('👤 Tıklanabilir author elementleri:', authorElements.length);
            authorElements.forEach(authorEl => {
                authorEl.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const userId = parseInt(this.dataset.userId);
                    console.log('👤 Author tıklandı, userId:', userId);
                    console.log('👤 ProfilePage var mı?', typeof ProfilePage !== 'undefined');
                    if (userId && typeof ProfilePage !== 'undefined') {
                        console.log('👤 Profil açılıyor:', userId);
                        ProfilePage.open(userId);
                    } else {
                        console.error('❌ Profil açılamadı. userId:', userId, 'ProfilePage:', typeof ProfilePage);
                        if (!userId) {
                            showNotification('Kullanıcı bilgisi bulunamadı! ❌');
                        }
                    }
                });
            });
            
            setupStoryInteractions();
            
            // Custom event tetikle - mesaj butonu için
            const event = new CustomEvent('storyPopupOpened', {
                detail: storyData
            });
            document.dispatchEvent(event);
        }, 100);
    });
    
    marker.bindPopup(popup);
    
    marker.on('contextmenu', function(e) {
        e.originalEvent.preventDefault();
        selectedStory = storyData;
        showStoryActionsModal(storyData);
    });
    
    marker.storyData = storyData;
    
    markers.push(marker);
    loadedStoryIds.add(storyData.id);
}

function getMarkerIcon(type) {
    // Icon HTML'lerini oluştur
    const storyIconHtml = typeof emojiToIcon !== 'undefined' 
        ? emojiToIcon('📖', { size: '1.2em', useDefaultColor: true })
        : '📖';
    const noteIconHtml = typeof emojiToIcon !== 'undefined'
        ? emojiToIcon('📝', { size: '1.2em', useDefaultColor: true })
        : '📝';
    const photoIconHtml = typeof emojiToIcon !== 'undefined'
        ? emojiToIcon('📷', { size: '1.2em', useDefaultColor: true })
        : '📷';
    
    const icons = {
        story: L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-icon story-marker">${storyIconHtml}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        }),
        note: L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-icon note-marker">${noteIconHtml}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        }),
        photo: L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-icon photo-marker">${photoIconHtml}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        })
    };
    
    return icons[type] || icons.story;
}

function createInfoWindowContent(storyData) {
    const author = storyData.author || storyData.author_name || (storyData.anonymous ? 'Anonim' : 'Kullanıcı');
    const isAnonymous = storyData.anonymous || storyData.is_anonymous || false;
    const userId = storyData.user_id;
    
    console.log('📖 Story info:', { 
        author, 
        userId, 
        isAnonymous, 
        storyData_keys: Object.keys(storyData),
        storyData
    });
    
    // Tarih formatını düzelt
    let date = 'Tarih bilinmiyor';
    try {
        const timestamp = storyData.timestamp || storyData.created_at;
        if (timestamp) {
            const dateObj = new Date(timestamp);
            if (!isNaN(dateObj.getTime())) {
                date = dateObj.toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }
    } catch (error) {
        console.error('Tarih parse hatası:', error);
    }
    
    const interactions = loadInteractionData(storyData.timestamp);
    const likes = interactions.likes || 0;
    const comments = interactions.comments || 0;
    const isSaved = interactions.saved || false;
    
    let photoContent = '';
    if (storyData.type === 'photo' && storyData.photo) {
        photoContent = `
            <div class="story-popup-photo">
                <img src="${storyData.photo.dataUrl || '#'}" alt="Fotoğraf" class="story-photo" style="width: 100%; max-width: 200px; border-radius: 4px; margin: 8px 0; cursor: pointer;" data-photo='${JSON.stringify(storyData.photo)}' data-story='${JSON.stringify(storyData)}'>
            </div>
        `;
    }
    
    // Author kısmını tıklanabilir yap (anonim değilse)
    let authorHtml = '';
    if (isAnonymous || !userId) {
        authorHtml = `<span class="story-popup-author">${escapeHtml(author)}</span>`;
    } else {
        authorHtml = `<span class="story-popup-author clickable-author" data-user-id="${userId}" style="cursor: pointer; color: #2196F3; font-weight: 600; transition: all 0.3s;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${escapeHtml(author)}</span>`;
    }
    
    return `
        <div class="story-popup-content">
            <h3 class="story-popup-title">${escapeHtml(storyData.title)}</h3>
            <p class="story-popup-text">${escapeHtml(storyData.content)}</p>
            ${photoContent}
            <div class="story-popup-meta">
                ${authorHtml} • ${date}
            </div>
            <div class="story-interactions">
                <button class="interaction-btn like-btn ${likes > 0 ? 'liked' : ''}" data-story-id="${storyData.id}">
                    <span class="interaction-icon">${typeof emojiToIcon !== 'undefined' ? emojiToIcon('❤️', { size: '1.1em', useDefaultColor: false }) : '❤️'}</span>
                    <span class="interaction-count">${likes}</span>
                </button>
                <button class="interaction-btn comment-btn" data-story-id="${storyData.id}">
                    <span class="interaction-icon">${typeof emojiToIcon !== 'undefined' ? emojiToIcon('💬', { size: '1.1em', useDefaultColor: false }) : '💬'}</span>
                    <span class="interaction-count">${comments}</span>
                </button>
                <button class="interaction-btn share-btn" data-story-id="${storyData.id}">
                    <span class="interaction-icon">${typeof emojiToIcon !== 'undefined' ? emojiToIcon('📤', { size: '1.1em', useDefaultColor: false }) : '📤'}</span>
                </button>
                <button class="interaction-btn save-btn ${isSaved ? 'saved' : ''}" data-story-id="${storyData.id}">
                    <span class="interaction-icon">${typeof emojiToIcon !== 'undefined' ? emojiToIcon('🔖', { size: '1.1em', useDefaultColor: false }) : '🔖'}</span>
                </button>
            </div>
            <div class="story-popup-hint">
                <em>Sağ tıklayarak işlemler menüsünü açabilirsiniz</em>
            </div>
        </div>
    `;
}

function showStoryActionsModal(storyData) {
    const modal = document.getElementById('story-actions-modal');
    const titleEl = document.getElementById('story-preview-title');
    const contentEl = document.getElementById('story-preview-content');
    const authorEl = document.getElementById('story-preview-author');
    const dateEl = document.getElementById('story-preview-date');
    const editBtn = document.getElementById('edit-story');
    const deleteBtn = document.getElementById('delete-story');
    
    titleEl.textContent = storyData.title;
    contentEl.textContent = storyData.content;
    authorEl.textContent = storyData.anonymous ? 'Anonim' : (storyData.author || 'Kullanıcı');
    dateEl.textContent = new Date(storyData.timestamp || storyData.created_at).toLocaleDateString('tr-TR');
    
    // Sadece kendi hikayelerinde düzenle ve sil butonlarını göster
    const currentUser = getCurrentUser();
    const isOwnStory = currentUser && storyData.user_id && storyData.user_id === currentUser.id;
    
    if (editBtn) {
        editBtn.style.display = isOwnStory ? 'flex' : 'none';
    }
    if (deleteBtn) {
        deleteBtn.style.display = isOwnStory ? 'flex' : 'none';
    }
    
    modal.classList.remove('hidden');
}

function closeActionsModalFunc() {
    const modal = document.getElementById('story-actions-modal');
    modal.classList.add('hidden');
    selectedStory = null;
}

function handleDeleteStory() {
    if (!selectedStory) return;
    
    // Sadece kendi hikayesini silebilir
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Bu işlem için giriş yapmalısınız! 🔐');
        return;
    }
    
    // Hikaye sahibi kontrolü
    if (selectedStory.user_id && selectedStory.user_id !== currentUser.id) {
        showNotification('Sadece kendi hikayelerinizi silebilirsiniz! ❌');
        return;
    }
    
    if (confirm('Bu hikayeyi silmek istediğinizden emin misiniz?')) {
        // Backend'den sil
        if (selectedStory.id) {
            API.delete(`/stories/${selectedStory.id}`)
                .then(response => {
                    if (response.success) {
                        showNotification('Hikaye silindi! 🗑️');
                    }
                })
                .catch(error => {
                    console.error('Hikaye silinirken hata:', error);
                });
        }
        
        // Haritadan kaldır
        const markerToRemove = markers.find(marker => 
            marker.storyData && (marker.storyData.id === selectedStory.id || marker.storyData.timestamp === selectedStory.timestamp)
        );
        
        if (markerToRemove) {
            const mg = typeof window !== 'undefined' && window.markerLayerGroup ? window.markerLayerGroup : (typeof markerLayerGroup !== 'undefined' ? markerLayerGroup : null);
            if (mg) {
                mg.removeLayer(markerToRemove);
            } else if (map.hasLayer(markerToRemove)) {
                map.removeLayer(markerToRemove);
            }
            markers = markers.filter(marker => marker !== markerToRemove);
            
            // ID'yi Set'ten de kaldır
            if (markerToRemove.storyData && markerToRemove.storyData.id) {
                loadedStoryIds.delete(markerToRemove.storyData.id);
            }
        }
        
        closeActionsModalFunc();
        console.log('Hikaye silindi:', selectedStory);
    }
}

function handleEditStory() {
    if (!selectedStory) return;
    
    // Sadece kendi hikayesini düzenleyebilir
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Bu işlem için giriş yapmalısınız! 🔐');
        return;
    }
    
    // Hikaye sahibi kontrolü
    if (selectedStory.user_id && selectedStory.user_id !== currentUser.id) {
        showNotification('Sadece kendi hikayelerinizi düzenleyebilirsiniz! ❌');
        return;
    }
    
    handleDeleteStory();
    
    currentLocation = { lat: selectedStory.location.lat, lng: selectedStory.location.lng };
    openModalWithType(selectedStory.type);
    
    document.getElementById('story-title').value = selectedStory.title;
    document.getElementById('story-content').value = selectedStory.content;
    document.getElementById('anonymous').checked = selectedStory.anonymous;
    
    closeActionsModalFunc();
}

function handleShareStory() {
    if (!selectedStory) return;
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?story=${selectedStory.timestamp}`;
    
    if (navigator.share) {
        navigator.share({
            title: selectedStory.title,
            text: selectedStory.content,
            url: shareUrl
        });
    } else {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Hikaye linki panoya kopyalandı!');
        });
    }
    
    closeActionsModalFunc();
}

// Waypoint sistemi
function createWaypoint(latlng) {
    if (waypointMarker) {
        map.removeLayer(waypointMarker);
    }
    
    waypointMarker = L.marker(latlng, {
        icon: L.divIcon({
            className: 'waypoint-marker',
            html: `<div class="waypoint-icon">${typeof emojiToIcon !== 'undefined' ? emojiToIcon('📍', { size: '1.5em' }) : '📍'}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        }),
        draggable: true
    }).addTo(map);
    
    currentLocation = latlng;
    
    waypointMarker.on('dragend', function(event) {
        const newLatLng = event.target.getLatLng();
        currentLocation = newLatLng;
        console.log('Waypoint taşındı:', newLatLng);
    });
    
    waypointMarker.on('click', function(event) {
        createStoryAtWaypoint(latlng);
    });
    
    console.log('Waypoint oluşturuldu:', latlng);
}

function removeWaypoint() {
    if (waypointMarker) {
        map.removeLayer(waypointMarker);
        waypointMarker = null;
        currentLocation = null;
        console.log('Waypoint kaldırıldı');
    }
}

function createStoryAtWaypoint(latlng) {
    if (!isLoggedIn()) {
        showNotification('Paylaşım yapmak için giriş yapın! 🔐');
        openAuthModal();
        return;
    }
    
    showStoryTypeModal(latlng);
}

function showStoryTypeModal(latlng) {
    const modal = document.createElement('div');
    modal.className = 'waypoint-modal';
    modal.innerHTML = `
        <div class="waypoint-modal-content">
            <h3>Hikaye Türü Seçin</h3>
            <div class="waypoint-options">
                <button class="waypoint-btn story-btn" data-type="story">
                    ${typeof emojiToIcon !== 'undefined' ? emojiToIcon('📖', { size: '1.2em' }) : '📖'} Hikaye
                </button>
                <button class="waypoint-btn note-btn" data-type="note">
                    ${typeof emojiToIcon !== 'undefined' ? emojiToIcon('📝', { size: '1.2em' }) : '📝'} Not
                </button>
                <button class="waypoint-btn photo-btn" data-type="photo">
                    ${typeof emojiToIcon !== 'undefined' ? emojiToIcon('📷', { size: '1.2em' }) : '📷'} Fotoğraf
                </button>
            </div>
            <button class="waypoint-close">✕</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelectorAll('.waypoint-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            modal.remove();
            openModalWithType(type);
        });
    });
    
    modal.querySelector('.waypoint-close').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Hikayeleri API'den yükle
async function loadStories(forceReload = false) {
    // Race condition önleme - Eğer zaten yükleniyorsa atla
    if (isLoadingStories) {
        console.log('⏭️ Hikayeler zaten yükleniyor, atlanıyor...');
        return;
    }
    
    isLoadingStories = true;
    
    try {
        const response = await API.get(Endpoints.STORIES);
        
        if (response.success && response.stories) {
            // Force reload ise tüm marker'ları temizle
            if (forceReload) {
                const mg = typeof window !== 'undefined' && window.markerLayerGroup ? window.markerLayerGroup : (typeof markerLayerGroup !== 'undefined' ? markerLayerGroup : null);
                if (mg) {
                    mg.clearLayers();
                } else {
                    markers.forEach(marker => {
                        if (marker && map.hasLayer(marker)) {
                            marker.remove();
                        }
                    });
                }
                markers = [];
                loadedStoryIds.clear();
            }
            
            // Backend'den gelen hikaye ID'lerini topla
            const responseStoryIds = new Set(response.stories.map(s => s.id));
            
            // Artık backend'de olmayan marker'ları kaldır
            if (!forceReload) {
                const mg = typeof window !== 'undefined' && window.markerLayerGroup ? window.markerLayerGroup : (typeof markerLayerGroup !== 'undefined' ? markerLayerGroup : null);
                markers = markers.filter(marker => {
                    if (marker && marker.storyData) {
                        if (!responseStoryIds.has(marker.storyData.id)) {
                            // Bu hikaye artık backend'de yok, marker'ı kaldır
                            if (mg) {
                                mg.removeLayer(marker);
                            } else if (map.hasLayer(marker)) {
                                marker.remove();
                            }
                            loadedStoryIds.delete(marker.storyData.id);
                            return false;
                        }
                    }
                    return true;
                });
            }
            
            // Her hikaye için marker ekle (zaten varsa atla)
            response.stories.forEach(story => {
                // Eğer zaten yüklendiyse ve force reload değilse, atla
                if (!forceReload && loadedStoryIds.has(story.id)) {
                    return;
                }
                
                const storyData = {
                    id: story.id,
                    title: story.title,
                    content: story.content,
                    type: story.type,
                    anonymous: story.is_anonymous,
                    author: story.is_anonymous ? 'Anonim' : story.author_name,
                    user_id: story.user_id,  // Backend'den gelen user_id'yi koru
                    photo: story.photo_url ? { dataUrl: story.photo_url } : null,
                    location: {
                        lat: parseFloat(story.latitude),
                        lng: parseFloat(story.longitude)
                    },
                    timestamp: story.created_at || new Date().toISOString(),
                    created_at: story.created_at || new Date().toISOString(),
                    likes_count: story.likes_count || 0,
                    comments_count: story.comments_count || 0,
                    user_liked: story.user_liked > 0
                };
                
                addMarkerToMap(storyData);
            });
            
            console.log(`${response.stories.length} hikaye yüklendi (backend privacy filtresi uygulandı)`);
            console.log(`📌 Haritada ${markers.length} marker var`);
        }
    } catch (error) {
        console.error('Hikayeler yüklenirken hata:', error);
        // Sessizce başarısız ol, kullanıcıyı rahatsız etme
    } finally {
        // Her durumda flag'i sıfırla
        isLoadingStories = false;
    }
}

