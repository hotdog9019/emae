# 📁 Список всех новых файлов (v2.0)

## ✅ Статус всех файлов

### 🔄 Обновленные файлы (ЗАМЕНИТЕ старые)

| Файл | Статус | Действие | Примечание |
|------|--------|---------|-----------|
| models.py | ✏️ Обновлен | **Замените старый** | Полная реструктуризация |
| schemas.py | ✏️ Обновлен | **Замените старый** | Новые Pydantic схемы |
| auth_new.py | ✨ Новый | **Переименовать в auth.py** | Обновленная аутентификация |
| main_new.py | ✨ Новый | **Переименовать в main.py** | Новые маршруты подключены |

### ✨ Новые файлы маршрутов (ДОБАВЬТЕ)

| Файл | Статус | Действие | Endpoints |
|------|--------|---------|-----------|
| categories.py | ✨ Новый | **Добавьте** | /api/categories (5) |
| goods.py | ✨ Новый | **Добавьте** | /api/goods (6) |
| baskets.py | ✨ Новый | **Добавьте** | /api/baskets (8) |
| roles.py | ✨ Новый | **Добавьте** | /api/roles (7), /api/permissions (5) |

### 📚 Новая документация (СПРАВКА)

| Файл | Статус | Назначение | Время чтения |
|------|--------|-----------|---|
| DATABASE_STRUCTURE.md | ✨ Новый | Полная структура БД | 15 мин |
| QUICKSTART_V2.md | ✨ Новый | Быстрый старт | 5 мин |
| MIGRATION_GUIDE.md | ✨ Новый | Инструкция миграции | 20 мин |
| CHANGELOG_V2.md | ✨ Новый | Список изменений | 10 мин |
| INDEX_V2.md | ✨ Новый | Индекс документации | 5 мин |

### 📝 Примеры (СПРАВКА)

| Файл | Статус | Содержание |
|------|--------|-----------|
| examples_api_v2.py | ✨ Новый | Python примеры всех операций |

### ⚠️ Старые файлы (для совместимости)

| Файл | Статус | Действие | Примечание |
|------|--------|---------|-----------|
| reservations.py | ⚠️ Старый | **Оставьте** | Всё еще работает |
| restaurants.py | ⚠️ Старый | **Оставьте** | Всё еще работает |
| admin.py | ⚠️ Старый | **Оставьте** | Всё еще работает |
| auth.py | ⚠️ Старый | **Удалите** | Замен на auth_new.py |
| main.py | ⚠️ Старый | **Удалите/обновите** | Замен на main_new.py |

## 📋 Инструкция по установке

### Шаг 1: Загрузка файлов

Убедитесь, что у вас есть все файлы в папке `backend/`:

```
backend/
├── [NEW] categories.py
├── [NEW] goods.py
├── [NEW] baskets.py
├── [NEW] roles.py
├── [NEW] auth_new.py
├── [NEW] main_new.py
├── [UPD] models.py
├── [UPD] schemas.py
├── [DOC] DATABASE_STRUCTURE.md
├── [DOC] QUICKSTART_V2.md
├── [DOC] MIGRATION_GUIDE.md
├── [DOC] CHANGELOG_V2.md
├── [DOC] INDEX_V2.md
├── [DOC] examples_api_v2.py
├── ... (остальные старые файлы) ...
```

### Шаг 2: Замена файлов

```bash
# Windows
move auth_new.py auth.py
move main_new.py main.py
del app.db  # Удалить старую БД (опционально)

# или Linux/Mac
mv auth_new.py auth.py
mv main_new.py main.py
rm app.db  # Удалить старую БД (опционально)
```

### Шаг 3: Проверка импортов

Убедитесь, что все импорты работают:

```bash
python -c "import models; print('✓ models.py OK')"
python -c "import schemas; print('✓ schemas.py OK')"
python -c "import auth; print('✓ auth.py OK')"
python -c "import categories; print('✓ categories.py OK')"
python -c "import goods; print('✓ goods.py OK')"
python -c "import baskets; print('✓ baskets.py OK')"
python -c "import roles; print('✓ roles.py OK')"
```

### Шаг 4: Запуск сервера

```bash
python -m uvicorn main:app --reload
```

### Шаг 5: Проверка

Откройте в браузере:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/ (API Root)

## 🔍 Проверка с помощью SQL

После запуска сервера проверьте таблицы:

```bash
sqlite3 app.db ".tables"
```

Должны появиться:
- categories
- goods  
- goods_baskets
- permissions
- reservations
- restaurants
- role_permissions
- roles
- tables
- users
- baskets

## 🧪 Тестирование

Запустите примеры:

```bash
python examples_api_v2.py
```

Или используйте curl:

```bash
# Получить роли
curl http://localhost:8000/api/roles

# Создать категорию
curl -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
```

## 📊 Файлы по назначению

### Для запуска
```
✅ auth.py (или auth_new.py)
✅ main.py (или main_new.py)
✅ models.py (обновлен)
✅ schemas.py (обновлен)
✅ database.py (не менять)
✅ utils.py (не менять)
```

### Новые маршруты
```
✅ categories.py
✅ goods.py
✅ baskets.py
✅ roles.py
```

### Старые маршруты (для совместимости)
```
✅ reservations.py
✅ restaurants.py
✅ admin.py
```

### Только для чтения
```
📖 DATABASE_STRUCTURE.md
📖 QUICKSTART_V2.md
📖 MIGRATION_GUIDE.md
📖 CHANGELOG_V2.md
📖 INDEX_V2.md
📖 examples_api_v2.py
```

## 🆘 Если что-то не работает

### Ошибка: "module not found"

```bash
# Убедитесь, что файлы в правильной папке
ls -la backend/*.py | grep -E "(auth|main|categories|goods|baskets|roles).py"
```

### Ошибка "table already exists"

```bash
# Удалите старую БД
rm app.db
python -m uvicorn main:app --reload
```

### Ошибка "no such table"

```bash
# Проверьте, что сервер полностью запустился
# В логах должно быть "Application startup complete"
```

## ✅ Финальный чек-лист

- [ ] Все обновленные файлы заменены (models.py, schemas.py)
- [ ] auth_new.py переименован в auth.py
- [ ] main_new.py переименован в main.py
- [ ] Все новые файлы маршрутов добавлены (categories.py, goods.py, baskets.py, roles.py)
- [ ] Старая БД удалена (app.db)
- [ ] Сервер запущен без ошибок
- [ ] http://localhost:8000/docs открывается
- [ ] Все роли видны через API
- [ ] Примеры работают (python examples_api_v2.py)

## 🚀 Готово к использованию!

После выполнения всех шагов система готова к работе!

Начните со следующего:
1. Прочитайте [QUICKSTART_V2.md](QUICKSTART_V2.md)
2. Посмотрите [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md)
3. Запустите [examples_api_v2.py](examples_api_v2.py)
4. Используйте http://localhost:8000/docs для всех API вызовов

---

**Версия:** 2.0.0  
**Дата:** 26 февраля 2026г.  
**Статус:** ✅ Все файлы готовы

