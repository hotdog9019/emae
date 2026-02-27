# Система роли администратора

## Описание

Добавлена система роли администратора, которая позволяет управлять заказами и пользователями других пользователей в системе.

## Структура изменений

### 1. Модель User (`models.py`)
- Добавлено поле `role` со значениями: `"user"` (по умолчанию) или `"admin"`

### 2. Схемы Pydantic (`schemas.py`)
- `UserRegister`: добавлено поле `role` с значением по умолчанию `"user"`
- `UserResponse`: добавлено поле `role`
- `UserUpdate`: новая схема для обновления профиля пользователя администратором

### 3. Аутентификация (`auth.py`)
- Обновлено создание пользователя с сохранением роли

### 4. Администрирование (`admin.py`)
- Полностью переработан модуль с функциями проверки прав администратора
- Добавлены CRUD операции для управления заказами
- Добавлены CRUD операции для управления пользователями

### 5. Лямбды создания администратора
- `scripts/create_admin.py` - интерактивный скрипт для создания/назначения администратора

## Использование

### Создание администратора

```bash
# В корне проекта backend
python scripts/create_admin.py
```

Скрипт предложит возможность:
1. Назначить существующему пользователю роль администратора
2. Создать нового администратора с нуля

### API Endpoints

Все admin endpoints требуют параметр `admin_id` (ID авторизованного администратора)

#### Управление заказами (Reservations)

#####获取все заказы
```
GET /api/admin/reservations?admin_id=1
```
Ответ: список всех заказов в системе

##### Получить заказы конкретного пользователя
```
GET /api/admin/reservations/user/{user_id}?admin_id=1
```

##### Получить заказ по ID
```
GET /api/admin/reservations/{reservation_id}?admin_id=1
```

##### Обновить заказ
```
PUT /api/admin/reservations/{reservation_id}?admin_id=1
Content-Type: application/json

{
  "date": "2024-03-15",
  "time": "19:00",
  "guests": 4,
  "is_confirmed": true
}
```

##### Удалить заказ
```
DELETE /api/admin/reservations/{reservation_id}?admin_id=1
```

##### Удалить все заказы пользователя
```
DELETE /api/admin/reservations/user/{user_id}?admin_id=1
```

#### Управление пользователями

##### Получить всех пользователей
```
GET /api/admin/users?admin_id=1
```
Ответ: список всех пользователей с их ролями

##### Получить пользователя по ID
```
GET /api/admin/users/{user_id}?admin_id=1
```

##### Обновить профиль пользователя
```
PUT /api/admin/users/{user_id}?admin_id=1
Content-Type: application/json

{
  "email": "newemail@example.com",
  "full_name": "Новое имя",
  "is_active": true
}
```

##### Назначить роль пользователю
```
POST /api/admin/users/{user_id}/role/{role}?admin_id=1
```
Где `{role}` это `user` или `admin`

Ответ:
```json
{
  "message": "Роль пользователя изменена на admin",
  "user": {
    "id": 2,
    "email": "user@example.com",
    "role": "admin",
    ...
  }
}
```

##### Удалить пользователя (и все его заказы)
```
DELETE /api/admin/users/{user_id}?admin_id=1
```

### Примеры использования с cURL

#### 1. Создать администратора
```bash
python backend/scripts/create_admin.py
```

#### 2. Получить всех пользователей (как админ)
```bash
curl -X GET "http://localhost:8000/api/admin/users?admin_id=1" \
  -H "accept: application/json"
```

#### 3. Получить все заказы (как админ)
```bash
curl -X GET "http://localhost:8000/api/admin/reservations?admin_id=1" \
  -H "accept: application/json"
```

#### 4. Обновить заказ (как админ)
```bash
curl -X PUT "http://localhost:8000/api/admin/reservations/5?admin_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "guests": 5,
    "is_confirmed": true
  }'
```

#### 5. Удалить заказ (как админ)
```bash
curl -X DELETE "http://localhost:8000/api/admin/reservations/5?admin_id=1"
```

#### 6. Назначить администратора другому пользователю
```bash
curl -X POST "http://localhost:8000/api/admin/users/3/role/admin?admin_id=1" \
  -H "accept: application/json"
```

#### 7. Получить заказы конкретного пользователя (как админ)
```bash
curl -X GET "http://localhost:8000/api/admin/reservations/user/2?admin_id=1" \
  -H "accept: application/json"
```

## Безопасность

- **Проверка ролей**: Все admin endpoints проверяют, что текущий пользователь имеет роль `admin`
- **Параметр admin_id**: Должен быть ID авторизованного администратора
- **Обработка ошибок**: Возвращается HTTP 403 если пользователь не администратор

## Примеры ошибок

### Недостаточно прав
```
HTTP 403 Forbidden
{
  "detail": "Недостаточно прав. Требуется роль администратора"
}
```

### Пользователь не найден
```
HTTP 404 Not Found
{
  "detail": "Пользователь не найден"
}
```

### Заказ не найден
```
HTTP 404 Not Found
{
  "detail": "Заказ не найден"
}
```

## Миграция базы данных

Если вы используете существующую базу данных, нужно добавить колонку `role` к таблице `users`:

```sql
ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'user' NOT NULL;
```

Или при следующем запуске приложение автоматически создаст все таблицы с новой структурой.
