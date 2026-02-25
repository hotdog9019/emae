import requests
import json

print("=== Тест регистрации ===")
response = requests.post(
    'http://localhost:8000/api/auth/register',
    json={
        'email': 'john@example.com',
        'username': 'john_doe',
        'password': 'secure_password123',
        'full_name': 'John Doe',
        'phone': '+1-555-0101'
    }
)

if response.status_code == 200:
    data = response.json()
    print("✓ Регистрация успешна!")
    print(f"  ID: {data['id']}")
    print(f"  Email: {data['email']}")
    print(f"  Username: {data['username']}")
    user_id = data['id']
else:
    print(f"✗ Ошибка: {response.status_code}")
    print(f"  {response.text}")
    exit(1)

print("\n=== Тест входа ===")
response = requests.post(
    'http://localhost:8000/api/auth/login',
    json={
        'email': 'john@example.com',
        'password': 'secure_password123'
    }
)

if response.status_code == 200:
    data = response.json()
    print("✓ Вход успешен!")
    print(f"  ID: {data['id']}")
    print(f"  Username: {data['username']}")
else:
    print(f"✗ Ошибка входа: {response.status_code}")

print("\n=== Тест создания бронирования ===")
response = requests.post(
    f'http://localhost:8000/api/reservations/?user_id={user_id}',
    json={
        'email': 'john@example.com',
        'phone': '+1-555-0101',
        'date': '2026-03-15',
        'time': '19:00',
        'guests': 4,
        'special_requests': 'Window seat please'
    }
)

if response.status_code == 200:
    data = response.json()
    print("✓ Бронирование создано!")
    print(f"  ID: {data['id']}")
    print(f"  Дата: {data['date']}")
    print(f"  Время: {data['time']}")
    print(f"  Гостей: {data['guests']}")
    reservation_id = data['id']
else:
    print(f"✗ Ошибка: {response.status_code}")
    print(f"  {response.text}")

print("\n=== Тест получения бронирований пользователя ===")
response = requests.get(f'http://localhost:8000/api/reservations/user/{user_id}')

if response.status_code == 200:
    reservations = response.json()
    print(f"✓ Найдено {len(reservations)} бронирований")
    for res in reservations:
        print(f"  - ID: {res['id']}, Дата: {res['date']}, Гостей: {res['guests']}")
else:
    print(f"✗ Ошибка: {response.status_code}")

print("\n=== Тест обновления бронирования ===")
response = requests.put(
    f'http://localhost:8000/api/reservations/{reservation_id}',
    json={
        'guests': 5,
        'is_confirmed': True
    }
)

if response.status_code == 200:
    data = response.json()
    print("✓ Бронирование обновлено!")
    print(f"  Гостей: {data['guests']}")
    print(f"  Подтверждено: {data['is_confirmed']}")
else:
    print(f"✗ Ошибка: {response.status_code}")

print("\n=== Все тесты завершены ===")
