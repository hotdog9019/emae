# Быстрый старт с системой администратора

## ⚡ За 5 минут до готовности

### 1️⃣ Установка зависимостей
```bash
cd backend
pip install -r requirements.txt
```

### 2️⃣ Создание администратора
```bash
python scripts/create_admin.py
```
Следуйте инструкциям в консоли.

### 3️⃣ Запуск сервера
```bash
# Windows
run.bat

# или вручную:
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 4️⃣ Откройте документацию API
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📝 Примеры использования

### Получить все заказы (как администратор)
```bash
curl -X GET "http://localhost:8000/api/admin/reservations?admin_id=1" \
  -H "accept: application/json"
```

### Обновить заказ
```bash
curl -X PUT "http://localhost:8000/api/admin/reservations/1?admin_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "guests": 5,
    "is_confirmed": true
  }'
```

### Удалить заказ
```bash
curl -X DELETE "http://localhost:8000/api/admin/reservations/1?admin_id=1"
```

### Получить всех пользователей
```bash
curl -X GET "http://localhost:8000/api/admin/users?admin_id=1"
```

### Назначить администратора другому пользователю
```bash
curl -X POST "http://localhost:8000/api/admin/users/2/role/admin?admin_id=1"
```

## 🔐 Безопасность

- Все операции администратора требуют параметра `admin_id` 
- Система проверяет, что пользователь имеет роль `admin`
- Возвращается ошибка HTTP 403 если доступ запрещен

## 📚 Полная документация

Полные примеры и документация находятся в:
- [ADMIN_SYSTEM.md](ADMIN_SYSTEM.md) - подробная документация
- [examples_admin_api.py](examples_admin_api.py) - примеры кода на Python
- [README.md](README.md) - основная документация проекта

## 🐛 Возможные проблемы

**Ошибка: "Недостаточно прав"**
→ Убедитесь, что передаете `admin_id` администратора, а не обычного пользователя

**Ошибка: "Пользователь не найден"**
→ Проверьте ID пользователя в базе данных через `/api/admin/users?admin_id=1`

**Ошибка при создании скрипта create_admin.py**
→ Удалите файл БД `app.db` и пересоздайте таблицы запуском сервера

## 📞 Контакты

Если у вас есть вопросы - обратитесь к документации в [ADMIN_SYSTEM.md](ADMIN_SYSTEM.md)
