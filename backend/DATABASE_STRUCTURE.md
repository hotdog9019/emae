# 📊 Новая структура базы данных

## 🏗️ Архитектура БД (v2.0)

База данных была полностью переработана и теперь состоит из двух основных веток:

### Ветвь 1: Управление пользователями и ролями

```
Permission (разрешения)
├─ id (PRIMARY KEY)
└─ name (UNIQUE)

Role (роли)
├─ id (PRIMARY KEY)
├─ name (UNIQUE)
└─ permissions (M2M: role_permissions)

User (пользователи)
├─ id (PRIMARY KEY)
├─ name (UNIQUE)
├─ password (hashed)
├─ role_id (FK → Role)
└─ registration_date

Basket (корзины)
├─ id (PRIMARY KEY)
├─ user_id (FK → User, UNIQUE)
└─ goods_items (1→M: GoodsBasket)
```

### Ветвь 2: Управление товарами

```
Category (категории)
├─ id (PRIMARY KEY)
├─ name (UNIQUE)
└─ goods (1→M: Goods)

Goods (товары)
├─ id (PRIMARY KEY)
├─ name
├─ code (UNIQUE)
├─ category_id (FK → Category)
├─ import_date
├─ finish_date
└─ basket_items (M2M: GoodsBasket)

GoodsBasket (товары в корзине)
├─ goods_id (PK, FK → Goods)
├─ basket_id (PK, FK → Basket)
└─ count
```

## 📋 Таблицы и поля

### 1. permissions
```sql
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL
);
```

**Примеры разрешений:**
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

### 2. roles
```sql
CREATE TABLE roles (
    id INTEGER PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL
);
```

**Встроенные роли:**
- **user** - базовый пользователь (может просматривать товары)
- **moderator** - может редактировать товары и заказы
- **admin** - полный доступ

### 3. role_permissions (M2M)
```sql
CREATE TABLE role_permissions (
    role_id INTEGER PRIMARY KEY FK,
    permission_id INTEGER PRIMARY KEY FK
);
```

### 4. users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    role_id INTEGER NOT NULL FK,
    registration_date TIMESTAMP DEFAULT NOW()
);
```

### 5. baskets
```sql
CREATE TABLE baskets (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE FK
);
```

### 6. categories
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL
);
```

### 7. goods
```sql
CREATE TABLE goods (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    code VARCHAR UNIQUE NOT NULL,
    category_id INTEGER NOT NULL FK,
    import_date TIMESTAMP DEFAULT NOW(),
    finish_date TIMESTAMP NULL
);
```

### 8. goods_baskets
```sql
CREATE TABLE goods_baskets (
    goods_id INTEGER PRIMARY KEY FK,
    basket_id INTEGER PRIMARY KEY FK,
    count INTEGER DEFAULT 1 NOT NULL
);
```

### 9. reservations (старая система, для совместимости)
```sql
CREATE TABLE reservations (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    date VARCHAR NOT NULL,
    time VARCHAR NOT NULL,
    guests INTEGER NOT NULL,
    special_requests TEXT NULL,
    is_confirmed BOOLEAN DEFAULT FALSE,
    restaurant_id INTEGER NULL,
    table_id INTEGER NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 10. restaurants (старая система, для совместимости)
```sql
CREATE TABLE restaurants (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    address VARCHAR NOT NULL,
    phone VARCHAR NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 11. tables (старая система, для совместимости)
```sql
CREATE TABLE tables (
    id INTEGER PRIMARY KEY,
    restaurant_id INTEGER NOT NULL FK,
    name VARCHAR NOT NULL,
    seats INTEGER NOT NULL DEFAULT 2,
    x INTEGER NULL,
    y INTEGER NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔗 Отношения между таблицами

```
Permission ←→ Role (M2M через role_permissions)
     ↑
     └─ Управление разрешениями ролей

Role ←→ User (1→M)
     ├─ У каждого пользователя одна роль
     └─ Роль определяет разрешения

User ←→ Basket (1→1)
     └─ У каждого пользователя одна корзина

Basket ←→ GoodsBasket (1→M)
     └─ Корзина содержит товары

Goods ←→ GoodsBasket (1→M)
     └─ Товар может быть в нескольких корзинах

Category ←→ Goods (1→M)
     └─ Товары принадлежат категориям
```

## 📊 Диаграмма структуры

```
┌──────────────┐         ┌──────────────┐
│ Permission   │────┬────│ role_permis  │
│ (id, name)   │    │    │ (role_id PK, │
└──────────────┘    │    │  perm_id PK) │
                    │    └──────────────┘
                    │         ↑
┌──────────────┐    │    ┌──────────────┐
│ Role         │────┴────│ Роль имеет   │
│ (id, name)   │         │ разрешения   │
└──────┬───────┘         └──────────────┘
       │ (1→M)
       │
┌──────▼───────┐    ┌──────────────┐         ┌────────────┐
│ User         │───→│ Basket       │────┬───→│ GoodsBasket│
│ (id, name,   │ 1→1│ (id,         │ 1→M│    │ (goods_id, │
│  password,   │    │  user_id)    │    │    │  basket_id,│
│  role_id,    │    └──────────────┘    │    │  count)    │
│  reg_date)   │                        │    └────┬───────┘
└──────────────┘                        │         │
                                        │    (M→1)│
┌──────────────┐                        │    ┌────▼────────┐
│ Category     │                        └───→│ Goods       │
│ (id, name)   │                             │ (id, name,  │
└──────┬───────┘                             │  code,      │
       │ (1→M)                               │  category,  │
       │                                     │  import_d,  │
┌──────▼───────────┐                        │  finish_d)  │
│ Goods           │                         └─────────────┘
│ (id, name,      │
│  code,          │
│  category_id)   │
└──────────────────┘
```

## 🚀 API Endpoints

### Разрешения (`/api/permissions`)
- POST / - создать разрешение
- GET / - получить все разрешения
- GET /{permission_id} - получить разрешение
- PUT /{permission_id} - обновить разрешение
- DELETE /{permission_id} - удалить разрешение

### Роли (`/api/roles`)
- POST / - создать роль
- GET / - получить все роли
- GET /{role_id} - получить роль
- PUT /{role_id} - обновить роль
- DELETE /{role_id} - удалить роль
- POST /{role_id}/permissions/{permission_id} - добавить разрешение
- DELETE /{role_id}/permissions/{permission_id} - удалить разрешение
- GET /{role_id}/permissions - получить разрешения роли

### Пользователи (Аутентификация)
- POST /api/auth/register - регистрация
- POST /api/auth/login - вход
- GET /api/auth/users - получить всех пользователей
- GET /api/auth/users/{user_id} - получить пользователя
- DELETE /api/auth/users/{user_id} - удалить пользователя

### Категории (`/api/categories`)
- POST / - создать категорию
- GET / - получить все категории
- GET /{category_id} - получить категорию
- PUT /{category_id} - обновить категорию
- DELETE /{category_id} - удалить категорию

### Товары (`/api/goods`)
- POST / - создать товар
- GET / - получить все товары
- GET /{goods_id} - получить товар
- GET /by-code/{code} - получить товар по коду
- GET /category/{category_id} - получить товары категории
- PUT /{goods_id} - обновить товар
- DELETE /{goods_id} - удалить товар

### Корзины (`/api/baskets`)
- POST / - создать корзину
- GET /{basket_id} - получить корзину
- GET /user/{user_id} - получить корзину пользователя
- DELETE /{basket_id} - удалить корзину
- POST /{basket_id}/items - добавить товар в корзину
- GET /{basket_id}/items - получить товары корзины
- PUT /{basket_id}/items/{goods_id} - обновить кол-во товара
- DELETE /{basket_id}/items/{goods_id} - удалить товар из корзины
- DELETE /{basket_id}/clear - очистить корзину

## 📝 Примеры использования

### 1. Создание роли и разрешений

```bash
# Создать разрешение
curl -X POST http://localhost:8000/api/permissions \
  -H "Content-Type: application/json" \
  -d '{"name": "view_goods"}'

# Создать роль
curl -X POST http://localhost:8000/api/roles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "user",
    "permission_ids": [1]
  }'
```

### 2. Регистрация пользователя

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "john_doe",
    "password": "secure_password",
    "role_id": 1
  }'
```

### 3. Создание категории и товара

```bash
# Создать категорию
curl -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Электроника"}'

# Создать товар
curl -X POST http://localhost:8000/api/goods \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ноутбук",
    "code": "LAPTOP-001",
    "category_id": 1
  }'
```

### 4. Работа с корзиной

```bash
# Создать корзину для пользователя
curl -X POST http://localhost:8000/api/baskets \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}'

# Добавить товар в корзину
curl -X POST http://localhost:8000/api/baskets/1/items \
  -H "Content-Type: application/json" \
  -d '{
    "goods_id": 1,
    "count": 2
  }'

# Получить товары в корзине
curl -X GET http://localhost:8000/api/baskets/1/items

# Обновить количество товара
curl -X PUT http://localhost:8000/api/baskets/1/items/1 \
  -H "Content-Type: application/json" \
  -d '{"count": 3}'

# Удалить товар из корзины
curl -X DELETE http://localhost:8000/api/baskets/1/items/1
```

## 🔄 Миграция со старой БД

Если у вас есть старая БД, новые таблицы будут созданы автоматически при первом запуске приложения. Старые таблицы (reservations, restaurants, tables) остаются для обратной совместимости.

### Инструкции:
1. Создайте резервную копию `app.db`
2. Удалите старый файл `app.db`
3. Запустите приложение - будут созданы новые таблицы
4. Роли и разрешения создадутся автоматически

## 📊 Статистика

| Таблица | Назначение | Состояние |
|---------|-----------|----------|
| permissions | Разрешения | ✅ Новая |
| roles | Роли | ✅ Новая |
| role_permissions | Связь роли-разрешения | ✅ Новая |
| users | Пользователи (переделана) | ✅ Обновлена |
| baskets | Корзины | ✅ Новая |
| categories | Категории | ✅ Новая |
| goods | Товары | ✅ Новая |
| goods_baskets | Товары в корзине | ✅ Новая |
| reservations | Бронирования | ⚠️ Старая (совместимость) |
| restaurants | Рестораны | ⚠️ Старая (совместимость) |
| tables | Столы | ⚠️ Старая (совместимость) |

**Итого:** 11 таблиц (8 новых + 3 старых для совместимости)

