# TraceTale Backend API

TraceTale projesinin Node.js + Express + MySQL backend uygulaması.

## 🚀 Kurulum

### 1. Gereksinimler
- Node.js v14+ ✅ (Sizde v24.1.0 var)
- MySQL 5.7+ ✅ (Sizde v9.3.0 var)

### 2. Paketleri Yükle
```bash
cd backend
npm install
```

### 3. MySQL Şifresini Ayarla

**⚠️ ÖNEMLİ:** MySQL root şifrenizi `.env` dosyasına eklemeniz gerekiyor.

#### MySQL şifrenizi bilmiyorsanız veya şifre yok:

Terminal'de şu komutu çalıştırın:
```bash
mysql_secure_installation
```

Ya da MySQL'e boş şifre ile giriş izni vermek için:
```bash
# MySQL'e sudo ile bağlanın
sudo mysql -u root

# MySQL konsolunda:
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;
exit;
```

#### Şifrenizi biliyorsanız:

`backend/.env` dosyasını düzenleyin:
```
DB_PASSWORD=your_mysql_password_here
```

### 4. Veritabanını Oluştur
```bash
npm run setup-db
```

Bu komut otomatik olarak:
- ✅ `tracetale` veritabanını oluşturur
- ✅ Tüm tabloları (users, stories, messages, vb.) oluşturur
- ✅ İndeksleri ve foreign key'leri ayarlar

### 5. Sunucuyu Başlat
```bash
npm start
```

Veya geliştirme modunda (auto-reload):
```bash
npm run dev
```

## 📡 API Endpoints

### Kimlik Doğrulama
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/profile` - Profil bilgileri (🔒 Token gerekli)

### Hikayeler
- `GET /api/stories` - Tüm hikayeleri listele
- `GET /api/stories/:id` - Tek hikaye detayı
- `POST /api/stories` - Yeni hikaye ekle (🔒 Token gerekli)
- `PUT /api/stories/:id` - Hikaye güncelle (🔒 Token gerekli)
- `DELETE /api/stories/:id` - Hikaye sil (🔒 Token gerekli)
- `POST /api/stories/:id/like` - Hikaye beğen/beğeniyi kaldır (🔒 Token gerekli)

### Mesajlaşma
- `GET /api/messages/conversations` - Konuşma listesi (🔒 Token gerekli)
- `GET /api/messages/conversation/:userId` - Belirli kullanıcı ile mesajlar (🔒 Token gerekli)
- `POST /api/messages/send` - Mesaj gönder (🔒 Token gerekli)
- `GET /api/messages/unread-count` - Okunmamış mesaj sayısı (🔒 Token gerekli)

## 🔒 Token Kullanımı

Token gerektiren endpoint'ler için header'a şunu ekleyin:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📊 Veritabanı Yapısı

- **users** - Kullanıcı bilgileri
- **stories** - Hikayeler, notlar ve fotoğraflar
- **conversations** - Mesajlaşma konuşmaları
- **messages** - Mesajlar
- **story_likes** - Hikaye beğenileri
- **comments** - Yorumlar

## 🛠️ Sorun Giderme

### MySQL bağlantı hatası
`.env` dosyasındaki veritabanı ayarlarını kontrol edin.

### Port zaten kullanımda
`.env` dosyasında `PORT` değerini değiştirin.

## 📝 Not

Bu backend, frontend ile birlikte çalışmak üzere tasarlanmıştır. Frontend'i başlatmadan önce backend'in çalıştığından emin olun.

