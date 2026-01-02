// ===================================
// FILTERS - Filtreleme Sistemi
// ===================================

function setupFilterSystem() {
    const filterBtn = document.getElementById('filter-btn');
    const filterModal = document.getElementById('filter-modal');
    const filterClose = document.getElementById('filter-close');
    const filterApply = document.getElementById('filter-apply');
    const filterClear = document.getElementById('filter-clear');
    
    filterBtn.addEventListener('click', () => {
        filterModal.classList.remove('hidden');
    });
    
    filterClose.addEventListener('click', closeFilterModal);
    filterModal.addEventListener('click', function(e) {
        if (e.target === filterModal) {
            closeFilterModal();
        }
    });
    
    filterApply.addEventListener('click', applyFilters);
    filterClear.addEventListener('click', clearFilters);
    
    setupRadiusFilter();
}

function closeFilterModal() {
    const filterModal = document.getElementById('filter-modal');
    filterModal.classList.add('hidden');
}

function applyFilters() {
    const filters = {
        types: {
            story: document.getElementById('filter-story').checked,
            note: document.getElementById('filter-note').checked,
            photo: document.getElementById('filter-photo').checked
        },
        dateFrom: document.getElementById('filter-date-from').value,
        dateTo: document.getElementById('filter-date-to').value,
        author: document.getElementById('filter-author').value.toLowerCase(),
        keyword: document.getElementById('filter-keyword').value.toLowerCase()
    };
    
    console.log('Filtreleme uygulanıyor:', filters);
    
    // Önce tüm marker'ları gizle
    if (typeof markers !== 'undefined' && markers.length > 0) {
        markers.forEach(marker => {
            marker.setOpacity(0);
        });
    }
    
    let visibleCount = 0;
    
    // Her marker için kontrol yap
    if (typeof markers !== 'undefined' && markers.length > 0) {
        markers.forEach(marker => {
            if (!marker.storyData) return;
            
            const storyData = marker.storyData;
            let show = true;
            
            // Tip kontrolü
            if (!filters.types[storyData.type]) {
                show = false;
            }
            
            // Tarih kontrolü (timestamp veya created_at)
            const storyDate = storyData.timestamp || storyData.created_at;
            if (storyDate) {
                if (filters.dateFrom) {
                    const fromDate = new Date(filters.dateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    if (new Date(storyDate) < fromDate) {
                        show = false;
                    }
                }
                if (filters.dateTo) {
                    const toDate = new Date(filters.dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (new Date(storyDate) > toDate) {
                        show = false;
                    }
                }
            }
            
            // Yazar kontrolü
            if (filters.author && storyData.author) {
                if (!storyData.author.toLowerCase().includes(filters.author)) {
                    show = false;
                }
            }
            
            // Anahtar kelime kontrolü
            if (filters.keyword) {
                const title = (storyData.title || '').toLowerCase();
                const content = (storyData.content || '').toLowerCase();
                if (!title.includes(filters.keyword) && !content.includes(filters.keyword)) {
                    show = false;
                }
            }
            
            // Yarıçap filtresi kontrolü
            if (radiusFilter.enabled && radiusFilter.center && storyData.location) {
                const markerLatLng = [storyData.location.lat, storyData.location.lng];
                const distance = calculateDistance(radiusFilter.center, markerLatLng);
                if (distance > radiusFilter.radius) {
                    show = false;
                }
            }
            
            // Marker'ı göster/gizle
            if (show) {
                marker.setOpacity(1);
                visibleCount++;
            }
        });
    }
    
    console.log(`✅ Filtreleme tamamlandı: ${visibleCount} hikaye görünüyor`);
    showNotification(`${visibleCount} hikaye gösteriliyor 🔍`);
    closeFilterModal();
}

function clearFilters() {
    // Form alanlarını temizle
    document.getElementById('filter-story').checked = true;
    document.getElementById('filter-note').checked = true;
    document.getElementById('filter-photo').checked = true;
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    document.getElementById('filter-author').value = '';
    document.getElementById('filter-keyword').value = '';
    
    // Tüm marker'ları göster
    if (typeof markers !== 'undefined' && markers.length > 0) {
        markers.forEach(marker => {
            marker.setOpacity(1);
        });
    }
    
    // Yarıçap filtresini temizle
    clearRadiusFilter();
    
    console.log('✅ Filtreler temizlendi, tüm hikayeler gösteriliyor');
    showNotification('Filtreler temizlendi! 🔄');
}

function setupRadiusFilter() {
    const radiusSlider = document.getElementById('radius-slider');
    const radiusValue = document.getElementById('radius-value');
    const radiusButtons = document.querySelectorAll('.radius-btn');
    const centerRadiusBtn = document.getElementById('center-radius-btn');
    
    if (!radiusSlider || !radiusValue || !centerRadiusBtn) {
        console.log('Radius filter elements not found');
        return;
    }
    
    radiusSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        radiusValue.textContent = value;
        radiusFilter.radius = value;
        
        if (radiusFilter.enabled && radiusFilter.circle) {
            updateRadiusCircle();
        }
    });
    
    radiusButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const radius = parseInt(this.dataset.radius);
            radiusSlider.value = radius;
            radiusValue.textContent = radius;
            radiusFilter.radius = radius;
            
            radiusButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            if (radiusFilter.enabled && radiusFilter.circle) {
                updateRadiusCircle();
            }
        });
    });
    
    centerRadiusBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const userLocation = [position.coords.latitude, position.coords.longitude];
                    setRadiusCenter(userLocation);
                    showNotification('Yarıçap merkezi konumunuza ayarlandı! 📍');
                },
                function(error) {
                    showNotification('Konum alınamadı. Harita merkezini kullanın.');
                    const mapCenter = map.getCenter();
                    setRadiusCenter([mapCenter.lat, mapCenter.lng]);
                }
            );
        } else {
            const mapCenter = map.getCenter();
            setRadiusCenter([mapCenter.lat, mapCenter.lng]);
        }
    });
}

function setRadiusCenter(latLng) {
    radiusFilter.center = latLng;
    radiusFilter.enabled = true;
    
    if (radiusFilter.circle) {
        map.removeLayer(radiusFilter.circle);
    }
    
    radiusFilter.circle = L.circle(latLng, {
        radius: radiusFilter.radius,
        className: 'radius-circle'
    }).addTo(map);
    
    setupRadiusCircleInteraction();
    
    map.setView(latLng, 13);
    applyRadiusFilter();
    showRadiusStatus();
}

function updateRadiusCircle() {
    if (radiusFilter.circle && radiusFilter.center) {
        radiusFilter.circle.setRadius(radiusFilter.radius);
        
        // Slider ve değeri güncelle
        const radiusSlider = document.getElementById('radius-slider');
        const radiusValue = document.getElementById('radius-value');
        if (radiusSlider && radiusValue) {
            radiusSlider.value = Math.round(radiusFilter.radius);
            radiusValue.textContent = Math.round(radiusFilter.radius);
        }
    }
}

function applyRadiusFilter() {
    if (!radiusFilter.enabled || !radiusFilter.center) {
        return;
    }
    
    let visibleCount = 0;
    
    if (typeof markers !== 'undefined' && markers.length > 0) {
        markers.forEach(marker => {
            if (marker.storyData && marker.storyData.location) {
                const markerLatLng = [marker.storyData.location.lat, marker.storyData.location.lng];
                const distance = calculateDistance(radiusFilter.center, markerLatLng);
                
                if (distance <= radiusFilter.radius) {
                    marker.setOpacity(1);
                    visibleCount++;
                } else {
                    marker.setOpacity(0);
                }
            }
        });
    }
    
    console.log(`✅ Yarıçap filtresi: ${visibleCount} hikaye görünüyor`);
}

function clearRadiusFilter() {
    // Event listener'ları temizle (memory leak önleme)
    map.off('mousemove.radius');
    map.off('mousedown.radius');
    map.off('mouseup.radius');
    
    // Harita sürüklemeyi tekrar etkinleştir (güvenlik için)
    if (map.dragging && !map.dragging.enabled()) {
        map.dragging.enable();
    }
    
    if (radiusFilter.circle) {
        map.removeLayer(radiusFilter.circle);
        radiusFilter.circle = null;
    }
    
    // Cursor'ı sıfırla
    const mapContainer = map.getContainer();
    if (mapContainer) {
        mapContainer.style.cursor = '';
    }
    
    radiusFilter.enabled = false;
    radiusFilter.center = null;
    hideRadiusStatus();
    
    console.log('✅ Yarıçap filtresi temizlendi');
}

function showRadiusStatus() {
    const status = document.getElementById('radius-status');
    const closeBtn = document.getElementById('radius-status-close');
    
    if (status) {
        status.style.display = 'block';
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                clearRadiusFilter();
                // Tüm marker'ları göster
                if (typeof markers !== 'undefined' && markers.length > 0) {
                    markers.forEach(marker => {
                        marker.setOpacity(1);
                    });
                }
            });
        }
    }
}

function hideRadiusStatus() {
    const status = document.getElementById('radius-status');
    if (status) {
        status.style.display = 'none';
    }
}

function calculateDistance(latLng1, latLng2) {
    const R = 6371000;
    const lat1 = latLng1[0] * Math.PI / 180;
    const lat2 = latLng2[0] * Math.PI / 180;
    const deltaLat = (latLng2[0] - latLng1[0]) * Math.PI / 180;
    const deltaLng = (latLng2[1] - latLng1[1]) * Math.PI / 180;
    
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

function setupRadiusCircleInteraction() {
    if (!radiusFilter.circle || !radiusFilter.center) return;
    
    const circle = radiusFilter.circle;
    const center = radiusFilter.center;
    
    let isDragging = false;
    let dragStartDistance = 0;
    let dragStartRadius = 0;
    let isNearEdge = false;
    
    // Önceki event listener'ları temizle
    map.off('mousemove.radius');
    map.off('mousedown.radius');
    map.off('mouseup.radius');
    map.off('mouseout.radius');
    
    // Harita üzerinde mouse hareketini izle (daha hassas kontrol için)
    map.on('mousemove.radius', function(e) {
        if (!radiusFilter.circle || !radiusFilter.center) return;
        
        const mousePoint = e.latlng;
        const distance = calculateDistance([center[0], center[1]], [mousePoint.lat, mousePoint.lng]);
        const currentRadius = radiusFilter.radius;
        
        // Tolerance'ı zoom seviyesine göre ayarla (daha geniş algılama alanı)
        const zoom = map.getZoom();
        const tolerance = Math.max(150, currentRadius * 0.15); // Yarıçapın %15'i veya min 150m
        
        const distanceFromEdge = Math.abs(distance - currentRadius);
        const wasNearEdge = isNearEdge;
        isNearEdge = distanceFromEdge <= tolerance && !isDragging;
        
        // Sürükleme modunda
        if (isDragging && radiusFilter.circle) {
            // Harita sürüklemeyi engelle (touchpad için)
            if (map.dragging && map.dragging.enabled()) {
                map.dragging.disable();
            }
            
            const newRadius = Math.max(100, Math.min(10000, distance));
            radiusFilter.radius = newRadius;
            
            circle.setRadius(newRadius);
            
            const radiusSlider = document.getElementById('radius-slider');
            const radiusValue = document.getElementById('radius-value');
            
            if (radiusSlider && radiusValue) {
                radiusSlider.value = Math.round(newRadius);
                radiusValue.textContent = Math.round(newRadius);
            }
            
            applyRadiusFilter();
            
            // Çemberi vurgula
            if (circle.getElement()) {
                circle.getElement().classList.add('dragging');
            }
        } 
        // Sürükleme modunda değilse - cursor'ı değiştir
        else if (isNearEdge) {
            if (!wasNearEdge) {
                // Kenara yaklaşıldı
                const mapContainer = map.getContainer();
                mapContainer.style.cursor = 'ns-resize';
                if (circle.getElement()) {
                    circle.getElement().classList.add('radius-edge-hover');
                }
            }
        } else {
            if (wasNearEdge) {
                // Kenardan uzaklaşıldı
                const mapContainer = map.getContainer();
                mapContainer.style.cursor = '';
                if (circle.getElement()) {
                    circle.getElement().classList.remove('radius-edge-hover');
                }
            }
        }
    });
    
    // Mouse down - sürüklemeye başla
    map.on('mousedown.radius', function(e) {
        if (!radiusFilter.circle || !radiusFilter.center) return;
        
        const clickPoint = e.latlng;
        const distance = calculateDistance([center[0], center[1]], [clickPoint.lat, clickPoint.lng]);
        const currentRadius = radiusFilter.radius;
        
        // Tolerance'ı zoom seviyesine göre ayarla
        const tolerance = Math.max(150, currentRadius * 0.15);
        
        if (Math.abs(distance - currentRadius) <= tolerance) {
            isDragging = true;
            dragStartDistance = distance;
            dragStartRadius = currentRadius;
            
            // Harita sürüklemeyi devre dışı bırak (touchpad/Mac için kritik!)
            map.dragging.disable();
            
            const mapContainer = map.getContainer();
            mapContainer.style.cursor = 'ns-resize';
            
            if (circle.getElement()) {
                circle.getElement().classList.add('dragging');
                circle.getElement().classList.remove('radius-edge-hover');
            }
            
            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();
            e.originalEvent.stopImmediatePropagation();
            
            // Touch event'lerini de engelle (touchpad için)
            if (e.originalEvent.touches) {
                e.originalEvent.touches.preventDefault();
            }
        }
    });
    
    // Mouse up - sürüklemeyi bitir
    map.on('mouseup.radius', function(e) {
        if (isDragging) {
            isDragging = false;
            isNearEdge = false;
            
            // Harita sürüklemeyi tekrar etkinleştir
            map.dragging.enable();
            
            const mapContainer = map.getContainer();
            mapContainer.style.cursor = '';
            
            if (circle.getElement()) {
                circle.getElement().classList.remove('dragging');
            }
            
            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();
            
            showNotification(`Yarıçap ${Math.round(radiusFilter.radius)}m olarak ayarlandı! 📏`);
        }
    });
    
    // Global mouseup (harita dışına çıkınca da yakala)
    document.addEventListener('mouseup', function(e) {
        if (isDragging) {
            isDragging = false;
            isNearEdge = false;
            
            // Harita sürüklemeyi tekrar etkinleştir
            if (map.dragging && !map.dragging.enabled()) {
                map.dragging.enable();
            }
            
            const mapContainer = map.getContainer();
            if (mapContainer) {
                mapContainer.style.cursor = '';
            }
            
            if (circle && circle.getElement()) {
                circle.getElement().classList.remove('dragging');
            }
        }
    });
    
    // Mouse haritadan çıkınca
    map.getContainer().addEventListener('mouseleave', function() {
        if (!isDragging) {
            isNearEdge = false;
            const mapContainer = map.getContainer();
            mapContainer.style.cursor = '';
            if (circle.getElement()) {
                circle.getElement().classList.remove('radius-edge-hover');
            }
        }
    });
    
    // ESC tuşu ile iptal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isDragging) {
            isDragging = false;
            isNearEdge = false;
            radiusFilter.radius = dragStartRadius;
            
            // Harita sürüklemeyi tekrar etkinleştir
            if (map.dragging && !map.dragging.enabled()) {
                map.dragging.enable();
            }
            
            if (circle) {
                circle.setRadius(dragStartRadius);
                const mapContainer = map.getContainer();
                if (mapContainer) {
                    mapContainer.style.cursor = '';
                }
                if (circle.getElement()) {
                    circle.getElement().classList.remove('dragging');
                }
            }
            
            const radiusSlider = document.getElementById('radius-slider');
            const radiusValue = document.getElementById('radius-value');
            if (radiusSlider && radiusValue) {
                radiusSlider.value = dragStartRadius;
                radiusValue.textContent = dragStartRadius;
            }
            
            applyRadiusFilter();
            showNotification('Yarıçap ayarı iptal edildi! ❌');
        }
    });
}
