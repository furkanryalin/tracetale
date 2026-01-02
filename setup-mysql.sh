#!/bin/bash

echo "🔧 TraceTale MySQL Kurulum Yardımcısı"
echo "======================================"
echo ""

echo "MySQL root şifrenizi biliyor musunuz? (e/h)"
read -r answer

if [ "$answer" = "e" ] || [ "$answer" = "E" ]; then
    echo ""
    echo "Lütfen MySQL root şifrenizi girin:"
    read -s mysql_password
    
    # .env dosyasını güncelle
    cd backend
    sed -i '' "s/DB_PASSWORD=.*/DB_PASSWORD=$mysql_password/" .env
    
    echo ""
    echo "✅ Şifre .env dosyasına eklendi!"
    echo "🔄 Veritabanı oluşturuluyor..."
    npm run setup-db
    
else
    echo ""
    echo "MySQL root şifresini sıfırlayalım..."
    echo "⚠️  Bu işlem için sistem şifreniz gerekebilir."
    echo ""
    
    echo "MySQL'e bağlanmayı deniyorum..."
    
    # MySQL'e bağlan ve şifreyi sıfırla
    sudo mysql -u root << EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;
EOF
    
    if [ $? -eq 0 ]; then
        echo "✅ MySQL root şifresi kaldırıldı!"
        echo "🔄 Veritabanı oluşturuluyor..."
        cd backend
        npm run setup-db
    else
        echo "❌ MySQL bağlantısı kurulamadı."
        echo ""
        echo "Lütfen manuel olarak şu adımları deneyin:"
        echo "1. Terminal'de: sudo mysql -u root"
        echo "2. MySQL konsolunda:"
        echo "   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';"
        echo "   FLUSH PRIVILEGES;"
        echo "   exit;"
        echo "3. Sonra: cd backend && npm run setup-db"
    fi
fi

echo ""
echo "✨ Kurulum tamamlandı!"
echo "Backend'i başlatmak için:"
echo "  cd backend"
echo "  npm start"

