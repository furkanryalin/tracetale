// ===================================
// MAP FEATURES - Harita Özellikleri
// ===================================

function setupMapStylePanel() {
    const styleOptions = document.querySelectorAll('.style-option');
    styleOptions.forEach(option => {
        option.addEventListener('click', function() {
            styleOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            const selectedStyle = this.dataset.style;
            setMapStyle(selectedStyle);
        });
    });
    
    const trafficToggle = document.getElementById('traffic-toggle');
    const transitToggle = document.getElementById('transit-toggle');
    const bikeToggle = document.getElementById('bike-toggle');
    const labelsToggle = document.getElementById('labels-toggle');
    
    trafficToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        console.log('Trafik:', this.classList.contains('active'));
    });
    
    transitToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        console.log('Toplu Taşıma:', this.classList.contains('active'));
    });
    
    bikeToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        console.log('Bisiklet:', this.classList.contains('active'));
    });
    
    labelsToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        toggleLabels(this.classList.contains('active'));
        console.log('Etiketler:', this.classList.contains('active'));
    });
    
    const myLocationBtn = document.getElementById('my-location-btn');
    myLocationBtn.addEventListener('click', function() {
        goToMyLocation();
    });
}

function setMapStyle(style) {
    if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
    }
    
    if (labelLayer) {
        map.removeLayer(labelLayer);
        labelLayer = null;
    }
    
    let tileLayer;
    
    switch(style) {
        case 'dark':
            tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            });
            break;
        case 'light':
            tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            });
            break;
        case 'satellite':
            tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
                maxZoom: 18,
                minZoom: 1,
                errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                tileerror: function() {
                    console.log('Uydu görüntüsü yüklenemedi, zoom seviyesi çok yüksek olabilir');
                }
            });
            
            // Yol ve yer isimleri için birleştirilmiş katman
            labelLayer = L.layerGroup([
                // Yol isimleri
                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
                    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
                    maxZoom: 18,
                    minZoom: 1,
                    opacity: 0.8,
                    errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
                }),
                // İl, ilçe ve şehir isimleri
                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
                    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
                    maxZoom: 18,
                    minZoom: 1,
                    opacity: 0.9,
                    errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                    tileerror: function() {
                        console.log('Yer isimleri katmanı yüklenemedi');
                    }
                })
            ]);
            break;
        case 'terrain':
            tileLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>',
                maxZoom: 17
            });
            break;
        default:
            tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            });
    }
    
    tileLayer.addTo(map);
    currentTileLayer = tileLayer;
    currentMapStyle = style;
    
    if (style === 'satellite' && labelLayer) {
        labelLayer.addTo(map);
    }
    
    if (style === 'satellite') {
        map.setMaxZoom(18);
    } else {
        map.setMaxZoom(19);
    }
}

function toggleLabels(show) {
    if (currentMapStyle === 'satellite') {
        if (show && labelLayer) {
            labelLayer.addTo(map);
        } else if (!show && labelLayer) {
            map.removeLayer(labelLayer);
        }
    }
}

function goToMyLocation() {
    const locationBtn = document.getElementById('my-location-btn');
    
    locationBtn.classList.add('loading');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLocation = [position.coords.latitude, position.coords.longitude];
                
                map.setView(userLocation, 15);
                
                addUserLocationMarker(userLocation);
                
                locationBtn.classList.remove('loading');
                
                console.log('Konum alındı:', userLocation);
                showNotification('Konumunuz bulundu! 📍');
            },
            function(error) {
                locationBtn.classList.remove('loading');
                
                let errorMessage = 'Konum alınamadı. ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Konum erişimi reddedildi. Lütfen tarayıcı ayarlarından konum iznini verin.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Konum bilgisi mevcut değil. GPS\'in açık olduğundan emin olun.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Konum isteği zaman aşımına uğradı. Tekrar deneyin.';
                        break;
                    default:
                        errorMessage += 'Bilinmeyen hata. Tekrar deneyin.';
                        break;
                }
                
                showNotification(errorMessage);
                console.error('Konum hatası:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 300000
            }
        );
    } else {
        locationBtn.classList.remove('loading');
        alert('Bu tarayıcı konum özelliğini desteklemiyor.');
    }
}

function addUserLocationMarker(location) {
    if (window.userLocationMarker) {
        map.removeLayer(window.userLocationMarker);
    }
    
    const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div class="user-marker-icon">📍</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
    
    window.userLocationMarker = L.marker(location, {
        icon: userIcon,
        title: 'Sizin konumunuz'
    }).addTo(map);
    
    window.userLocationMarker.bindPopup('Sizin konumunuz').openPopup();
}

