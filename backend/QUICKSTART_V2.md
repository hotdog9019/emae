# ⚡ Быстрый старт с новой БД (v2.0)

## 🚀 За 5 минут

### 1️⃣ Подготовка

```bash
# Перейдите в папку backend
cd backend

# Установите зависимости (если еще не установлены)
pip install -r requirements.txt
```

### 2️⃣ Замена файлов

```bash
# Переименуйте файлы
move auth_new.py auth.py
move main_new.py main.py
```

**ВАЖНО:** Сначала удалите старую БД, если хотите чистую установку:
```bash
del app.db
```

### 3️⃣ Запуск сервера

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 4️⃣ Проверка

Откройте в браузере:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **API Root**: http://localhost:8000/

## 📝 Основные операции

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
    "name": "Ноутбук Dell",
    "code": "DELL-XPS-13",
    "category_id": 1
  }'
```

### Регистрация пользователя

```bash
# Сначала получите ID роли "user"
# GET http://localhost:8000/api/roles
# Обычно это ID = 1

curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "john_doe",
    "password": "secure_pass",
    "role_id": 1
  }'
```

### Вход пользователя

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "name": "john_doe",
    "password": "secure_pass"
  }'
```

### Работа с корзиной

```bash
# Получить корзину пользователя
curl http://localhost:8000/api/baskets/user/1

# Добавить товар в корзину
curl -X POST http://localhost:8000/api/baskets/1/items \
  -H "Content-Type: application/json" \
  -d '{"goods_id": 1, "count": 2}'

# Просмотреть товары в корзине
curl http://localhost:8000/api/baskets/1/items

# Обновить количество
curl -X PUT http://localhost:8000/api/baskets/1/items/1 \
  -H "Content-Type: application/json" \
  -d '{"count": 5}'

# Удалить товар из корзины
curl -X DELETE http://localhost:8000/api/baskets/1/items/1
```

## 📊 Встроенные роли

При первом запуске автоматически создаются:

| Роль | Разрешения | ID |
|------|-----------|-----|
| **user** | view_goods | 1 |
| **moderator** | view_goods, edit_goods, view_orders, edit_orders | 2 |
| **admin** | все разрешения | 3 |

## 🔑 Структура User в новой БД

```json
{
  "id": 1,
  "name": "john_doe",
  "role_id": 1,
  "registration_date": "2026-02-26T10:30:00"
}
```

**Отличия от старой версии:**
- ❌ Нет `email` и `username` - используется только `name`
- ❌ Нет `full_name` и `phone` - упрощено
- ❌ Пароль хранится как `password` вместо `hashed_password`
- ✅ Есть `role_id` (FK) вместо `role` (строка)
- ✅ Есть `registration_date` вместо `created_at`

## 🛠️ Структура данных товара

```json
{
  "id": 1,
  "name": "Ноутбук",
  "code": "LAPTOP-001",
  "category_id": 1,
  "import_date": "2026-02-26T10:30:00",
  "finish_date": null,
  "category": {
    "id": 1,
    "name": "Электроника"
  }
}
```

## 🛒 Структура корзины

```json
{
  "id": 1,
  "user_id": 1,
  "goods_items": [
    {
      "goods_id": 1,
      "basket_id": 1,
      "count": 2,
      "goods": {
        "id": 1,
        "name": "Ноутбук",
        "code": "LAPTOP-001",
        ...
      }
    }
  ]
}
```

## 📚 Полная документация

Для детальной информации смотрите:
- [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md) - Полная структура БД
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Подробная миграция
- [README.md](README.md) - Общая информация

## ⚠️ Важные замечания

1. **Корзина создается автоматически** при регистрации пользователя
2. **Роли создаются автоматически** при первом запуске сервера
3. **Старые endpoints сохранены** для совместимости (reservations, restaurants)
4. **Данные v1.x не мигрируют автоматически** - экспортируйте вручную

## 🔗 Новые API endpoints

| Группа | Count |
|--------|-------|
| Разрешения | 5 endpoints |
| Роли | 7 endpoints |
| Аутентификация | 4 endpoints |
| Категории | 5 endpoints |
| Товары | 6 endpoints |
| Корзины | 8 endpoints |
| **Всего** | **35 endpoints** |

## ✅ Проверка

Если все работает, вы должны увидеть:

```bash
# GET http://localhost:8000/health
{
  "status": "ok"
}

# GET http://localhost:8000/
{
  "message": "Добро пожаловать в E-Commerce & Restaurant API",
  "version": "2.0.0"
}
```

## 🎉 Готово!

Теперь вы можете использовать новую версию API с:
- ✅ Управлением ролями и разрешениями
- ✅ Системой товаров с категориями
- ✅ Корзиной покупателя
- ✅ Совместимостью со старыми endpoints

Для более детальной информации смотрите документацию!
