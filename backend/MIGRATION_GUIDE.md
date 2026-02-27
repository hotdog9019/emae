# 🔄 Инструкция по миграции БД (v1.x → v2.0)

## ⚠️ ВАЖНО: Экспортируйте данные ПЕРЕД миграцией!

## Шаг 1: Резервная копия старой БД

```bash
# Windows
copy app.db app.db.backup

# Linux/Mac
cp app.db app.db.backup
```

## Шаг 2: Скачайте/обновите файлы

Убедитесь, что у вас есть следующие новые файлы:
- `models.py` (обновленный)
- `schemas.py` (обновленный)
- `auth_new.py` (новый)
- `categories.py` (новый)
- `goods.py` (новый)
- `baskets.py` (новый)
- `roles.py` (новый)
- `main_new.py` (новый)

## Шаг 3: Замена файлов

### Способ A: Чистая установка (рекомендуется)

```bash
# 1. Удалите старую БД
del app.db

# 2. Переименуйте новые файлы
move auth_new.py auth.py
move main_new.py main.py

# 3. Запустите сервер
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Сервер автоматически:
- Создаст все новые таблицы
- Создаст роли (user, moderator, admin)
- Создаст разрешения
- Инициализирует БД

### Способ B: Если нужна миграция данных

1. **Экспортируйте данные из старой БД**

```python
# export_old_db.py
import sqlite3
import json

conn = sqlite3.connect('app.db.backup')
cursor = conn.cursor()

# Экспортируем пользователей
cursor.execute('SELECT * FROM users')
users = cursor.fetchall()

with open('users_export.json', 'w') as f:
    json.dump(users, f)

conn.close()
```

2. **Удалите старую БД и создайте новую**

```bash
del app.db
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
# Дайте серверу инициализироваться и нажмите Ctrl+C
```

3. **Импортируйте данные в новую БД**

```python
# import_to_new_db.py
from database import SessionLocal
from models import User, Role
from utils import hash_password
import json

db = SessionLocal()

# Получаем стандартную роль "user"
user_role = db.query(Role).filter(Role.name == "user").first()

try:
    with open('users_export.json', 'r') as f:
        old_users = json.load(f)
    
    for old_user in old_users:
        # Пропускаем если пользователь уже существует
        existing = db.query(User).filter(User.name == old_user[2]).first()
        if existing:
            continue
        
        new_user = User(
            name=old_user[2],  # username из старой БД
            password=old_user[3],  # уже захеширован
            role_id=user_role.id
        )
        db.add(new_user)
    
    db.commit()
    print("✓ Данные успешно импортированы")
except Exception as e:
    print(f"✗ Ошибка при импорте: {e}")
    db.rollback()
finally:
    db.close()

# Запустите скрипт
python import_to_new_db.py
```

## Шаг 4: Проверка

### Проверьте таблицы

```bash
# Windows PowerShell
sqlite3 app.db ".tables"

# Output должен быть:
# categories       goods            goods_baskets    permissions      
# reservations     restaurants      role_permissions roles             
# tables           users            baskets
```

### Проверьте структуру

```bash
sqlite3 app.db ".schema users"
sqlite3 app.db ".schema roles"
sqlite3 app.db ".schema goods"
```

## Шаг 5: Тестирование API

### 1. Получить роли
```bash
curl http://localhost:8000/api/roles
```

### 2. Создать категорию
```bash
curl -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Category"}'
```

### 3. Создать товар
```bash
curl -X POST http://localhost:8000/api/goods \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "code": "TEST-001",
    "category_id": 1
  }'
```

### 4. Зарегистрировать пользователя
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "testuser",
    "password": "password123",
    "role_id": 1
  }'
```

### 5. Получить корзину пользователя
```bash
curl http://localhost:8000/api/baskets/user/1
```

## 🔍 Диагностика проблем

### Проблема: "table users already exists"

**Решение:**
```bash
rm app.db
# или
del app.db  (Windows)
```

Затем перезапустите сервер.

### Проблема: "no such table"

**Проверьте:**
1. Что сервер запущен и инициализировал БД
2. Что вы используете обновленный `models.py`
3. Проверьте логи сервера на ошибки

### Проблема: импорт не работает

**Убедитесь:**
1. Файлы лежат в папке `backend/`
2. Все зависимости установлены (`pip install -r requirements.txt`)
3. Используется Python 3.10+

## ✅ Чек-лист миграции

- [ ] Создана резервная копия старой БД (`app.db.backup`)
- [ ] Все новые файлы скачаны/обновлены
- [ ] Файлы переименованы (auth_new.py → auth.py, etc.)
- [ ] Старая БД удалена (`app.db`)
- [ ] Сервер запущен и инициализировал БД
- [ ] Проверены таблицы через sqlite3
- [ ] Протестированы API endpoints
- [ ] Разрешения и роли созданы автоматически
- [ ] Старые endpoints все еще работают (для совместимости)

## 📊 Сравнение структур

### v1.x (Старая)
```
users (email, username, hashed_password, full_name, phone, role: string)
├─ reservations
├─ restaurants
└─ tables
```

### v2.0 (Новая)
```
permissions + role_permissions
├─ roles
│   └─ users (name, password, role_id)
│       └─ baskets
│           └─ goods_baskets → goods
│
categories
└─ goods
    └─ goods_baskets → baskets

(+ старые таблицы для совместимости)
```

## 🚀 После миграции

### Обновите фронтенд

Если у вас есть фронтенд, обновите:
1. API URLs (если изменились)
2. Структуру данных пользователя (теперь `name` вместо `email`/`username`)
3. Хранение роли (теперь `role_id` вместо строки `role`)

### Примеры фронтенда (JavaScript)

**Старое:**
```javascript
const user = {
  email: "user@example.com",
  username: "username",
  role: "user"
}
```

**Новое:**
```javascript
const user = {
  name: "username",
  role_id: 1,
  registration_date: "2026-02-26T..."
}
```

## 📞 Если что-то пошло не так

1. Восстановите из резервной копии:
   ```bash
   move app.db app.db.broken
   move app.db.backup app.db
   ```

2. Попробуйте снова со своей экспортированной копией

3. Если только новые таблицы нужны, удалите БД и начните заново

## 📝 Документация

После успешной миграции прочитайте:
- [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md) - Структура новой БД
- [README.md](README.md) - Основная документация
- Документация API в Swagger UI: http://localhost:8000/docs

