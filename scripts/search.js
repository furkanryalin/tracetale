// ===================================
// SEARCH - Arama Sistemi
// ===================================

function setupSearchSystem() {
    console.log('Arama sistemi başlatılıyor...');
    
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const clearBtn = document.getElementById('clear-search');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchBtn || !clearBtn || !searchResults) {
        console.error('Arama elementleri bulunamadı!');
        return;
    }
    
    console.log('Arama elementleri bulundu');
    
    searchBtn.addEventListener('click', () => {
        performSearch();
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    clearBtn.addEventListener('click', () => {
        clearSearch();
    });
    
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        if (query) {
            clearBtn.style.display = 'block';
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (query.length >= 2) {
                    performSearch();
                }
            }, 500);
        } else {
            clearBtn.style.display = 'none';
            hideSearchResults();
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            hideSearchResults();
        }
    });
}

function performSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const query = searchInput.value.trim();
    
    if (!query) {
        showNotification('Lütfen arama terimi girin! 🔍');
        return;
    }
    
    console.log('Arama yapılıyor:', query);
    
    showSearchLoading();
    
    const localResults = searchLocations(query);
    
    if (localResults.length > 0) {
        displaySearchResults(localResults);
    } else {
        searchWithNominatim(query);
    }
}

async function searchWithNominatim(query) {
    const searchStatus = document.getElementById('search-status');
    
    try {
        console.log('Nominatim API ile arama yapılıyor...');
        
        searchStatus.style.display = 'flex';
        searchStatus.innerHTML = '<span class="status-icon">🌐</span> API\'den aranıyor...';
        
        const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&countrycodes=tr&addressdetails=1`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'TraceMark/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error('API isteği başarısız');
        }
        
        const data = await response.json();
        console.log('API yanıtı:', data);
        
        searchStatus.style.display = 'none';
        
        if (data.length === 0) {
            showNoResults();
            return;
        }
        
        const formattedResults = data.map(item => ({
            title: item.display_name.split(',')[0] || item.name || 'Bilinmeyen',
            subtitle: item.display_name.split(',').slice(1, 3).join(',').trim() || 'Türkiye',
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            type: getLocationTypeFromNominatim(item.type, item.class),
            keywords: [query.toLowerCase()]
        }));
        
        displaySearchResults(formattedResults);
        
    } catch (error) {
        console.error('API arama hatası:', error);
        
        searchStatus.style.display = 'none';
        
        showNotification('Arama sırasında hata oluştu! 🔄');
        showNoResults();
    }
}

function getLocationTypeFromNominatim(type, classType) {
    const typeMap = {
        'administrative': 'city',
        'place': 'city',
        'city': 'city',
        'town': 'town',
        'village': 'town',
        'hamlet': 'town',
        'suburb': 'district',
        'neighbourhood': 'district',
        'tourism': 'landmark',
        'historic': 'landmark',
        'amenity': 'landmark'
    };
    
    return typeMap[classType] || typeMap[type] || 'city';
}

function showNoResults() {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = `
        <div class="search-no-results">
            <span>😔 Sonuç bulunamadı</span>
            <div style="margin-top: 8px; font-size: 0.8rem; color: #666;">
                Farklı bir arama terimi deneyin
            </div>
        </div>
    `;
    searchResults.classList.remove('hidden');
}

function searchLocations(query) {
    const locations = [
        { title: 'İstanbul', subtitle: 'Türkiye', lat: 41.0082, lng: 28.9784, type: 'city', keywords: ['istanbul', 'ist', 'constantinople', 'marmara'] },
        { title: 'Ankara', subtitle: 'Türkiye', lat: 39.9334, lng: 32.8597, type: 'city', keywords: ['ankara', 'capital', 'başkent', 'iç anadolu'] },
        { title: 'Bursa', subtitle: 'Türkiye', lat: 40.1826, lng: 29.0665, type: 'city', keywords: ['bursa', 'green', 'yeşil', 'marmara'] },
        { title: 'Kocaeli', subtitle: 'Türkiye', lat: 40.8533, lng: 29.8815, type: 'city', keywords: ['kocaeli', 'izmit', 'marmara'] },
        { title: 'Sakarya', subtitle: 'Türkiye', lat: 40.7889, lng: 30.4053, type: 'city', keywords: ['sakarya', 'adapazarı', 'marmara'] },
        { title: 'Tekirdağ', subtitle: 'Türkiye', lat: 40.9833, lng: 27.5167, type: 'city', keywords: ['tekirdağ', 'marmara'] },
        { title: 'Edirne', subtitle: 'Türkiye', lat: 41.6771, lng: 26.5557, type: 'city', keywords: ['edirne', 'marmara', 'trakya'] },
        { title: 'Kırklareli', subtitle: 'Türkiye', lat: 41.7333, lng: 27.2167, type: 'city', keywords: ['kırklareli', 'marmara', 'trakya'] },
        { title: 'Balıkesir', subtitle: 'Türkiye', lat: 39.6484, lng: 27.8826, type: 'city', keywords: ['balıkesir', 'marmara', 'ege'] },
        { title: 'Çanakkale', subtitle: 'Türkiye', lat: 40.1553, lng: 26.4142, type: 'city', keywords: ['çanakkale', 'marmara', 'troy'] },
        { title: 'Yalova', subtitle: 'Türkiye', lat: 40.6565, lng: 29.2846, type: 'city', keywords: ['yalova', 'marmara'] },
        { title: 'Bilecik', subtitle: 'Türkiye', lat: 40.1500, lng: 29.9833, type: 'city', keywords: ['bilecik', 'marmara'] },
        
        { title: 'İzmir', subtitle: 'Türkiye', lat: 38.4192, lng: 27.1287, type: 'city', keywords: ['izmir', 'smyrna', 'ege'] },
        { title: 'Manisa', subtitle: 'Türkiye', lat: 38.6191, lng: 27.4289, type: 'city', keywords: ['manisa', 'ege'] },
        { title: 'Aydın', subtitle: 'Türkiye', lat: 37.8560, lng: 27.8416, type: 'city', keywords: ['aydın', 'ege', 'kuşadası'] },
        { title: 'Denizli', subtitle: 'Türkiye', lat: 37.7765, lng: 29.0864, type: 'city', keywords: ['denizli', 'ege', 'pamukkale'] },
        { title: 'Muğla', subtitle: 'Türkiye', lat: 37.2153, lng: 28.3636, type: 'city', keywords: ['muğla', 'ege', 'bodrum', 'marmaris'] },
        { title: 'Uşak', subtitle: 'Türkiye', lat: 38.4192, lng: 29.4089, type: 'city', keywords: ['uşak', 'ege'] },
        { title: 'Afyonkarahisar', subtitle: 'Türkiye', lat: 38.7507, lng: 30.5567, type: 'city', keywords: ['afyonkarahisar', 'afyon', 'ege'] },
        { title: 'Kütahya', subtitle: 'Türkiye', lat: 39.4167, lng: 29.9833, type: 'city', keywords: ['kütahya', 'ege'] },
        
        { title: 'Antalya', subtitle: 'Türkiye', lat: 36.8969, lng: 30.7133, type: 'city', keywords: ['antalya', 'mediterranean', 'akdeniz'] },
        { title: 'Adana', subtitle: 'Türkiye', lat: 37.0000, lng: 35.3213, type: 'city', keywords: ['adana', 'çukurova', 'akdeniz'] },
        { title: 'Mersin', subtitle: 'Türkiye', lat: 36.8000, lng: 34.6333, type: 'city', keywords: ['mersin', 'akdeniz'] },
        { title: 'Hatay', subtitle: 'Türkiye', lat: 36.4018, lng: 36.3498, type: 'city', keywords: ['hatay', 'antakya', 'akdeniz'] },
        { title: 'Kahramanmaraş', subtitle: 'Türkiye', lat: 37.5858, lng: 36.9371, type: 'city', keywords: ['kahramanmaraş', 'maraş', 'akdeniz'] },
        { title: 'Osmaniye', subtitle: 'Türkiye', lat: 37.0742, lng: 36.2478, type: 'city', keywords: ['osmaniye', 'akdeniz'] },
        { title: 'Isparta', subtitle: 'Türkiye', lat: 37.7648, lng: 30.5566, type: 'city', keywords: ['isparta', 'akdeniz'] },
        { title: 'Burdur', subtitle: 'Türkiye', lat: 37.7206, lng: 30.2906, type: 'city', keywords: ['burdur', 'akdeniz'] },
        
        { title: 'Konya', subtitle: 'Türkiye', lat: 37.8746, lng: 32.4932, type: 'city', keywords: ['konya', 'mevlana', 'iç anadolu'] },
        { title: 'Kayseri', subtitle: 'Türkiye', lat: 38.7312, lng: 35.4787, type: 'city', keywords: ['kayseri', 'iç anadolu'] },
        { title: 'Sivas', subtitle: 'Türkiye', lat: 39.7477, lng: 37.0179, type: 'city', keywords: ['sivas', 'iç anadolu'] },
        { title: 'Yozgat', subtitle: 'Türkiye', lat: 39.8181, lng: 34.8147, type: 'city', keywords: ['yozgat', 'iç anadolu'] },
        { title: 'Kırıkkale', subtitle: 'Türkiye', lat: 39.8468, lng: 33.4988, type: 'city', keywords: ['kırıkkale', 'iç anadolu'] },
        { title: 'Aksaray', subtitle: 'Türkiye', lat: 38.3687, lng: 34.0370, type: 'city', keywords: ['aksaray', 'iç anadolu'] },
        { title: 'Nevşehir', subtitle: 'Türkiye', lat: 38.6939, lng: 34.6857, type: 'city', keywords: ['nevşehir', 'kapadokya', 'iç anadolu'] },
        { title: 'Kırşehir', subtitle: 'Türkiye', lat: 39.1425, lng: 34.1709, type: 'city', keywords: ['kırşehir', 'iç anadolu'] },
        { title: 'Çankırı', subtitle: 'Türkiye', lat: 40.6013, lng: 33.6134, type: 'city', keywords: ['çankırı', 'iç anadolu'] },
        { title: 'Karaman', subtitle: 'Türkiye', lat: 37.1759, lng: 33.2287, type: 'city', keywords: ['karaman', 'iç anadolu'] },
        
        { title: 'Samsun', subtitle: 'Türkiye', lat: 41.2928, lng: 36.3313, type: 'city', keywords: ['samsun', 'karadeniz'] },
        { title: 'Trabzon', subtitle: 'Türkiye', lat: 41.0015, lng: 39.7178, type: 'city', keywords: ['trabzon', 'karadeniz'] },
        { title: 'Ordu', subtitle: 'Türkiye', lat: 40.9839, lng: 37.8764, type: 'city', keywords: ['ordu', 'karadeniz'] },
        { title: 'Giresun', subtitle: 'Türkiye', lat: 40.9128, lng: 38.3895, type: 'city', keywords: ['giresun', 'karadeniz'] },
        { title: 'Rize', subtitle: 'Türkiye', lat: 41.0201, lng: 40.5234, type: 'city', keywords: ['rize', 'karadeniz', 'çay'] },
        { title: 'Artvin', subtitle: 'Türkiye', lat: 41.1828, lng: 41.8183, type: 'city', keywords: ['artvin', 'karadeniz'] },
        { title: 'Gümüşhane', subtitle: 'Türkiye', lat: 40.4603, lng: 39.5086, type: 'city', keywords: ['gümüşhane', 'karadeniz'] },
        { title: 'Bayburt', subtitle: 'Türkiye', lat: 40.2552, lng: 40.2249, type: 'city', keywords: ['bayburt', 'karadeniz'] },
        { title: 'Kastamonu', subtitle: 'Türkiye', lat: 41.3767, lng: 33.7767, type: 'city', keywords: ['kastamonu', 'karadeniz'] },
        { title: 'Sinop', subtitle: 'Türkiye', lat: 42.0231, lng: 35.1531, type: 'city', keywords: ['sinop', 'karadeniz'] },
        { title: 'Çorum', subtitle: 'Türkiye', lat: 40.5506, lng: 34.9556, type: 'city', keywords: ['çorum', 'karadeniz'] },
        { title: 'Amasya', subtitle: 'Türkiye', lat: 40.6499, lng: 35.8353, type: 'city', keywords: ['amasya', 'karadeniz'] },
        { title: 'Tokat', subtitle: 'Türkiye', lat: 40.3167, lng: 36.5500, type: 'city', keywords: ['tokat', 'karadeniz'] },
        { title: 'Sivas', subtitle: 'Türkiye', lat: 39.7477, lng: 37.0179, type: 'city', keywords: ['sivas', 'karadeniz'] },
        { title: 'Zonguldak', subtitle: 'Türkiye', lat: 41.4564, lng: 31.7987, type: 'city', keywords: ['zonguldak', 'karadeniz'] },
        { title: 'Bartın', subtitle: 'Türkiye', lat: 41.6344, lng: 32.3375, type: 'city', keywords: ['bartın', 'karadeniz'] },
        { title: 'Karabük', subtitle: 'Türkiye', lat: 41.2061, lng: 32.6204, type: 'city', keywords: ['karabük', 'karadeniz'] },
        { title: 'Düzce', subtitle: 'Türkiye', lat: 40.8438, lng: 31.1565, type: 'city', keywords: ['düzce', 'karadeniz'] },
        { title: 'Bolu', subtitle: 'Türkiye', lat: 40.7316, lng: 31.6082, type: 'city', keywords: ['bolu', 'karadeniz'] },
        
        { title: 'Erzurum', subtitle: 'Türkiye', lat: 39.9334, lng: 41.2767, type: 'city', keywords: ['erzurum', 'doğu anadolu'] },
        { title: 'Erzincan', subtitle: 'Türkiye', lat: 39.7500, lng: 39.5000, type: 'city', keywords: ['erzincan', 'doğu anadolu'] },
        { title: 'Ağrı', subtitle: 'Türkiye', lat: 39.7191, lng: 43.0503, type: 'city', keywords: ['ağrı', 'doğu anadolu', 'ararat'] },
        { title: 'Kars', subtitle: 'Türkiye', lat: 40.6013, lng: 43.0975, type: 'city', keywords: ['kars', 'doğu anadolu'] },
        { title: 'Iğdır', subtitle: 'Türkiye', lat: 39.9167, lng: 44.0047, type: 'city', keywords: ['ığdır', 'doğu anadolu'] },
        { title: 'Ardahan', subtitle: 'Türkiye', lat: 41.1105, lng: 42.7022, type: 'city', keywords: ['ardahan', 'doğu anadolu'] },
        { title: 'Malatya', subtitle: 'Türkiye', lat: 38.3552, lng: 38.3095, type: 'city', keywords: ['malatya', 'doğu anadolu', 'kayısı'] },
        { title: 'Elazığ', subtitle: 'Türkiye', lat: 38.6810, lng: 39.2264, type: 'city', keywords: ['elazığ', 'doğu anadolu'] },
        { title: 'Bingöl', subtitle: 'Türkiye', lat: 38.8847, lng: 40.4981, type: 'city', keywords: ['bingöl', 'doğu anadolu'] },
        { title: 'Tunceli', subtitle: 'Türkiye', lat: 39.1079, lng: 39.5401, type: 'city', keywords: ['tunceli', 'doğu anadolu'] },
        { title: 'Muş', subtitle: 'Türkiye', lat: 38.9462, lng: 41.7539, type: 'city', keywords: ['muş', 'doğu anadolu'] },
        { title: 'Bitlis', subtitle: 'Türkiye', lat: 38.4000, lng: 42.1167, type: 'city', keywords: ['bitlis', 'doğu anadolu'] },
        { title: 'Van', subtitle: 'Türkiye', lat: 38.4891, lng: 43.4089, type: 'city', keywords: ['van', 'doğu anadolu', 'göl'] },
        { title: 'Hakkari', subtitle: 'Türkiye', lat: 37.5833, lng: 43.7333, type: 'city', keywords: ['hakkari', 'doğu anadolu'] },
        
        { title: 'Gaziantep', subtitle: 'Türkiye', lat: 37.0662, lng: 37.3833, type: 'city', keywords: ['gaziantep', 'antep', 'güneydoğu anadolu'] },
        { title: 'Şanlıurfa', subtitle: 'Türkiye', lat: 37.1591, lng: 38.7969, type: 'city', keywords: ['şanlıurfa', 'urfa', 'göbeklitepe', 'güneydoğu anadolu'] },
        { title: 'Diyarbakır', subtitle: 'Türkiye', lat: 37.9144, lng: 40.2306, type: 'city', keywords: ['diyarbakır', 'amid', 'güneydoğu anadolu'] },
        { title: 'Mardin', subtitle: 'Türkiye', lat: 37.3212, lng: 40.7245, type: 'city', keywords: ['mardin', 'güneydoğu anadolu'] },
        { title: 'Batman', subtitle: 'Türkiye', lat: 37.8812, lng: 41.1351, type: 'city', keywords: ['batman', 'güneydoğu anadolu'] },
        { title: 'Siirt', subtitle: 'Türkiye', lat: 37.9333, lng: 41.9500, type: 'city', keywords: ['siirt', 'güneydoğu anadolu'] },
        { title: 'Şırnak', subtitle: 'Türkiye', lat: 37.5167, lng: 42.4500, type: 'city', keywords: ['şırnak', 'güneydoğu anadolu'] },
        { title: 'Adıyaman', subtitle: 'Türkiye', lat: 37.7648, lng: 38.2786, type: 'city', keywords: ['adıyaman', 'güneydoğu anadolu'] },
        { title: 'Kilis', subtitle: 'Türkiye', lat: 36.7184, lng: 37.1212, type: 'city', keywords: ['kilis', 'güneydoğu anadolu'] }
    ];
    
    const normalizeText = (text) => {
        return text
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c');
    };
    
    const normalizedQuery = normalizeText(query);
    
    const results = locations.filter(location => {
        const titleMatch = normalizeText(location.title).includes(normalizedQuery);
        const subtitleMatch = normalizeText(location.subtitle).includes(normalizedQuery);
        const keywordMatch = location.keywords.some(keyword => 
            normalizeText(keyword).includes(normalizedQuery)
        );
        
        return titleMatch || subtitleMatch || keywordMatch;
    });
    
    return results.sort((a, b) => {
        const aScore = getMatchScore(a, normalizedQuery);
        const bScore = getMatchScore(b, normalizedQuery);
        return bScore - aScore;
    });
}

function getMatchScore(location, query) {
    let score = 0;
    const title = normalizeText(location.title);
    const subtitle = normalizeText(location.subtitle);
    
    if (title === query) score += 100;
    if (subtitle === query) score += 80;
    
    if (title.startsWith(query)) score += 50;
    if (subtitle.startsWith(query)) score += 30;
    
    if (title.includes(query)) score += 20;
    if (subtitle.includes(query)) score += 10;
    
    const keywordMatches = location.keywords.filter(keyword => 
        normalizeText(keyword).includes(query)
    ).length;
    score += keywordMatches * 15;
    
    return score;
}

function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
}

function showSearchLoading() {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = `
        <div class="search-loading">
            <span>🔍 Arama yapılıyor...</span>
        </div>
    `;
    searchResults.classList.remove('hidden');
}

function displaySearchResults(results) {
    const searchResults = document.getElementById('search-results');
    
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="search-no-results">
                <span>😔 Sonuç bulunamadı</span>
            </div>
        `;
    } else {
        searchResults.innerHTML = results.map(result => `
            <div class="search-result-item" data-lat="${result.lat}" data-lng="${result.lng}">
                <span class="search-result-icon">${getLocationIcon(result.type)}</span>
                <div class="search-result-text">
                    <div class="search-result-title">${result.title}</div>
                    <div class="search-result-subtitle">${result.subtitle}</div>
                    <div class="search-result-type">${getLocationTypeText(result.type)}</div>
                </div>
            </div>
        `).join('');
        
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                goToLocation(lat, lng);
                hideSearchResults();
            });
        });
    }
    
    searchResults.classList.remove('hidden');
}

function getLocationIcon(type) {
    const icons = {
        'city': '<i class="fas fa-city"></i>',
        'town': '<i class="fas fa-home"></i>',
        'region': '<i class="fas fa-mountain"></i>',
        'landmark': '<i class="fas fa-landmark"></i>',
        'district': '<i class="fas fa-home"></i>'
    };
    return icons[type] || '<i class="fas fa-map-marker-alt"></i>';
}

function getLocationTypeText(type) {
    const types = {
        'city': 'Şehir',
        'town': 'Kasaba',
        'region': 'Bölge',
        'landmark': 'Tarihi Yer',
        'district': 'Semt'
    };
    return types[type] || 'Konum';
}

function goToLocation(lat, lng) {
    console.log('Konuma gidiliyor:', lat, lng);
    
    map.setView([lat, lng], 12);
    
    const tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'temp-marker',
            html: '<div style="background: #007bff; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    }).addTo(map);
    
    setTimeout(() => {
        map.removeLayer(tempMarker);
    }, 3000);
    
    showNotification('Konuma gidildi! 📍');
}

function clearSearch() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search');
    const searchResults = document.getElementById('search-results');
    
    searchInput.value = '';
    clearBtn.style.display = 'none';
    hideSearchResults();
}

function hideSearchResults() {
    const searchResults = document.getElementById('search-results');
    searchResults.classList.add('hidden');
}
