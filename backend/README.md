# Restaurant Backend API

Backend REST API для ресторана, построенный на FastAPI с поддержкой:
- Регистрации и аутентификации пользователей
- Бронирования столиков
- **Системы ролей администратора для управления заказами и пользователями**
- Хранения данных в SQLite BД

## Установка

### Требования
- Python 3.10+
- pip

### Шаги установки

1. Создание виртуального окружения:
```bash
python -m venv venv
```

2. Активация виртуального окружения:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. Установка зависимостей:
```bash
pip install -r requirements.txt
```

## Запуск сервера

### Windows
Просто запустите:
```bash
run.bat
```

Или в терминале (рекомендуемый порт для разработки — 8001):
```powershell
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

### macOS/Linux
```bash
./run.sh
```

По умолчанию сервер ранее запускался на `http://localhost:8000`, но если порт занят — запустите на 8001 как выше.

## Система администратора

После установки создайте администратора:

```bash
python scripts/create_admin.py
```

Администратор может управлять:
- **Заказами пользователей** - получать, редактировать, удалять
- **Пользователями** - просматривать профили, менять роли, удалять

Полную документацию см. в файле [ADMIN_SYSTEM.md](ADMIN_SYSTEM.md)

## Документация API

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## API Endpoints

### Аутентификация

#### Регистрация
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+1234567890"
}
```

**Ответ (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "is_active": true,
  "created_at": "2026-02-24T10:30:00"
}
```

#### Вход
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Ответ (200):** Данные пользователя (как выше)

#### Получить пользователя
```
GET /api/auth/users/{user_id}
```

#### Получить всех пользователей
```
GET /api/auth/users
```

### Бронирования

#### Создать бронирование
```
POST /api/reservations/?user_id=1
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "+1234567890",
  "date": "2026-03-01",
  "time": "19:00",
  "guests": 4,
  "special_requests": "Window seat please"
}
```

**Ответ (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "email": "user@example.com",
  "phone": "+1234567890",
  "date": "2026-03-01",
  "time": "19:00",
  "guests": 4,
  "special_requests": "Window seat please",
  "is_confirmed": false,
  "created_at": "2026-02-24T10:30:00"
}
```

#### Получить бронирование
```
GET /api/reservations/{reservation_id}
```

#### Получить бронирования пользователя
```
GET /api/reservations/user/{user_id}
```

#### Получить все бронирования
```
GET /api/reservations/
```

#### Обновить бронирование
```
PUT /api/reservations/{reservation_id}
Content-Type: application/json

{
  "date": "2026-03-02",
  "time": "20:00",
  "guests": 3,
  "is_confirmed": true
}
```

#### Удалить бронирование
```
DELETE /api/reservations/{reservation_id}
```

### Администрирование ⚙️

**Требуется роль администратора**. Все операции требуют параметра `admin_id`.

#### Получить все заказы (админ)
```
GET /api/admin/reservations?admin_id=1
```

#### Получить заказы пользователя (админ)
```
GET /api/admin/reservations/user/{user_id}?admin_id=1
```

#### Обновить заказ (админ)
```
PUT /api/admin/reservations/{reservation_id}?admin_id=1
```

#### Удалить заказ (админ)
```
DELETE /api/admin/reservations/{reservation_id}?admin_id=1
```

#### Получить всех пользователей (админ)
```
GET /api/admin/users?admin_id=1
```

#### Изменить роль пользователя (админ)
```
POST /api/admin/users/{user_id}/role/{role}?admin_id=1
```
Где `{role}` это `user` или `admin`

#### Удалить пользователя (админ)
```
DELETE /api/admin/users/{user_id}?admin_id=1
```

Для полной документации см. [ADMIN_SYSTEM.md](ADMIN_SYSTEM.md)

## Структура проекта

```
backend/
├── main.py              # Главное приложение FastAPI
├── database.py          # Конфигурация БД
├── models.py            # SQLAlchemy модели
├── schemas.py           # Pydantic схемы валидации
├── auth.py              # Маршруты аутентификации
├── reservations.py      # Маршруты бронирований
├── utils.py             # Утилиты (хеширование паролей)
├── requirements.txt     # Python зависимости
├── run.bat              # Скрипт запуска (Windows)
├── run.sh               # Скрипт запуска (macOS/Linux)
└── app.db               # SQLite база данных (создается автоматически)
```

## Используемые технологии

- **FastAPI** - веб-фреймворк
- **Uvicorn** - ASGI сервер
- **SQLAlchemy** - ORM
- **Pydantic** - валидация данных
- **Passlib + Bcrypt** - хеширование паролей
- **SQLite** - база данных

## Разработка

Сервер запущен с опцией `reload=True`, поэтому произойдет автоматическая перезагрузка при изменении файлов.

## Безопасность

⚠️ **Важно для продакшена:**
1. Установите CORS на конкретные домены вместо `"*"`
2. Добавьте аутентификацию токенами (JWT)
3. Используйте переменные окружения для конфигурации
4. Используйте PostgreSQL вместо SQLite
5. Добавьте валидацию и лимит на количество запросов

## Лицензия

MIT
