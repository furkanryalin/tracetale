# TraceMark Veritabanı ER Diyagramı

## Mermaid ER Diagram Kodu

```mermaid
erDiagram
    USERS ||--o{ STORIES : "oluşturur"
    USERS ||--o{ CONVERSATIONS : "user1_id"
    USERS ||--o{ CONVERSATIONS : "user2_id"
    USERS ||--o{ MESSAGES : "sender_id"
    USERS ||--o{ MESSAGES : "receiver_id"
    USERS ||--o{ STORY_LIKES : "beğenir"
    USERS ||--o{ COMMENTS : "yorumlar"
    USERS ||--o{ NOTIFICATIONS : "alır"
    USERS ||--o{ NOTIFICATIONS : "related_user_id"
    
    STORIES ||--o{ STORY_LIKES : "beğenilir"
    STORIES ||--o{ COMMENTS : "yorumlanır"
    STORIES ||--o{ NOTIFICATIONS : "bildirim"
    
    CONVERSATIONS ||--o{ MESSAGES : "içerir"

    USERS {
        int id PK
        string name
        string email UK
        string password
        string avatar
        text bio
        timestamp created_at
        timestamp updated_at
    }
    
    STORIES {
        int id PK
        int user_id FK
        string title
        text content
        enum type
        string photo_url
        decimal latitude
        decimal longitude
        string location_name
        boolean is_anonymous
        timestamp created_at
        timestamp updated_at
    }
    
    CONVERSATIONS {
        int id PK
        int user1_id FK
        int user2_id FK
        timestamp last_message_at
        timestamp created_at
    }
    
    MESSAGES {
        int id PK
        int conversation_id FK
        int sender_id FK
        int receiver_id FK
        text message
        boolean is_read
        timestamp created_at
    }
    
    STORY_LIKES {
        int id PK
        int story_id FK
        int user_id FK
        timestamp created_at
    }
    
    COMMENTS {
        int id PK
        int story_id FK
        int user_id FK
        text comment
        timestamp created_at
    }
    
    NOTIFICATIONS {
        int id PK
        int user_id FK
        enum type
        int related_user_id FK
        int story_id FK
        text message
        boolean is_read
        timestamp created_at
    }
```

## Tablo İlişkileri Özeti

1. **USERS** → **STORIES** (1:N): Bir kullanıcı birden fazla hikaye oluşturabilir
2. **USERS** → **CONVERSATIONS** (N:M): İki kullanıcı arasında konuşma
3. **CONVERSATIONS** → **MESSAGES** (1:N): Bir konuşmada birden fazla mesaj
4. **STORIES** → **STORY_LIKES** (1:N): Bir hikaye birden fazla beğeni alabilir
5. **STORIES** → **COMMENTS** (1:N): Bir hikayeye birden fazla yorum yapılabilir
6. **USERS** → **NOTIFICATIONS** (1:N): Bir kullanıcı birden fazla bildirim alabilir

