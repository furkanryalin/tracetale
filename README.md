# 🗺️ TraceTale

Harita üzerinde hikayelerinizi paylaşın! TraceTale, kullanıcıların konum bazlı hikayeler, notlar ve fotoğraflar paylaşabildiği interaktif bir web uygulamasıdır.

## ✨ Özellikler

- 🗺️ İnteraktif harita (Leaflet.js)
- 📖 Hikaye, not ve fotoğraf paylaşımı
- 📍 Konum bazlı içerik filtreleme
- 💬 Kullanıcılar arası mesajlaşma
- 👤 Kullanıcı profilleri
- 🔒 JWT tabanlı kimlik doğrulama
- 🌙 Karanlık/Aydınlık harita temaları
- 📱 Responsive tasarım

## 🛠️ Teknolojiler

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Leaflet.js (Harita)
- OpenStreetMap

### Backend
- Node.js + Express.js
- MySQL 9.3
- JWT Authentication
- bcryptjs (Şifre hashleme)

## 🚀 Kurulum

### 1. Repoyu Klonlayın (veya indirin)
```bash
cd /Users/furkanyalin/Desktop/TraceTale
```

### 2. Backend Kurulumu

**Adım 1: Paketleri yükleyin**
```bash
cd backend
npm install
```

**Adım 2: MySQL şifresini ayarlayın**

⚠️ **ÖNEMLİ:** MySQL root kullanıcınızın şifresini bilmeniz gerekiyor.

**Şifrenizi bilmiyorsanız:**
```bash
# Terminal'de MySQL'i root olarak açın
sudo mysql -u root

# MySQL konsolunda şu komutları çalıştırın:
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;
exit;
```

**Şifrenizi biliyorsanız:**
`backend/.env` dosyasını açın ve şifrenizi ekleyin:
```
DB_PASSWORD=your_mysql_password_here
```

**Adım 3: Veritabanını oluşturun**
```bash
npm run setup-db
```

**Adım 4: Backend sunucusunu başlatın**
```bash
npm start
```

Backend http://localhost:3000 adresinde çalışacak.

### 3. Frontend Kurulumu

Frontend statik bir HTML uygulamasıdır. Basitçe `index.html` dosyasını bir web sunucusunda çalıştırmanız yeterli.

**Seçenek 1: Python ile (basit)**
```bash
# Ana dizinde (TraceTale/)
python3 -m http.server 8000
```

**Seçenek 2: VS Code Live Server**
- VS Code'da `index.html` dosyasını açın
- Sağ tıklayıp "Open with Live Server" seçin

**Seçenek 3: Node http-server**
```bash
npx http-server -p 8000
```

Ardından tarayıcınızda http://localhost:8000 adresine gidin.

## 📡 API Kullanımı

Backend API endpoint'leri `http://localhost:3000/api` altında çalışır.

Detaylı API dokümantasyonu için `backend/README.md` dosyasına bakın.

## 📁 Proje Yapısı

```
TraceTale/
├── index.html              # Ana HTML dosyası
├── styles.css              # CSS stilleri
├── tracetalelogo.png       # Logo
├── scripts/                # Frontend JavaScript modülleri
│   ├── core.js
│   ├── auth.js
│   ├── stories.js
│   ├── map-features.js
│   ├── photo.js
│   ├── interactions.js
│   ├── messaging.js
│   ├── search.js
│   ├── filters.js
│   └── profile.js
└── backend/                # Backend API
    ├── server.js           # Ana sunucu dosyası
    ├── package.json
    ├── .env                # Ortam değişkenleri
    ├── config/
    │   ├── database.js     # MySQL bağlantısı
    │   └── setup-database.js
    ├── controllers/        # İş mantığı
    ├── routes/             # API route'ları
    └── middleware/         # Middleware (auth vb.)
```

## 🔧 Yapılandırma

### Backend Ortam Değişkenleri (.env)

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tracetale
DB_PORT=3306

JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

### Frontend API Bağlantısı

Frontend JavaScript dosyalarında API URL'ini güncelleyin:
```javascript
const API_URL = 'http://localhost:3000/api';
```

## 🗄️ Veritabanı Tabloları

- **users** - Kullanıcı bilgileri (id, name, email, password, avatar, bio)
- **stories** - Hikayeler (id, user_id, title, content, type, photo_url, latitude, longitude)
- **conversations** - Mesajlaşma konuşmaları
- **messages** - Kullanıcılar arası mesajlar
- **story_likes** - Hikaye beğenileri
- **comments** - Hikaye yorumları

## 🎯 Kullanım

1. **Kayıt Ol / Giriş Yap**: Sağ üst köşedeki "Giriş Yap" butonuna tıklayın
2. **Hikaye Ekle**: Haritaya tıklayın ve konum seçin, sonra + butonuna tıklayın
3. **Hikayeleri Görüntüle**: Haritadaki işaretçilere tıklayın
4. **Filtrele**: Hikayeleri türe, tarihe veya konuma göre filtreleyin
5. **Mesajlaşma**: Hikaye sahipleriyle mesajlaşın

## 🐛 Sorun Giderme

### Backend başlamıyor
- MySQL servisinizin çalıştığından emin olun: `brew services list`
- `.env` dosyasındaki veritabanı bilgilerini kontrol edin
- `npm run setup-db` komutunu çalıştırarak veritabanını oluşturun

### Frontend API'ye bağlanamıyor
- Backend sunucusunun çalıştığından emin olun
- CORS hatası alıyorsanız, backend'de CORS ayarlandı, sorun olmaz
- Tarayıcı konsolunda hata mesajlarını kontrol edin

### MySQL şifre hatası
- `MYSQL_SETUP.md` dosyasındaki adımları takip edin
- MySQL şifrenizi sıfırlayın veya `.env` dosyasına doğru şifreyi girin

## 📝 Notlar

- ⚠️ Bu proje geliştirme amaçlıdır. Production kullanımı için güvenlik ayarlarını gözden geçirin.
- 🔐 JWT secret key'inizi production'da mutlaka değiştirin
- 📦 MySQL şifrenizi `.env` dosyasında saklayın ve bu dosyayı git'e eklemeyin

## 📄 Lisans

Bu proje eğitim amaçlıdır.

---

Geliştirici: TraceTale Team

# tracetale
