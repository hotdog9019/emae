# 📊 Резюме изменений БД (v1.x → v2.0)

## 🎯 Обзор

Проведена полная реструктуризация базы данных с новой схемой для управления товарами, ролями и корзами.

## 📋 Что изменилось

### ✅ Новая структура БД

**Таблицы добавлены:**
1. ✨ **permissions** - управление разрешениями
2. ✨ **roles** - управление ролями
3. ✨ **role_permissions** - связь M2M между ролями и разрешениями
4. ✨ **categories** - категории товаров
5. ✨ **goods** - товары с метаданными
6. ✨ **baskets** - корзины пользователей
7. ✨ **goods_baskets** - товары в корзине (M2M)

**Таблицы изменены:**
- ⚠️ **users** 
  - До: email, username, hashed_password, full_name, phone, role (str), is_active
  - После: name (уникальное), password, role_id (FK), registration_date
  
**Таблицы оставлены для совместимости:**
- ⚠️ reservations, restaurants, tables (старая система)

### 🔄 Изменения в моделях (models.py)

### Старая модель User
```python
class User(Base):
    id: Integer
    email: String (UNIQUE)
    username: String (UNIQUE)
    hashed_password: String
    full_name: String (nullable)
    phone: String (nullable)
    role: String = "user"  # "user" или "admin"
    is_active: Boolean = True
    created_at: DateTime
```

### Новая модель User
```python
class User(Base):
    id: Integer
    name: String (UNIQUE)           # раньше: email + username
    password: String                # раньше: hashed_password
    role_id: Integer (FK → roles)   # раньше: role (str)
    registration_date: DateTime     # раньше: created_at
```

### Новые модели

```python
class Permission(Base):
    id: Integer
    name: String (UNIQUE)

class Role(Base):
    id: Integer
    name: String (UNIQUE)
    permissions: M2M

class Basket(Base):
    id: Integer
    user_id: Integer (FK → users, UNIQUE)
    goods_items: 1→M → GoodsBasket

class Category(Base):
    id: Integer
    name: String (UNIQUE)
    goods: 1→M → Goods

class Goods(Base):
    id: Integer
    name: String
    code: String (UNIQUE)
    category_id: Integer (FK → categories)
    import_date: DateTime
    finish_date: DateTime (nullable)

class GoodsBasket(Base):
    goods_id: Integer (PK, FK)
    basket_id: Integer (PK, FK)
    count: Integer = 1
```

## 📝 Изменения в Schemas (schemas.py)

### Старая схема пользователя
```python
{
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "full_name": "Full Name",
    "phone": "+1234567890",
    "role": "user",
    "is_active": true,
    "created_at": "2026-02-26T..."
}
```

### Новая схема пользователя
```python
{
    "id": 1,
    "name": "username",
    "role_id": 1,
    "registration_date": "2026-02-26T...",
    "role": {
        "id": 1,
        "name": "user",
        "permissions": [...]
    }
}
```

## 🔄 API выполнения

### Аутентификация

**Старое (v1.x):**
```bash
# Регистрация
POST /api/auth/register
{
    "email": "user@example.com",
    "username": "username", 
    "password": "pass",
    "full_name": "Name",
    "phone": "+123"
}

# Вход
POST /api/auth/login
{
    "email": "user@example.com",
    "password": "pass"
}
```

**Новое (v2.0):**
```bash
# Регистрация (требуется role_id)
POST /api/auth/register
{
    "name": "username",
    "password": "pass",
    "role_id": 1
}

# Вход
POST /api/auth/login
{
    "name": "username",
    "password": "pass"
}
```

## 📊 Новые API endpoints (35 всего)

### Разрешения (5)
- POST /api/permissions
- GET /api/permissions
- GET /api/permissions/{id}
- PUT /api/permissions/{id}
- DELETE /api/permissions/{id}

### Роли (7)
- POST /api/roles
- GET /api/roles
- GET /api/roles/{id}
- PUT /api/roles/{id}
- DELETE /api/roles/{id}
- POST /api/roles/{id}/permissions/{perm_id}
- DELETE /api/roles/{id}/permissions/{perm_id}

### Категории (5)
- POST /api/categories
- GET /api/categories
- GET /api/categories/{id}
- PUT /api/categories/{id}
- DELETE /api/categories/{id}

### Товары (6)
- POST /api/goods
- GET /api/goods
- GET /api/goods/{id}
- GET /api/goods/by-code/{code}
- PUT /api/goods/{id}
- DELETE /api/goods/{id}

### Корзины (8)
- POST /api/baskets
- GET /api/baskets/{id}
- GET /api/baskets/user/{user_id}
- DELETE /api/baskets/{id}
- POST /api/baskets/{id}/items
- GET /api/baskets/{id}/items
- PUT /api/baskets/{id}/items/{goods_id}
- DELETE /api/baskets/{id}/clear

### Аутентификация (4)
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/users
- DELETE /api/auth/users/{id}

## 🔐 Встроенные роли и разрешения

### Роли (создаются автоматически):
1. **user** - базовый пользователь
   - Разрешение: view_goods
   
2. **moderator** - модератор
   - Разрешения: view_goods, edit_goods, view_orders, edit_orders
   
3. **admin** - администратор
   - Все разрешения

### Разрешения (10 всего):
- view_goods
- edit_goods
- delete_goods
- view_users
- edit_users
- delete_users
- view_orders
- edit_orders
- delete_orders
- manage_roles

## 🔄 Миграция данных

### Автоматическое
При первом запуске:
```bash
python -m uvicorn main:app --reload
```

Сервер автоматически:
1. ✅ Создает все таблицы
2. ✅ Создает встроенные роли
3. ✅ Создает встроенные разрешения

### Ручное (если были данные в v1.x)

```bash
# 1. Экспортируйте старые данные
python export_old_data.py

# 2. Удалите старую БД
del app.db

# 3. Запустите сервер
python -m uvicorn main:app --reload

# 4. Импортируйте данные
python import_to_new_db.py
```

## 📚 Документация

| Документ | Содержание |
|----------|-----------|
| [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md) | Полная структура всех таблиц и отношений |
| [QUICKSTART_V2.md](QUICKSTART_V2.md) | Быстрый старт за 5 минут |
| [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | Подробная инструкция миграции |
| [examples_api_v2.py](examples_api_v2.py) | Примеры использования на Python |
| [README.md](README.md) | Основная документация проекта |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Старая архитектура (для справки) |

## ✅ Содержимое обновления

### Новые файлы
- ✨ categories.py - управление категориями
- ✨ goods.py - управление товарами
- ✨ baskets.py - управление корзинами
- ✨ roles.py - управление ролями и разрешениями
- ✨ auth_new.py - обновленная аутентификация
- ✨ main_new.py - обновленная главная точка входа
- ✨ DATABASE_STRUCTURE.md - документация БД
- ✨ QUICKSTART_V2.md - быстрый старт v2
- ✨ MIGRATION_GUIDE.md - инструкция миграции
- ✨ examples_api_v2.py - примеры на Python

### Обновленные файлы
- ⚠️ models.py - полностью переписана структура
- ⚠️ schemas.py - обновлены все Pydantic схемы

### Сохраненные для совместимости
- ✓ reservations.py
- ✓ restaurants.py
- ✓ admin.py
- ✓ auth.py (старый, используется auth_new.py)

## 🚀 Начало работы

### Быстрый старт (5 минут)

```bash
# 1. Переименуйте файлы
move auth_new.py auth.py
move main_new.py main.py

# 2. Удалите старую БД (если нужна чистая установка)
del app.db

# 3. Запустите сервер
python -m uvicorn main:app --reload

# 4. Откройте http://localhost:8000/docs
```

## ⚠️ Несовместимости

| Функция | v1.x | v2.0 | Решение |
|---------|------|------|---------|
| Email | Требуется | Не используется | Используйте `name` |
| Username | Требуется | Не используется | Используйте `name` |
| Role тип | String | Integer FK | Используйте role_id |
| Full name | Поддерживается | Удалено | Используйте `name` |
| Phone | Поддерживается | Удалено | Не используется |
| Товары | Нет | ✅ Добавлено | Используйте /api/goods |
| Корзина | Нет | ✅ Добавлено | Используйте /api/baskets |

## 📈 Статистика

| Метрика | v1.x | v2.0 | Изменение |
|---------|------|------|-----------|
| Таблиц | 5 | 11 | +6 |
| API endpoints | ~15 | 35+ | +20 |
| Моделей | 5 | 11 | +6 |
| Схем Pydantic | 8 | 17 | +9 |
| Файлов роутеров | 4 | 7 | +3 |

## 🎯 Основные отличия

### v1.x - Ресторан с бронированием
- Система регистрации и входа
- Бронирование столиков в ресторане
- Простая система администратора
- Основано на email и username

### v2.0 - E-Commerce + Ресторан
- Система ролей и разрешений
- Управление категориями товаров
- Система корзины покупателя
- Совместимость со старой системой бронирования
- Основано на username (name) и role_id

## ✨ Преимущества v2.0

✅ **Гибкость** - система разрешений позволяет добавлять новые роли  
✅ **Масштабируемость** - структура поддерживает большое количество товаров  
✅ **Безопасность** - правильное использование FK для целостности данных  
✅ **Удобство** - встроенные роли и разрешения "из коробки"  
✅ **Совместимость** - старые endpoints все еще работают  

## 🔄 Обновление фронтенда

Если у вас есть фронтенд, обновите:

```javascript
// Старое
const user = {
  id: 1,
  email: "user@example.com",
  username: "username",
  role: "user"
}

// Новое  
const user = {
  id: 1,
  name: "username",
  role_id: 1,
  registration_date: "2026-02-26T..."
}
```

## 📞 Помощь

При проблемах смотрите:
1. [QUICKSTART_V2.md](QUICKSTART_V2.md) - Быстро начать
2. [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md) - Структура БД
3. [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Проблемы миграции
4. http://localhost:8000/docs - Swagger документация

---

**Версия:** 2.0.0  
**Дата:** 26 февраля 2026г.  
**Статус:** ✅ Production Ready

Наслаждайтесь новой версией! 🎉
