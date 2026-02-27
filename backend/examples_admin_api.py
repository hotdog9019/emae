"""
Примеры для тестирования API администратора
"""

# ============================================================================
# 1. СОЗДАНИЕ АДМИНИСТРАТОРА
# ============================================================================

# Запустите скрипт для создания администратора
# python backend/scripts/create_admin.py

# Пример данных администратора:
# Email: admin@restaurant.com
# Username: admin
# Password: admin_password
# Role: admin


# ============================================================================
# 2. РЕГИСТРАЦИЯ ОБЫЧНЫХ ПОЛЬЗОВАТЕЛЕЙ (для тестирования)
# ============================================================================

import requests

BASE_URL = "http://localhost:8000/api"

# Создаем обычного пользователя
user_data = {
    "email": "user1@example.com",
    "username": "user1",
    "password": "password123",
    "full_name": "John Doe",
    "phone": "+7 (999) 123-45-67"
}

response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
print("Register User 1:", response.json())
user1_id = response.json()["id"]

# Создаем второго пользователя
user_data_2 = {
    "email": "user2@example.com",
    "username": "user2",
    "password": "password456",
    "full_name": "Jane Smith",
    "phone": "+7 (999) 987-65-43"
}

response = requests.post(f"{BASE_URL}/auth/register", json=user_data_2)
print("Register User 2:", response.json())
user2_id = response.json()["id"]

# Создаем администратора через API (если в auth.py позволяет)
admin_data = {
    "email": "admin@restaurant.com",
    "username": "admin",
    "password": "admin_pass",
    "full_name": "Admin User",
    "role": "admin"  # Можно указать роль при регистрации
}

response = requests.post(f"{BASE_URL}/auth/register", json=admin_data)
print("Register Admin:", response.json())
admin_id = response.json()["id"]


# ============================================================================
# 3. СОЗДАНИЕ ЗАКАЗОВ ДЛЯ ТЕСТИРОВАНИЯ
# ============================================================================

# Создаем заказ для первого пользователя
reservation_data = {
    "email": "user1@example.com",
    "phone": "+7 (999) 123-45-67",
    "date": "2024-03-20",
    "time": "19:00",
    "guests": 2,
    "special_requests": "Тихий стол, пожалуйста",
    "restaurant_id": 1,
    "table_id": 5
}

response = requests.post(
    f"{BASE_URL}/reservations/?user_id={user1_id}",
    json=reservation_data
)
print("Create Reservation 1:", response.json())
reservation1_id = response.json()["id"]

# Создаем второй заказ для первого пользователя
reservation_data_2 = {
    "email": "user1@example.com",
    "phone": "+7 (999) 123-45-67",
    "date": "2024-03-21",
    "time": "20:00",
    "guests": 4,
    "restaurant_id": 2,
    "table_id": 10
}

response = requests.post(
    f"{BASE_URL}/reservations/?user_id={user1_id}",
    json=reservation_data_2
)
print("Create Reservation 2:", response.json())
reservation2_id = response.json()["id"]

# Создаем заказ для второго пользователя
reservation_data_3 = {
    "email": "user2@example.com",
    "phone": "+7 (999) 987-65-43",
    "date": "2024-03-22",
    "time": "18:30",
    "guests": 3,
    "restaurant_id": 1,
    "table_id": 8
}

response = requests.post(
    f"{BASE_URL}/reservations/?user_id={user2_id}",
    json=reservation_data_3
)
print("Create Reservation 3:", response.json())
reservation3_id = response.json()["id"]


# ============================================================================
# 4. ТЕСТИРОВАНИЕ ADMIN API - УПРАВЛЕНИЕ ЗАКАЗАМИ
# ============================================================================

print("\n=== УПРАВЛЕНИЕ ЗАКАЗАМИ ===\n")

# Получить все заказы (как админ)
response = requests.get(f"{BASE_URL}/admin/reservations?admin_id={admin_id}")
print("Get All Reservations:", response.json())

# Получить заказы конкретного пользователя (как админ)
response = requests.get(
    f"{BASE_URL}/admin/reservations/user/{user1_id}?admin_id={admin_id}"
)
print(f"\nGet Reservations for User {user1_id}:", response.json())

# Получить конкретный заказ (как админ)
response = requests.get(
    f"{BASE_URL}/admin/reservations/{reservation1_id}?admin_id={admin_id}"
)
print(f"\nGet Reservation {reservation1_id}:", response.json())

# Обновить заказ (как админ)
update_data = {
    "guests": 5,
    "is_confirmed": True,
    "special_requests": "Обновленный комментарий от админа"
}

response = requests.put(
    f"{BASE_URL}/admin/reservations/{reservation1_id}?admin_id={admin_id}",
    json=update_data
)
print(f"\nUpdate Reservation {reservation1_id}:", response.json())

# Удалить заказ (как админ)
response = requests.delete(
    f"{BASE_URL}/admin/reservations/{reservation2_id}?admin_id={admin_id}"
)
print(f"\nDelete Reservation {reservation2_id}: Status {response.status_code}")

# Удалить все заказы конкретного пользователя (как админ)
response = requests.delete(
    f"{BASE_URL}/admin/reservations/user/{user2_id}?admin_id={admin_id}"
)
print(f"Delete All Reservations for User {user2_id}: Status {response.status_code}")


# ============================================================================
# 5. ТЕСТИРОВАНИЕ ADMIN API - УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ
# ============================================================================

print("\n=== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ===\n")

# Получить всех пользователей (как админ)
response = requests.get(f"{BASE_URL}/admin/users?admin_id={admin_id}")
print("Get All Users:", response.json())

# Получить конкретного пользователя (как админ)
response = requests.get(
    f"{BASE_URL}/admin/users/{user1_id}?admin_id={admin_id}"
)
print(f"\nGet User {user1_id}:", response.json())

# Обновить профиль пользователя (как админ)
update_data = {
    "full_name": "John Updated",
    "phone": "+7 (999) 111-11-11"
}

response = requests.put(
    f"{BASE_URL}/admin/users/{user1_id}?admin_id={admin_id}",
    json=update_data
)
print(f"\nUpdate User {user1_id}:", response.json())

# Назначить администратора
response = requests.post(
    f"{BASE_URL}/admin/users/{user2_id}/role/admin?admin_id={admin_id}"
)
print(f"\nMake User {user2_id} Admin:", response.json())

# Отозвать права администратора
response = requests.post(
    f"{BASE_URL}/admin/users/{user2_id}/role/user?admin_id={admin_id}"
)
print(f"\nMake User {user2_id} Regular User:", response.json())

# Удалить пользователя (и все его заказы)
response = requests.delete(
    f"{BASE_URL}/admin/users/{user2_id}?admin_id={admin_id}"
)
print(f"\nDelete User {user2_id}: Status {response.status_code}")


# ============================================================================
# 6. ТЕСТИРОВАНИЕ ОШИБОК И БЕЗОПАСНОСТИ
# ============================================================================

print("\n=== ТЕСТИРОВАНИЕ БЕЗОПАСНОСТИ ===\n")

# Попытка доступа к админ панели как обычного пользователя
response = requests.get(
    f"{BASE_URL}/admin/users?admin_id={user1_id}"
)
print("Access Admin as Regular User:", response.status_code, response.json())

# Попытка доступа с неверным ID администратора
response = requests.get(
    f"{BASE_URL}/admin/users?admin_id=999"
)
print("Access Admin with Invalid ID:", response.status_code, response.json())


# ============================================================================
# 7. ПОЛЕЗНЫЕ ПРИМЕРЫ
# ============================================================================

"""
# Выборочно получить информацию о заказах с фильтрацией
all_reservations = requests.get(f"{BASE_URL}/admin/reservations?admin_id={admin_id}").json()
unconfirmed = [r for r in all_reservations if not r['is_confirmed']]
print(f"Unconfirmed reservations: {len(unconfirmed)}")

# Получить статистику по пользователям
all_users = requests.get(f"{BASE_URL}/admin/users?admin_id={admin_id}").json()
admins = [u for u in all_users if u['role'] == 'admin']
print(f"Total users: {len(all_users)}, Admins: {len(admins)}")

# Получить информацию о заказах пользователя в определенную дату
user_reservations = requests.get(
    f"{BASE_URL}/admin/reservations/user/{user1_id}?admin_id={admin_id}"
).json()
march_reservations = [r for r in user_reservations if r['date'].startswith('2024-03')]
print(f"Reservations in March: {len(march_reservations)}")
"""
