// ===================================
// INTERACTIONS - Sosyal Etkileşimler
// ===================================

function setupStoryInteractions() {
    console.log('Story interactions başlatılıyor...');
    
    const likeBtns = document.querySelectorAll('.like-btn');
    likeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            handleLike(this);
        });
    });
    
    const commentBtns = document.querySelectorAll('.comment-btn');
    commentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            handleComment(this);
        });
    });
    
    const shareBtns = document.querySelectorAll('.share-btn');
    shareBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            handleShare(this);
        });
    });
    
    const saveBtns = document.querySelectorAll('.save-btn');
    saveBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            handleSave(this);
        });
    });
}

async function handleLike(btn) {
    const storyId = btn.dataset.storyId;
    const countSpan = btn.querySelector('.interaction-count');
    let currentCount = parseInt(countSpan.textContent) || 0;
    
    // Backend API'ye istek gönder
    try {
        const response = await API.post(Endpoints.STORY_LIKE(storyId));
        
        if (response.success) {
            if (response.liked) {
                // Beğenildi
                btn.classList.add('liked');
                btn.classList.add('animate');
                currentCount++;
                countSpan.textContent = currentCount;
                showNotification('Beğenildi! ❤️');
                
                setTimeout(() => {
                    btn.classList.remove('animate');
                }, 300);
            } else {
                // Beğeni kaldırıldı
                btn.classList.remove('liked');
                currentCount--;
                countSpan.textContent = currentCount;
                showNotification('Beğeni kaldırıldı 💔');
            }
            
            saveInteractionData(storyId, 'likes', currentCount);
        }
    } catch (error) {
        console.error('Beğeni hatası:', error);
        showNotification('Beğeni işlemi başarısız! ❌');
    }
}

async function handleComment(btn) {
    const storyId = btn.dataset.storyId;
    const countSpan = btn.querySelector('.interaction-count');
    let currentCount = parseInt(countSpan.textContent) || 0;
    
    const comment = prompt('Yorumunuzu yazın:');
    if (comment && comment.trim()) {
        // Backend API'ye istek gönder
        try {
            const response = await API.post(Endpoints.STORY_COMMENT(storyId), { comment });
            
            if (response.success) {
                currentCount++;
                countSpan.textContent = currentCount;
                btn.classList.add('active');
                showNotification('Yorum eklendi! 💬');
                
                saveInteractionData(storyId, 'comments', currentCount);
                
                setTimeout(() => {
                    btn.classList.remove('active');
                }, 2000);
            }
        } catch (error) {
            console.error('Yorum hatası:', error);
            showNotification('Yorum eklenemedi! ❌');
        }
    }
}

function handleShare(btn) {
    const storyId = btn.dataset.storyId;
    
    const shareOptions = [
        '📱 WhatsApp',
        '📧 E-posta',
        '🔗 Link Kopyala',
        '📱 SMS'
    ];
    
    const choice = prompt('Paylaşım yöntemi seçin:\n\n' + 
        shareOptions.map((option, index) => `${index + 1}. ${option}`).join('\n') + 
        '\n\nNumara girin (1-4):');
    
    if (choice && choice >= 1 && choice <= 4) {
        btn.classList.add('active');
        showNotification(`${shareOptions[choice - 1]} ile paylaşıldı! 📤`);
        
        setTimeout(() => {
            btn.classList.remove('active');
        }, 2000);
    }
}

function handleSave(btn) {
    const storyId = btn.dataset.storyId;
    
    if (btn.classList.contains('saved')) {
        btn.classList.remove('saved');
        showNotification('Kayıtlardan kaldırıldı 📖');
    } else {
        btn.classList.add('saved');
        btn.classList.add('animate');
        showNotification('Kaydedildi! 🔖');
        
        setTimeout(() => {
            btn.classList.remove('animate');
        }, 300);
    }
    
    saveInteractionData(storyId, 'saved', btn.classList.contains('saved'));
}

function saveInteractionData(storyId, type, value) {
    const interactions = JSON.parse(localStorage.getItem('storyInteractions') || '{}');
    
    if (!interactions[storyId]) {
        interactions[storyId] = {};
    }
    
    interactions[storyId][type] = value;
    localStorage.setItem('storyInteractions', JSON.stringify(interactions));
}

function loadInteractionData(storyId) {
    const interactions = JSON.parse(localStorage.getItem('storyInteractions') || '{}');
    return interactions[storyId] || {};
}

