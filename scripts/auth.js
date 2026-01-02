// ===================================
// AUTH - Kimlik Doğrulama Sistemi
// ===================================

function setupAuthSystem() {
    console.log('Auth sistemi başlatılıyor...');
    
    const authBtn = document.getElementById('auth-btn');
    const authModal = document.getElementById('auth-modal');
    const authClose = document.getElementById('auth-close');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    const authTitle = document.getElementById('auth-title');
    
    if (!authBtn || !authModal || !authClose || !loginForm || !registerForm) {
        console.error('Auth elementleri bulunamadı!');
        return;
    }
    
    console.log('Auth elementleri bulundu');
    
    authBtn.addEventListener('click', () => {
        if (isLoggedIn()) {
            openProfileModal();
        } else {
            openAuthModal();
        }
    });
    
    authClose.addEventListener('click', closeAuthModal);
    authModal.addEventListener('click', function(e) {
        if (e.target === authModal) {
            closeAuthModal();
        }
    });
    
    switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });
    
    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
    
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    
    updateAuthButton();
}

function openAuthModal() {
    const authModal = document.getElementById('auth-modal');
    authModal.classList.remove('hidden');
    showLoginForm();
}

function closeAuthModal() {
    const authModal = document.getElementById('auth-modal');
    authModal.classList.add('hidden');
}

function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authTitle.textContent = 'Giriş Yap';
}

function showRegisterForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authTitle.textContent = 'Kayıt Ol';
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showNotification('Lütfen tüm alanları doldurun! ⚠️');
        return;
    }
    
    try {
        // API'ye giriş isteği gönder
        const response = await API.post(Endpoints.LOGIN, {
            email,
            password
        }, { auth: false });
        
        if (response.success) {
            // Kullanıcı bilgilerini ve token'ı sakla
            const userData = {
                id: response.user.id,
                name: response.user.name,
                email: response.user.email,
                avatar: response.user.avatar || null,
                token: response.token,
                stats: {
                    stories: 0,
                    notes: 0,
                    photos: 0
                }
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userData));
            updateAuthButton();
            closeAuthModal();
            showNotification(`Hoş geldin ${response.user.name}! 👋`);
            
            document.getElementById('login-form').reset();
            
            // 401 hatası flag'lerini sıfırla
            if (typeof API !== 'undefined' && API.handleUnauthorized) {
                API._unauthorizedNotified = false;
                API._authModalOpened = false;
            }
            
            // Aktivite takibini başlat
            if (typeof activityTracker !== 'undefined') {
                activityTracker.start();
            }
            
            // Bildirim polling başlat
            if (typeof NotificationsPage !== 'undefined') {
                NotificationsPage.startPolling();
            }
            
            // Hikayeleri yeniden yükle (giriş yaptığında privacy filtresi değişebilir)
            if (typeof loadStories === 'function') {
                loadStories(true); // Force reload - yeni hikayeler görünür olabilir
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'E-posta veya şifre hatalı! ❌');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showNotification('Lütfen tüm alanları doldurun! ⚠️');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Şifreler eşleşmiyor! ❌');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Şifre en az 6 karakter olmalı! ⚠️');
        return;
    }
    
    try {
        // API'ye kayıt isteği gönder
        const response = await API.post(Endpoints.REGISTER, {
            name,
            email,
            password
        }, { auth: false });
        
        if (response.success) {
            // Kullanıcı bilgilerini ve token'ı sakla
            const userData = {
                id: response.user.id,
                name: response.user.name,
                email: response.user.email,
                avatar: response.user.avatar || null,
                token: response.token,
                stats: {
                    stories: 0,
                    notes: 0,
                    photos: 0
                }
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userData));
            updateAuthButton();
            closeAuthModal();
            showNotification(`Hoş geldin ${name}! Hesabın oluşturuldu! 🎉`);
            
            // 401 hatası flag'lerini sıfırla
            if (typeof API !== 'undefined' && API.handleUnauthorized) {
                API._unauthorizedNotified = false;
                API._authModalOpened = false;
            }
            
            // Aktivite takibini başlat
            if (typeof activityTracker !== 'undefined') {
                activityTracker.start();
            }
            
            // Bildirim polling başlat
            if (typeof NotificationsPage !== 'undefined') {
                NotificationsPage.startPolling();
            }
            
            document.getElementById('register-form').reset();
        }
    } catch (error) {
        console.error('Register error:', error);
        showNotification(error.message || 'Kayıt sırasında bir hata oluştu! ❌');
    }
}

function isLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}

function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

async function logout() {
    try {
        // Backend'e çıkış bildirimi gönder (last_seen'i güncelle)
        if (typeof API !== 'undefined') {
            await API.post('/auth/logout').catch(() => {
                // Hata olsa bile devam et
                console.log('Logout API çağrısı başarısız, yerel çıkış yapılıyor');
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    // Aktivite takibini durdur
    if (typeof activityTracker !== 'undefined') {
        activityTracker.stop();
    }
    
    // Bildirim polling durdur
    if (typeof NotificationsPage !== 'undefined') {
        NotificationsPage.stopPolling();
    }
    
    localStorage.removeItem('currentUser');
    updateAuthButton();
    showNotification('Çıkış yapıldı! 👋');
    closeProfileModal();
}

function updateAuthButton() {
    const authBtn = document.getElementById('auth-btn');
    const mobileAuthBtn = document.getElementById('mobile-auth-btn');
    const dmHeaderBtn = document.getElementById('dm-header-btn');
    const mobileDmBtn = document.getElementById('mobile-dm-btn');
    const notificationsHeaderBtn = document.getElementById('notifications-header-btn');
    const mobileNotificationsBtn = document.getElementById('mobile-notifications-btn');
    
    if (isLoggedIn()) {
        const user = getCurrentUser();
        if (authBtn) {
            authBtn.textContent = user.name;
            authBtn.style.background = 'var(--primary)';
            authBtn.style.color = 'var(--bg-primary)';
        }
        if (mobileAuthBtn) {
            mobileAuthBtn.textContent = user.name;
            mobileAuthBtn.innerHTML = `<i class="fas fa-user"></i> ${user.name}`;
        }
        
        if (dmHeaderBtn) {
            dmHeaderBtn.style.display = 'block';
        }
        if (mobileDmBtn) {
            mobileDmBtn.style.display = 'flex';
        }
        
        if (notificationsHeaderBtn) {
            notificationsHeaderBtn.style.display = 'block';
        }
        if (mobileNotificationsBtn) {
            mobileNotificationsBtn.style.display = 'flex';
        }
    } else {
        if (authBtn) {
            authBtn.textContent = 'Giriş Yap';
            authBtn.style.background = '';
        }
        if (mobileAuthBtn) {
            mobileAuthBtn.textContent = 'Giriş Yap';
            mobileAuthBtn.innerHTML = 'Giriş Yap';
        }
        
        if (dmHeaderBtn) {
            dmHeaderBtn.style.display = 'none';
        }
        if (mobileDmBtn) {
            mobileDmBtn.style.display = 'none';
        }
        
        if (notificationsHeaderBtn) {
            notificationsHeaderBtn.style.display = 'none';
        }
        if (mobileNotificationsBtn) {
            mobileNotificationsBtn.style.display = 'none';
        }
    }
}

function updateUserStats(userId, storyType) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        if (storyType === 'story') {
            users[userIndex].stats.stories++;
        } else if (storyType === 'note') {
            users[userIndex].stats.notes++;
        } else if (storyType === 'photo') {
            users[userIndex].stats.photos++;
        }
        
        localStorage.setItem('users', JSON.stringify(users));
        
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            localStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
        }
        
        console.log('Kullanıcı istatistikleri güncellendi:', users[userIndex].stats);
    }
}
