# 📚 Индекс документации v2.0

## 🎯 Начинающим

Прочитайте в этом порядке:

1. **[QUICKSTART_V2.md](QUICKSTART_V2.md)** ⚡ (5 мин)
   - Как быстро запустить новую версию
   - Основные операции
   - Примеры curl запросов

2. **[DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md)** 📊 (15 мин)
   - Полная структура таблиц
   - Отношения между таблицами
   - Примеры SQL
   - Основные API endpoints

3. **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** 🔄 (20 мин) - если у вас есть старые данные
   - Как мигрировать со старой БД
   - Экспорт и импорт данных
   - Решение проблем

4. **[CHANGELOG_V2.md](CHANGELOG_V2.md)** 📝 (10 мин)
   - Что изменилось в v2.0
   - Сравнение старой и новой версий
   - Примеры различий в коде

## 📁 Файлы проекта

### Основные файлы (обновлены)
```
backend/
├── models.py              ✏️ Полностью переопис анная структура
├── schemas.py             ✏️ Новые Pydantic схемы
├── auth_new.py            ✨ Новая аутентификация
├── main_new.py            ✨ Обновленная главная точка входа
```

### Новые маршруты
```
├── categories.py          ✨ Управление категориями
├── goods.py               ✨ Управление товарами
├── baskets.py             ✨ Управление корзинами и товарами в них
└── roles.py               ✨ Управление ролями и разрешениями
```

### Старые маршруты (для совместимости)
```
├── auth.py                ⚠️ Используйте auth_new.py
├── reservations.py        ⚠️ Все еще работает
├── restaurants.py         ⚠️ Все еще работает
├── admin.py               ⚠️ Все еще работает
└── main.py                ⚠️ Используйте main_new.py
```

### Примеры и документация
```
├── examples_api_v2.py     📝 Примеры использования на Python
├── DATABASE_STRUCTURE.md  📊 Структура новой БД
├── QUICKSTART_V2.md       ⚡ Быстрый старт
├── MIGRATION_GUIDE.md     🔄 Инструкция миграции
├── CHANGELOG_V2.md        📋 Список изменений
└── INDEX.md               📚 Старый индекс (документация v1.x)
```

## 🚀 Быстрые действия

### Запустить новую БД (5 минут)
```bash
# 1. Переименуйте
move auth_new.py auth.py
move main_new.py main.py

# 2. Удалите старую БД (опционально)
del app.db

# 3. Запустите
python -m uvicorn main:app --reload
```

### Протестировать примеры
```bash
# Убедитесь, что сервер запущен на http://localhost:8000

# Запустите примеры
python examples_api_v2.py
```

### Посмотреть API документацию
```
# Swagger UI с полной документацией
http://localhost:8000/docs

# ReDoc - альтернативная документация
http://localhost:8000/redoc
```

## 📊 Структура БД на схеме

### Схема таблиц
```
Permissions (разрешения)
    ↓
Role_Permissions (M2M)  ← (← Roles (роли)
    ↑
    └─→ Users (пользователи)
            ↓
        Baskets (корзины)
            ↓
        GoodsBaskets (товары в корзине)
            ↓
    ← ← Goods (товары)
            ↑
        Categories (категории)
```

### Основные отношения
- **Permission ↔ Role** (M2M) - роль имеет разрешения
- **Role → User** (1→M) - пользователь имеет одну роль
- **User ↔ Basket** (1→1) - каждый пользователь имеет одну корзину
- **Basket ↔ Goods** (M2M через GoodsBasket) - товары в корзине
- **Category → Goods** (1→M) - товары принадлежат категории

## 📊 Новые таблицы (8 штук)

| Таблица | Назначение | Ключи |
|---------|-----------|-------|
| permissions | Разрешения системы | id (PK), name (UNIQUE) |
| roles | Роли пользователей | id (PK), name (UNIQUE) |
| role_permissions | Связь ролей и разрешений | role_id (PK, FK), permission_id (PK, FK) |
| categories | Категории товаров | id (PK), name (UNIQUE) |
| goods | Товары | id (PK), code (UNIQUE), category_id (FK) |
| goods_baskets | Товары в корзине | goods_id (PK, FK), basket_id (PK, FK), count |
| baskets | Корзины пользователей | id (PK), user_id (FK, UNIQUE) |
| users (обновлена) | Пользователи | id (PK), name (UNIQUE), role_id (FK) |

## 🔗 API Groups

### Разрешения `/api/permissions`
- POST / - Создать
- GET / - Получить все
- GET /{id} - Получить одно
- PUT /{id} - Обновить
- DELETE /{id} - Удалить

### Роли `/api/roles`
- POST / - Создать
- GET / - Получить все
- GET /{id} - Получить одну
- PUT /{id} - Обновить
- DELETE /{id} - Удалить
- POST /{id}/permissions/{perm_id} - Добавить разрешение
- DELETE /{id}/permissions/{perm_id} - Удалить разрешение

### Категории `/api/categories`
- POST / - Создать
- GET / - Получить все
- GET /{id} - Получить одну
- PUT /{id} - Обновить
- DELETE /{id} - Удалить

### Товары `/api/goods`
- POST / - Создать
- GET / - Получить все
- GET /{id} - Получить один
- GET /by-code/{code} - По коду
- GET /category/{cat_id} - По категории
- PUT /{id} - Обновить
- DELETE /{id} - Удалить

### Корзины `/api/baskets`
- POST / - Создать
- GET /{id} - Получить
- GET /user/{user_id} - Корзина пользователя
- DELETE /{id} - Удалить
- Товары в корзине:
  - POST /{id}/items - Добавить
  - GET /{id}/items - Получить все
  - PUT /{id}/items/{goods_id} - Обновить кол-во
  - DELETE /{id}/items/{goods_id} - Удалить товар
  - DELETE /{id}/clear - Очистить корзину

### Аутентификация `/api/auth`
- POST /register - Регистрация
- POST /login - Вход
- GET /users - Получить всех
- DELETE /users/{id} - Удалить

## 🔄 Встроенные роли

| Название | ID | Разрешения | Назначение |
|----------|----|-----------�в-------|
| user | 1 | view_goods | Обычный пользователь |
| moderator | 2 | view_goods, edit_goods, view_orders, edit_orders | Модератор контента |
| admin | 3 | Все | Администратор системы |

## 📝 Примеры

### Регистрация
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "john_doe",
    "password": "secure_pass",
    "role_id": 1
  }'
```

### Создание категории
```bash
curl -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Электроника"}'
```

### Создание товара
```bash
curl -X POST http://localhost:8000/api/goods \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ноутбук",
    "code": "LAPTOP-001",
    "category_id": 1
  }'
```

### Добавление в корзину
```bash
curl -X POST http://localhost:8000/api/baskets/1/items \
  -H "Content-Type: application/json" \
  -d '{"goods_id": 1, "count": 2}'
```

Для полных примеров смотрите [examples_api_v2.py](examples_api_v2.py)

## 🆚 Версии

### v1.x (Старая)
- Ориентирована на бронирование столиков в ресторане
- Системы пользователя на email/username
- Роль как строка в БД
- 5 таблиц

### v2.0 (Новая) ✨
- Ориентирована на e-commerce + ресторан
- Системы пользователя на username (name)
- Роли с разрешениями через FK
- Управление товарами и корзинами
- 11 таблиц
- 35+ API endpoints

## ✅ Статус

| Компонент | Статус | Примечание |
|-----------|--------|-----------|
| Models | ✅ Готово | Все модели обновлены |
| Schemas | ✅ Готово | Все схемы обновлены |
| Auth | ✅ Готово | auth_new.py готов к использованию |
| Categories | ✅ Готово | Полная CRUD |
| Goods | ✅ Готово | Полная CRUD с поиском |
| Baskets | ✅ Готово | Управление товарами в корзине |
| Roles & Perms | ✅ Готово | Система разрешений |
| Database Init | ✅ Готово | Автоматическое создание и инициализация |
| Документация | ✅ Готово | Полная документация |
| Примеры | ✅ Готово | Python примеры |

## 🔍 Поиск информации

**Что развернуть?** → [QUICKSTART_V2.md](QUICKSTART_V2.md)

**Как устроена БД?** → [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md)

**Как мигрировать данные?** → [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

**Что изменилось?** → [CHANGELOG_V2.md](CHANGELOG_V2.md)

**Примеры кода?** → [examples_api_v2.py](examples_api_v2.py)

**API документация?** → http://localhost:8000/docs

## 📞 Помощь

1. ✅ Проверьте [QUICKSTART_V2.md](QUICKSTART_V2.md)
2. 🔍 Найдите ответ в [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md)
3. 📚 Смотрите примеры в [examples_api_v2.py](examples_api_v2.py)
4. 🐛 Если ошибка миграции - [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
5. 📋 Полный список изменений - [CHANGELOG_V2.md](CHANGELOG_V2.md)

---

## 🎉 Готово к использованию!

Версия 2.0 полностью готова с:
- ✅ Новой структурой БД
- ✅ Системой товаров и корзин
- ✅ Системой ролей и разрешений
- ✅ Полной документацией
- ✅ Примерами использования
- ✅ Совместимостью со старой версией

**Начните с [QUICKSTART_V2.md](QUICKSTART_V2.md)!**

---

**Версия:** 2.0.0  
**Дата обновления:** 26 февраля 2026г.  
**Статус:** ✅ Production Ready

