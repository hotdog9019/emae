# Архитектура системы администратора

## 📐 Общая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                      Клиент (Frontend/Postman)              │
└────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI приложение                       │
│  (main.py)                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ app.include_router(admin.router)                     │   │
│  │ app.include_router(auth.router)                      │   │
│  │ app.include_router(reservations.router)              │   │
│  │ app.include_router(restaurants.router)               │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬──────────────────────────────────┘
                         │
           ┌─────────────┼─────────────┬──────────────┐
           │             │             │              │
           ▼             ▼             ▼              ▼
      ┌────────┐   ┌────────┐   ┌──────────┐  ┌──────────┐
      │ Admin  │   │ Auth   │   │Reservat. │  │Restaurant│
      │ Router │   │ Router │   │ Router   │  │ Router   │
      └────┬───┘   └─────┬──┘   └────┬─────┘  └────┬─────┘
           │             │            │              │
           │  ┌──────────┴────────────┼──────────────┘
           │  │                       │
           ▼  ▼                       ▼
    ┌─────────────────────────────────────┐
    │      get_current_admin()            │
    │  (Проверка роли администратора)     │
    └────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    ✅ Admin        ❌ Access Denied
                   (HTTP 403)
        │
        ▼
    ┌─────────────────────────────────────┐
    │    SQLAlchemy ORM операции          │
    │  (Query/Update/Delete)              │
    └────────────┬────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────┐
    │        SQLite Database              │
    │ ┌──────────┐  ┌──────────┐         │
    │ │  Users   │  │Reserv.   │         │
    │ │ (+ role) │  │          │         │
    │ └──────────┘  └──────────┘         │
    └─────────────────────────────────────┘
```

## 🔄 Поток данных при запросе администратора

```
1. Клиент отправляет запрос
   GET /api/admin/reservations?admin_id=1
   │
   ▼
2. FastAPI маршрут получает параметр
   admin_id = 1
   │
   ▼
3. Вызывается get_current_admin(admin_id, db)
   │
   ├─→ db.query(User).filter(User.id == 1).first()
   │   │
   │   ├─ Если не найден: ❌ HTTP 404
   │   │
   │   ▼
   │   ├─ if user.role != "admin": ❌ HTTP 403
   │   │
   │   ▼
   │   ✅ user имеет роль admin
   │
   ▼
4. Выполняется основная логика
   db.query(Reservation).all()
   │
   ▼
5. Данные преобразуются в JSON
   │
   ▼
6. Возврат клиенту (HTTP 200)
   [
     {"id": 1, "user_id": 1, ...},
     {"id": 2, "user_id": 1, ...}
   ]
```

## 📊 Структура базы данных (Users таблица)

```
┌──────────────────────────────────────────────────────────┐
│                      Users Таблица                       │
├──────────────────────────────────────────────────────────┤
│ id (PRIMARY KEY)                    [Integer]            │
│ email (UNIQUE)                      [String]             │
│ username (UNIQUE)                   [String]             │
│ hashed_password                     [String]             │
│ full_name                           [String, nullable]   │
│ phone                               [String, nullable]   │
│ role ⭐ NEW!                        [String]             │
│                                     ├─ "user"            │
│                                     └─ "admin"           │
│ is_active                           [Boolean]            │
│ created_at                          [DateTime]           │
└──────────────────────────────────────────────────────────┘
```

## 🔐 Система проверки доступа

```
┌─────────────────────────────────────┐
│  API Request Admin Endpoint         │
│  GET /api/admin/reservations        │
│  ?admin_id=1                        │
└────────────┬────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ get_current_admin(user_id=1, db)     │
└────────────┬───────────────────────┘
             │
      ┌──────┴────────┐
      │               │
      ▼               ▼
┌──────────────┐  ┌──────────────────┐
│ Find User    │  │ Access Denied    │
│ in DB        │────► (User not      │
│              │  │  found)          │
│ user = db... │  │  HTTP 404        │
└──────┬──────┘  └──────────────────┘
       │
       ▼
┌──────────────────┐
│ if user is       │
│ not admin?       │
└────┬────────┬───┘
     │        │
     NO       YES
     │        │
     │        ▼
     │    ┌───────────────────┐
     │    │ Access Denied     │
     │    │ (Not Admin)       │
     │    │ HTTP 403          │
     │    └───────────────────┘
     │
     ▼
┌──────────────────────┐
│✅ Allow Operation    │
│ Execute CRUD query  │
│ Return HTTP 200     │
└──────────────────────┘
```

## 🎯 Endpoints группы

### Администратор (Admin)
```
├── GET    /api/admin/reservations
│           └─ Все заказы
│
├── GET    /api/admin/reservations/user/{user_id}
│           └─ Заказы конкретного пользователя
│
├── GET    /api/admin/reservations/{reservation_id}
│           └─ Конкретный заказ
│
├── PUT    /api/admin/reservations/{reservation_id}
│           └─ Обновить заказ
│
├── DELETE /api/admin/reservations/{reservation_id}
│           └─ Удалить заказ
│
├── DELETE /api/admin/reservations/user/{user_id}
│           └─ Удалить все заказы пользователя
│
├── GET    /api/admin/users
│           └─ Все пользователи
│
├── GET    /api/admin/users/{user_id}
│           └─ Информация о пользователе
│
├── PUT    /api/admin/users/{user_id}
│           └─ Обновить профиль пользователя
│
├── POST   /api/admin/users/{user_id}/role/{role}
│           └─ Изменить роль пользователя
│
├── DELETE /api/admin/users/{user_id}
│           └─ Удалить пользователя
│
└── POST   /api/admin/clear_reservations
            └─ Удалить все заказы (разработка)
```

## 🔗 Связи между сущностями

```
┌─────────────────────────┐
│        User             │
├─────────────────────────┤
│ id (PRIMARY KEY)        │
│ email                   │
│ username                │
│ role ⭐                 │
│ is_active               │
│ created_at              │
└────────┬────────────────┘
         │ 1:N
         │
         ▼
┌─────────────────────────┐
│      Reservation        │
├─────────────────────────┤
│ id (PRIMARY KEY)        │
│ user_id (FOREIGN KEY)───┼─────┐
│ email                   │     │
│ phone                   │ Связь
│ date                    │     │
│ time                    │     │
│ guests                  │     │
│ restaurant_id           │     │
│ table_id                │     │
│ is_confirmed            │     │
│ created_at              │     │
└─────────────────────────┘     │
                                │
                    One User has Many
                      Reservations
```

## ⚙️ Процесс создания администратора

```
python scripts/create_admin.py
        │
        ▼
┌───────────────────────────────┐
│ Проверить существующих        │
│ пользователей                 │
└───────────┬───────────────────┘
            │
    ┌───────┴──────────┐
    │                  │
    есть              нет
    │                  │
    ▼                  ▼
┌──────────────┐  ┌────────────────────┐
│ Предложить   │  │ Форма создания      │
│ назначить    │  │ администратора:     │
│ админа       │  │ • Email             │
│ существующему│  │ • Username          │
│ пользователю │  │ • Password          │
│              │  │ • Full name (опц)   │
└──────┬───────┘  │ • Phone (опц)       │
       │          └────────┬───────────┘
       │                   │
       ▼                   ▼
    ┌─────────────────────────────┐
    │ Updates user.role = "admin" │
    │ в БД                        │
    └─────────┬───────────────────┘
              │
              ▼
    ┌─────────────────────────────┐
    │ ✅ Администратор готов      │
    │                             │
    │ ID: X                       │
    │ Role: admin                 │
    │ Email: admin@...            │
    └─────────────────────────────┘
```

## 🛡️ Слои безопасности

```
1. Уровень маршрутизации
   ├─ /api/admin/* - требуют параметр admin_id
   └─ /api/* - открытые эндпоинты

2. Уровень аутентификации
   ├─ Проверка наличия пользователя в БД
   └─ Проверка active статуса

3. Уровень авторизации
   ├─ get_current_admin() проверяет
   ├─ Наличие пользователя
   └─ Роль пользователя == "admin"

4. Уровень БД
   ├─ SQLAlchemy ORM
   ├─ Параметризованные запросы
   └─ Защита от SQL injection
```

## 📈 Масштабируемость

```
Текущая версия          →           Будущие улучшения

GET/POST/PUT/DELETE          JSON Web Tokens (JWT)
(базовая аутентификация)     └─ Токен-based auth

Role-based access            Permission-based access
(есть/нет роль)              (детальные права)

Синхронные операции    →      Асинхронные операции
(FastAPI sync)                (async/await)

SQLite БД              →      PostgreSQL
(разработка)                  (production)

Логи в консоль        →      Structured logging
                              (файл/сервис)
```

## 🔄 Пример: Полный цикл операции

```
ЗАПРОС:
PUT /api/admin/reservations/5?admin_id=1
{
  "guests": 5,
  "is_confirmed": true
}

        ↓ FastAPI получает запрос

ОБРАБОТКА:
1. Вызов update_reservation_admin(5, data, 1)
2. get_current_admin(1) проверяет права
3. db.query(Reservation).filter(id==5) находит заказ
4. Обновляет поля guests=5, is_confirmed=true
5. db.commit() сохраняет в БД
6. Возвращает обновленный объект

        ↓ Сохранение в БД завершено

ОТВЕТ (HTTP 200):
{
  "id": 5,
  "user_id": 2,
  "email": "user@example.com",
  "guests": 5,
  "is_confirmed": true,
  "created_at": "2026-02-26T10:30:00"
}
```

