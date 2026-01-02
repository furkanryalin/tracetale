// ===================================
// CORE - Temel Sistem ve Değişkenler
// ===================================

// Global değişkenler
let map;
let markers = [];
let markerLayerGroup = null; // Marker'ları tutan layer group
let currentLocation = null;
let selectedStory = null;
let contextMenuVisible = false;
let currentMapStyle = 'dark';
let currentTileLayer = null;
let labelLayer = null;
let radiusFilter = {
    enabled: false,
    center: null,
    radius: 1000,
    circle: null
};

let waypointMarker = null;
let waypointDraggable = false;
let worldBoundsRectangle = null; // Dünya sınırlarını gösteren çizgi
let boundsWarningActive = false; // Uyarı aktif mi?

// Giriş ekranı ve site başlatma
document.addEventListener('DOMContentLoaded', function() {
    const introScreen = document.getElementById('intro-screen');
    const mainSite = document.getElementById('main-site');
    
    setTimeout(() => {
        console.log('Giriş animasyonu başlatılıyor...');
        
        introScreen.classList.add('fade-out');
        
        setTimeout(() => {
            console.log('Ana site gösteriliyor...');
            introScreen.style.display = 'none';
            mainSite.classList.remove('hidden');
            
            const modals = document.querySelectorAll('.modal, .photo-modal, .filter-modal, .profile-modal');
            modals.forEach(modal => {
                modal.classList.add('hidden');
            });
            
            console.log('Harita başlatılıyor...');
            initMap();
            
            // Hikayeleri yükle
            if (typeof loadStories === 'function') {
                setTimeout(() => {
                    loadStories();
                }, 1000);
            }
            
            console.log('Site hazır!');
        }, 1500);
        
    }, 3000);
});

// Harita başlatma
function initMap() {
    console.log('Harita başlatılıyor...');
    
    if (typeof L === 'undefined') {
        console.error('Leaflet.js yüklenmemiş!');
        return;
    }
    
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container bulunamadı!');
        return;
    }
    
    console.log('Map container bulundu:', mapContainer);
    
    const defaultLocation = [41.0082, 28.9784];
    
    try {
        map = L.map('map', {
            maxZoom: 18,
            minZoom: 1,
            // Dünyanın sınırlarını belirle (sonsuz kaydırmayı önle)
            maxBounds: [
                [-90, -180], // Güney, Batı
                [90, 180]    // Kuzey, Doğu
            ],
            maxBoundsViscosity: 1.0 // Sınırlara ulaşıldığında kaydırmayı durdur
        }).setView(defaultLocation, 13);
        
        // Marker layer group oluştur (marker'ları daha iyi yönetmek için)
        markerLayerGroup = L.layerGroup().addTo(map);
        
        // Dünya sınırlarını gösteren çizgi ekle (kırmızı)
        worldBoundsRectangle = L.rectangle(
            [[-90, -180], [90, 180]], // Dünya sınırları
            {
                color: '#f44336', // Kırmızı
                fill: false,
                weight: 4,
                opacity: 1.0,
                dashArray: '15, 10', // Kesikli çizgi
                interactive: false, // Tıklanamaz
                pane: 'overlayPane',
                className: 'world-bounds-rectangle'
            }
        ).addTo(map);
        
        // Sınır kontrolü için event listener'lar ekle
        setupBoundsWarning();
        
        // Global scope'a ekle (konum seçimi için)
        window.map = map;
        window.markerLayerGroup = markerLayerGroup;
        
        console.log('Harita oluşturuldu:', map);
    } catch (error) {
        console.error('Harita oluşturulamadı:', error);
        return;
    }
    
    setMapStyle('dark');
    
    setTimeout(() => {
        map.invalidateSize();
        console.log('Harita boyutu ayarlandı');
    }, 100);
    
    window.addEventListener('resize', () => {
        if (map) {
            map.invalidateSize();
        }
    });
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                currentLocation = [position.coords.latitude, position.coords.longitude];
                map.setView(currentLocation, 15);
                console.log('Sayfa yüklendiğinde konum alındı:', currentLocation);
            },
            function(error) {
                console.log('Sayfa yüklendiğinde konum alınamadı, varsayılan konum kullanılıyor');
                console.error('Konum hatası:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 300000
            }
        );
    }
    
    map.on('click', function(event) {
        hideContextMenu();
        
        if (waypointMarker && event.originalEvent.target === waypointMarker.getElement()) {
            createStoryAtWaypoint(event.latlng);
            return;
        }
        
        if (waypointMarker) {
            waypointMarker.setLatLng(event.latlng);
            currentLocation = event.latlng;
        } else {
            createWaypoint(event.latlng);
        }
    });
    
    map.on('dblclick', function(event) {
        if (event.originalEvent.ctrlKey || event.originalEvent.metaKey) {
            setRadiusCenter([event.latlng.lat, event.latlng.lng]);
            showNotification('Yarıçap merkezi ayarlandı! 📍');
        }
    });
    
    map.on('contextmenu', function(event) {
        event.originalEvent.preventDefault();
    });
    
    map.on('zoomend', function() {
        const currentZoom = map.getZoom();
        if (currentMapStyle === 'satellite' && currentZoom > 18) {
            map.setZoom(18);
        }
    });
    
    setupEventListeners();
    
    console.log('Sistemler başlatılıyor...');
    
    // Page Visibility Manager'ı başlat (Memory Leak önleme)
    if (typeof PageVisibilityManager !== 'undefined') {
        PageVisibilityManager.init();
    }
    
    setupFilterSystem();
    setupAuthSystem();
    setupProfileSystem();
    setupMessagingAPI();
    setupSearchSystem();
    initUserMessaging();
    console.log('Site hazır!');
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    
    if (mobileMenu && mobileMenuToggle) {
        mobileMenu.classList.toggle('active');
        const icon = mobileMenuToggle.querySelector('i');
        if (icon) {
            if (mobileMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    }
}

// Sınır uyarısı sistemi
function setupBoundsWarning() {
    if (!map) return;
    
    const maxBounds = L.latLngBounds([-90, -180], [90, 180]);
    let isNearBounds = false;
    
    map.on('move', function() {
        const bounds = map.getBounds();
        const padding = 0.1; // Padding (haritanın %10'u)
        
        // Sınırlara yakın mı kontrol et
        const nearTop = bounds.getNorth() > (90 - padding * 180);
        const nearBottom = bounds.getSouth() < (-90 + padding * 180);
        const nearLeft = bounds.getWest() < (-180 + padding * 360);
        const nearRight = bounds.getEast() > (180 - padding * 360);
        
        const wasNearBounds = isNearBounds;
        isNearBounds = nearTop || nearBottom || nearLeft || nearRight;
        
        if (isNearBounds && !wasNearBounds) {
            // Sınırlara yaklaşıldı
            startBoundsWarning();
        } else if (!isNearBounds && wasNearBounds) {
            // Sınırlardan uzaklaşıldı
            stopBoundsWarning();
        }
    });
}

// Sınır uyarısını başlat (yanıp sönen çizgi + bildirim)
function startBoundsWarning() {
    if (boundsWarningActive || !worldBoundsRectangle) return;
    
    boundsWarningActive = true;
    const rectangleElement = worldBoundsRectangle.getElement();
    if (rectangleElement) {
        rectangleElement.classList.add('bounds-warning-active');
    }
    
    // Bildirim göster (sadece bir kez)
    if (typeof showNotification !== 'undefined') {
        showNotification('Harita sınırlarına ulaşıldı! Haritayı daha fazla kaydıramazsınız. ⚠️');
    }
}

// Sınır uyarısını durdur
function stopBoundsWarning() {
    if (!boundsWarningActive) return;
    
    boundsWarningActive = false;
    const rectangleElement = worldBoundsRectangle.getElement();
    if (rectangleElement) {
        rectangleElement.classList.remove('bounds-warning-active');
    }
}

// Temel event listener'lar
function setupEventListeners() {
    const addStoryBtn = document.getElementById('add-story-btn');
    const addStoryFab = document.getElementById('add-story-fab');
    const closeModal = document.getElementById('close-modal');
    const storyModal = document.getElementById('story-modal');
    
    if (addStoryBtn) addStoryBtn.addEventListener('click', () => openModal());
    if (addStoryFab) addStoryFab.addEventListener('click', () => openModal());
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Mobile menu buttons
    const mobileAddStoryBtn = document.getElementById('mobile-add-story-btn');
    if (mobileAddStoryBtn) {
        mobileAddStoryBtn.addEventListener('click', () => {
            openModal();
            toggleMobileMenu();
        });
    }
    
    const mobileFilterBtn = document.getElementById('mobile-filter-btn');
    const filterBtn = document.getElementById('filter-btn');
    if (mobileFilterBtn && filterBtn) {
        mobileFilterBtn.addEventListener('click', () => {
            filterBtn.click();
            toggleMobileMenu();
        });
    }
    
    const mobileAuthBtn = document.getElementById('mobile-auth-btn');
    const authBtn = document.getElementById('auth-btn');
    if (mobileAuthBtn && authBtn) {
        mobileAuthBtn.addEventListener('click', () => {
            authBtn.click();
            toggleMobileMenu();
        });
    }
    
    const mobileNotificationsBtn = document.getElementById('mobile-notifications-btn');
    const notificationsBtn = document.getElementById('notifications-header-btn');
    if (mobileNotificationsBtn && notificationsBtn) {
        mobileNotificationsBtn.addEventListener('click', () => {
            notificationsBtn.click();
            toggleMobileMenu();
        });
    }
    
    const mobileDmBtn = document.getElementById('mobile-dm-btn');
    const dmBtn = document.getElementById('dm-header-btn');
    if (mobileDmBtn && dmBtn) {
        mobileDmBtn.addEventListener('click', () => {
            dmBtn.click();
            toggleMobileMenu();
        });
    }
    
    if (closeModal) closeModal.addEventListener('click', () => closeModalFunc());
    
    storyModal.addEventListener('click', function(e) {
        if (e.target === storyModal) {
            closeModalFunc();
        }
    });
    
    const storyForm = document.getElementById('story-form');
    storyForm.addEventListener('submit', handleStorySubmit);
    
    setupPhotoUpload();
    
    const storyTypeSelect = document.getElementById('story-type');
    if (storyTypeSelect) {
        storyTypeSelect.addEventListener('change', function() {
            const photoUploadGroup = document.getElementById('photo-upload-group');
            if (photoUploadGroup) {
                if (this.value === 'photo') {
                    photoUploadGroup.style.display = 'block';
                } else {
                    photoUploadGroup.style.display = 'none';
                    clearPhotoPreview();
                }
            }
        });
    }
    
    setupPhotoModal();
    
    const contextMenu = document.getElementById('context-menu');
    const addStoryContext = document.getElementById('add-story-context');
    const addNoteContext = document.getElementById('add-note-context');
    const addPhotoContext = document.getElementById('add-photo-context');
    
    addStoryContext.addEventListener('click', () => {
        hideContextMenu();
        openModalWithType('story');
    });
    addNoteContext.addEventListener('click', () => {
        hideContextMenu();
        openModalWithType('note');
    });
    addPhotoContext.addEventListener('click', () => {
        hideContextMenu();
        openModalWithType('photo');
    });
    
    const storyActionsModal = document.getElementById('story-actions-modal');
    const closeActionsModal = document.getElementById('close-actions-modal');
    const deleteStoryBtn = document.getElementById('delete-story');
    const editStoryBtn = document.getElementById('edit-story');
    const shareStoryBtn = document.getElementById('share-story');
    
    closeActionsModal.addEventListener('click', () => closeActionsModalFunc());
    deleteStoryBtn.addEventListener('click', () => handleDeleteStory());
    editStoryBtn.addEventListener('click', () => handleEditStory());
    shareStoryBtn.addEventListener('click', () => handleShareStory());
    
    storyActionsModal.addEventListener('click', function(e) {
        if (e.target === storyActionsModal) {
            closeActionsModalFunc();
        }
    });
    
    setupMapStylePanel();
    
    document.addEventListener('click', function(e) {
        if (!contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });
}

// Bildirim gösterme
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #2196F3, #1976D2);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        z-index: 3000;
        font-size: 0.9rem;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    // Emoji'leri icon'lara dönüştür (renkli iconlar kullan)
    if (typeof replaceEmojisInText !== 'undefined') {
        notification.innerHTML = replaceEmojisInText(message, { 
            size: '1.1em',
            useDefaultColor: true // Renkli iconlar göster
        });
    } else {
        notification.textContent = message;
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

