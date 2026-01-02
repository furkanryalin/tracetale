// ===================================
// PHOTO - Fotoğraf Yönetimi
// ===================================

function setupPhotoUpload() {
    const photoUploadArea = document.getElementById('photo-upload-area');
    const photoUpload = document.getElementById('photo-upload');
    const photoRemoveBtn = document.getElementById('photo-remove-btn');
    
    photoUploadArea.addEventListener('click', function() {
        photoUpload.click();
    });
    
    photoUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Dosya boyutu 5MB\'dan büyük olamaz.');
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                alert('Lütfen sadece resim dosyası seçin.');
                return;
            }
            
            showPhotoPreview(file);
        }
    });
    
    photoRemoveBtn.addEventListener('click', function() {
        clearPhotoPreview();
    });
}

function showPhotoPreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const photoPreview = document.getElementById('photo-preview');
        const photoPreviewImg = document.getElementById('photo-preview-img');
        const photoUploadArea = document.getElementById('photo-upload-area');
        
        photoPreviewImg.src = e.target.result;
        photoPreview.style.display = 'block';
        photoUploadArea.style.display = 'none';
        
        window.currentPhotoData = {
            file: file,
            dataUrl: e.target.result
        };
    };
    reader.readAsDataURL(file);
}

function clearPhotoPreview() {
    const photoPreview = document.getElementById('photo-preview');
    const photoUploadArea = document.getElementById('photo-upload-area');
    const photoUpload = document.getElementById('photo-upload');
    
    photoPreview.style.display = 'none';
    photoUploadArea.style.display = 'block';
    photoUpload.value = '';
    
    window.currentPhotoData = null;
}

function setupPhotoModal() {
    const photoModal = document.getElementById('photo-modal');
    const photoClose = document.getElementById('photo-close');
    
    photoClose.addEventListener('click', closePhotoModal);
    photoModal.addEventListener('click', function(e) {
        if (e.target === photoModal) {
            closePhotoModal();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !photoModal.classList.contains('hidden')) {
            closePhotoModal();
        }
    });
}

function openPhotoModal(photoData, storyData) {
    const photoModal = document.getElementById('photo-modal');
    const photoFullSize = document.getElementById('photo-full-size');
    const photoInfo = document.querySelector('.photo-info');
    const photoTitle = document.getElementById('photo-title');
    const photoDescription = document.getElementById('photo-description');
    const photoAuthor = document.getElementById('photo-author');
    const photoDate = document.getElementById('photo-date');
    
    photoFullSize.src = photoData.dataUrl;
    photoFullSize.alt = storyData.title || 'Fotoğraf';
    photoFullSize.style.display = 'block';
    
    photoTitle.textContent = storyData.title || 'Başlıksız Fotoğraf';
    photoDescription.textContent = storyData.content || 'Açıklama yok';
    photoAuthor.textContent = `Yazar: ${storyData.author || 'Anonim'}`;
    photoDate.textContent = `Tarih: ${new Date(storyData.timestamp).toLocaleDateString('tr-TR')}`;
    photoInfo.style.display = 'block';
    
    photoModal.classList.remove('hidden');
}

function closePhotoModal() {
    const photoModal = document.getElementById('photo-modal');
    const photoFullSize = document.getElementById('photo-full-size');
    const photoInfo = document.querySelector('.photo-info');
    
    photoFullSize.style.display = 'none';
    photoInfo.style.display = 'none';
    
    photoModal.classList.add('hidden');
}

window.openPhotoModal = openPhotoModal;

