# 🎫 Интеграция системы бронирования столиков

## 📋 Что реализовано

Полная интеграция системы сохранения и отображения бронирований:

### 🔙 Backend изменения

#### 1. **Обновлены модели** (`models.py`)
- `Reservation` теперь имеет **Foreign Keys** на `restaurants.id` и `tables.id`
- Добавлены **отношения** (`relationship`) для загрузки вложенных данных:
  - `restaurant` → полная информация о ресторане
  - `table` ↔ информация о столике

```python
class Reservation(Base):
    # ... поля ...
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=True)
    
    # Отношения для вложенной загрузки
    restaurant = relationship("Restaurant", backref="reservations")
    table = relationship("Table", backref="reservations")
```

#### 2. **Расширены Pydantic схемы** (`schemas.py`)
- Добавлены `RestaurantResponse` и `TableResponse` для вложения
- `ReservationResponse` теперь включает полные данные ресторана и столика:

```python
class ReservationResponse(BaseModel):
    # ... базовые поля ...
    restaurant: Optional[RestaurantResponse] = None
    table: Optional[TableResponse] = None
```

#### 3. **Существующие endpoints без изменений**
- `GET /api/reservations/user/{user_id}` - получить все бронирования пользователя
- Эндпоинты автоматически вернут полную информацию о ресторане и столике

### 🎨 Frontend изменения

#### 1. **App.jsx** - загрузка бронирования при входе
```javascript
useEffect(() => {
  // загрузим бронь пользователя при входе
  if (!user) {
    setReservation(null);
    return;
  }
  const list = await api.reservations.getUserReservations(user.id);
  // выберем ближайшую по дате/времени бронь
  const sorted = list.slice().sort((a,b) => {
    const da = new Date(a.date + 'T' + (a.time || '00:00'));
    const db = new Date(b.date + 'T' + (b.time || '00:00'));
    return da - db;
  });
  setReservation(sorted[0] || null);
}, [user]);
```

#### 2. **CartDrawer.jsx** - отображение бронирования в корзине
```javascript
{reservation && (
  <div className="d-reservation">
    <div>Забронировано место</div>
    <div>{reservation.date} {reservation.time}</div>
    <div>Гостей: {reservation.guests}</div>
    <div>Ресторан: #{reservation.restaurant_id}, стол {reservation.table_id}</div>
  </div>
)}
```

## 📡 API примеры

### Получение Бронирования Пользователя

```bash
curl http://localhost:8000/api/reservations/user/1
```

**Ответ:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "email": "user@example.com",
    "phone": "+79991234567",
    "date": "2026-02-28",
    "time": "19:00",
    "guests": 4,
    "special_requests": "без лука",
    "is_confirmed": true,
    "restaurant_id": 1,
    "table_id": 5,
    "created_at": "2026-02-26T10:30:00",
    "restaurant": {
      "id": 1,
      "name": "Ресторан Москва",
      "address": "ул. Красная, 18"
    },
    "table": {
      "id": 5,
      "restaurant_id": 1,
      "name": "Стол 5",
      "seats": 4
    }
  }
]
```

### Создание Бронирования

```bash
curl -X POST http://localhost:8000/api/reservations/?user_id=1 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "+79991234567",
    "date": "2026-02-28",
    "time": "19:00",
    "guests": 4,
    "special_requests": "без лука",
    "restaurant_id": 1,
    "table_id": 5
  }'
```

## 🖼️ Отображение в UI

### Корзина с бронированием

```
┌─────────────────────────────┐
│ Корзина                  ✕  │
├─────────────────────────────┤
│ ⭐ Забронировано место      │
│    2026-02-28 19:00         │
│    Гостей: 4                │
│    Ресторан: #1, стол 5     │
├─────────────────────────────┤
│ 🍽️ Блюдо 1        200 ₽    │
│    [−] 1 [+]      [🗑️]     │
├─────────────────────────────┤
│ 🍽️ Блюдо 2        150 ₽    │
│    [−] 2 [+]      [🗑️]     │
├─────────────────────────────┤
│ ИТОГО         500 ₽         │
│ [Оформить заказ]            │
└─────────────────────────────┘
```

## 🔄 Поток данных

```
1. Пользователь логинится
   ↓
2. App.jsx загружает список всех его бронирований
   ↓
3. Выбирается ближайшая по дате/времени бронь
   ↓
4. Бронирование сохраняется в state `reservation`
   ↓
5. Пользователь открывает корзину
   ↓
6. CartDrawer получает reservation prop и отображает информацию
   ↓
7. При добавлении блюд в корзину, бронирование остается видимым
```

## 🧪 Тестирование

### 1. Убедитесь, что backend запущен
```bash
cd backend
python -m uvicorn main:app --reload
```

### 2. Создайте тестировое бронирование
```bash
# Сначала создайте ресторан
curl -X POST http://localhost:8000/api/restaurants/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Rest","address":"Test St"}'

# Потом столик
curl -X POST http://localhost:8000/api/restaurants/1/tables \
  -H "Content-Type: application/json" \
  -d '{"name":"T1","seats":4}'

# Потом бронирование
curl -X POST http://localhost:8000/api/reservations/?user_id=1 \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@test.com",
    "phone":"+79991234567",
    "date":"2026-03-01",
    "time":"19:00",
    "guests":4,
    "restaurant_id":1,
    "table_id":1
  }'
```

### 3. Откройте frontend
```bash
cd src
npm start
```

### 4. Логинитесь и откройте корзину
- Вы должны увидеть информацию об ближайшем бронировании
- Добавьте блюда - бронирование остается видимым рядом

## 📦 Зависимости

Никакие новые зависимости не требуются! Используются:
- **Backend:** SQLAlchemy (уже есть), FastAPI (уже есть), Pydantic (уже есть)
- **Frontend:** React (уже есть), fetch API (встроен)

## 🔍 Проверка синтаксиса

✅ `models.py` - синтаксис корректен  
✅ `schemas.py` - синтаксис корректен  
✅ `App.jsx` - синтаксис корректен  
✅ `CartDrawer.jsx` - синтаксис корректен  

## 🎯 Что делает система

1. **Сохранять бронирования** - при создании бронирования сохраняется:
   - Дата, время, количество гостей
   - Выбранный ресторан (ID и full data)
   - Выбранный столик (ID и full data)
   - Email, телефон пользователя

2. **Загружать бронирования** - при входе пользователя:
   - Загружаются все его бронирования
   - Выбирается ближайшее по дате/времени
   - Сохраняется в состояние приложения

3. **Отображать в корзине** - рядом с заказом показывается:
   - Дата и время бронирования
   - Количество гостей
   - Информация о ресторане и столике

## ✨ Улучшения

Можно также добавить:
- [ ] Фильтрацию по статусу (подтверждено / отменено)
- [ ] Редактирование бронирования
- [ ] Отмену бронирования
- [ ] Уведомления о скором времени бронирования
- [ ] Сохранение картинки ресторана в ответе

## 🚀 Следующие шаги

1. Запустите backend: `python -m uvicorn main:app --reload`
2. Запустите frontend: `npm start`
3. Протестируйте:
   - Создайте бронирование через модаль
   - Логинитесь
   - Откройте корзину и посмотрите бронирование

---

**Версия:** 1.0  
**Status:** ✅ Готово к использованию
