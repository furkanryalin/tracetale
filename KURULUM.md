# 🚀 TraceTale Kurulum ve Çalıştırma Kılavuzu

Bu dokümanda TraceTale projesinin backend ve frontend'ini çalıştırmak için gerekli tüm adımlar yer almaktadır.

## 📋 Gereksinimler

- **Node.js** v14+ (Önerilen: v18+)
- **MySQL** 5.7+ veya 8.0+
- **npm** veya **yarn** paket yöneticisi

## 🔧 Kurulum Adımları

### 1. Backend Kurulumu

#### 1.1. Backend Klasörüne Gidin
```bash
cd backend
```

#### 1.2. Bağımlılıkları Yükleyin
```bash
npm install
```

#### 1.3. Ortam Değişkenlerini Ayarlayın

`backend/.env` dosyasını oluşturun veya düzenleyin:

```env
# Veritabanı Ayarları
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=tracetale
DB_PORT=3306

# JWT Secret Key (Güvenlik için önemli!)
JWT_SECRET=your_super_secret_jwt_key_here

# Sunucu Portu
PORT=3000
```

**⚠️ ÖNEMLİ:** 
- MySQL şifrenizi `DB_PASSWORD` alanına yazın
- Eğer MySQL şifreniz yoksa, boş bırakabilirsiniz: `DB_PASSWORD=`
- `JWT_SECRET` için güçlü bir rastgele string kullanın

#### 1.4. Veritabanını Oluşturun

Veritabanını ve tabloları otomatik olarak oluşturmak için:

```bash
npm run setup-db
```

Bu komut:
- ✅ `tracetale` veritabanını oluşturur
- ✅ Tüm tabloları (users, stories, messages, vb.) oluşturur
- ✅ İndeksleri ve foreign key'leri ayarlar

### 2. Frontend Kurulumu

Frontend statik HTML/CSS/JS dosyalarından oluştuğu için özel bir kurulum gerektirmez. Sadece bir web sunucusu ile çalıştırmanız yeterlidir.

## ▶️ Çalıştırma

### Backend'i Çalıştırma

#### Geliştirme Modu (Önerilen)
Auto-reload özelliği ile çalışır (dosya değişikliklerinde otomatik yeniden başlar):

```bash
cd backend
npm run dev
```

#### Production Modu
```bash
cd backend
npm start
```

Backend başarıyla başladığında şu çıktıyı göreceksiniz:

```
🚀 TraceTale Backend Sunucusu Başlatıldı!

📡 Server: http://localhost:3000
🏥 Health Check: http://localhost:3000/api/health
📚 API Base URL: http://localhost:3000/api
```

### Frontend'i Çalıştırma

Frontend'i çalıştırmak için birkaç seçenek var:

#### Seçenek 1: Python HTTP Sunucusu (Önerilen)

Python 3 yüklüyse:

```bash
# Proje ana dizininde
python3 -m http.server 8000
```

Veya Python 2:

```bash
python -m SimpleHTTPServer 8000
```

#### Seçenek 2: Node.js HTTP Sunucusu

```bash
# Proje ana dizininde
npx http-server -p 8000
```

#### Seçenek 3: VS Code Live Server

VS Code kullanıyorsanız:
1. `index.html` dosyasına sağ tıklayın
2. "Open with Live Server" seçeneğini seçin

#### Seçenek 4: PHP Built-in Server

PHP yüklüyse:

```bash
# Proje ana dizininde
php -S localhost:8000
```

Frontend başarıyla başladığında tarayıcınızda şu adresi açın:

```
http://localhost:8000
```

## 🔄 Her İki Sunucuyu Birlikte Çalıştırma

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend
```bash
# Proje ana dizininde
python3 -m http.server 8000
```

## 📝 Önemli Notlar

1. **Backend Portu**: Backend varsayılan olarak `3000` portunda çalışır. Değiştirmek için `.env` dosyasındaki `PORT` değişkenini düzenleyin.

2. **Frontend Portu**: Frontend için `8000` portu önerilir, ancak başka bir port da kullanabilirsiniz.

3. **CORS**: Backend CORS ayarları tüm origin'lere izin verecek şekilde yapılandırılmıştır. Production'da bunu kısıtlamanız önerilir.

4. **API URL**: Frontend'deki `scripts/config.js` dosyasında API URL'i `http://localhost:3000/api` olarak ayarlanmıştır. Backend portunu değiştirirseniz bu dosyayı da güncelleyin.

## 🐛 Sorun Giderme

### MySQL Bağlantı Hatası

Eğer MySQL bağlantı hatası alıyorsanız:

1. MySQL servisinin çalıştığından emin olun:
   ```bash
   # macOS/Linux
   sudo service mysql status
   # veya
   brew services list
   ```

2. MySQL şifrenizi kontrol edin:
   ```bash
   mysql -u root -p
   ```

3. `.env` dosyasındaki veritabanı bilgilerini kontrol edin

### Port Zaten Kullanılıyor

Eğer port zaten kullanılıyorsa:

- Backend için: `.env` dosyasında `PORT` değişkenini farklı bir port numarası ile değiştirin
- Frontend için: Farklı bir port numarası kullanın (örn: `8001`)

### Veritabanı Tabloları Eksik

Veritabanı tablolarını yeniden oluşturmak için:

```bash
cd backend
npm run setup-db
```

## 📚 API Endpoints

Backend başarıyla çalıştıktan sonra şu endpoint'ler kullanılabilir:

- `GET /api/health` - Sağlık kontrolü
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/profile` - Profil bilgileri (Token gerekli)
- `GET /api/stories` - Hikayeleri listele
- `POST /api/stories` - Hikaye ekle (Token gerekli)
- `GET /api/messages/conversations` - Mesajlar (Token gerekli)

Daha fazla bilgi için `backend/README.md` dosyasına bakın.

## ✅ Başarı Kontrolü

Her şeyin doğru çalıştığını kontrol etmek için:

1. Backend: Tarayıcıda `http://localhost:3000/api/health` adresini açın - `{"status":"ok"}` yanıtı almalısınız
2. Frontend: Tarayıcıda `http://localhost:8000` adresini açın - TraceTale ana sayfası görünmelidir

## 🎉 Hazırsınız!

Artık TraceTale uygulamanızı geliştirmeye başlayabilirsiniz!

