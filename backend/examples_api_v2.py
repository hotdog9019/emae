"""
Примеры использования новой API (v2.0) с новой структурой БД
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

print("=" * 80)
print("ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ API v2.0")
print("=" * 80)

# ============================================================================
# 1. ПОЛУЧЕНИЕ ВСТРОЕННЫХ РОЛЕЙ И РАЗРЕШЕНИЙ
# ============================================================================

print("\n1️⃣ ПОЛУЧЕНИЕ ВСТРОЕННЫХ РОЛЕЙ И РАЗРЕШЕНИЙ\n")

response = requests.get(f"{BASE_URL}/roles")
print("Доступные роли:")
for role in response.json():
    print(f"  - {role['name']} (ID: {role['id']})")

response = requests.get(f"{BASE_URL}/permissions")
print("\nДоступные разрешения:")
for perm in response.json():
    print(f"  - {perm['name']} (ID: {perm['id']})")


# ============================================================================
# 2. СОЗДАНИЕ КАТЕГОРИЙ
# ============================================================================

print("\n\n2️⃣ СОЗДАНИЕ КАТЕГОРИЙ\n")

categories_data = [
    "Электроника",
    "Одежда",
    "Книги",
    "Продукты"
]

category_ids = {}

for cat_name in categories_data:
    response = requests.post(
        f"{BASE_URL}/categories",
        json={"name": cat_name}
    )
    if response.status_code == 201 or response.status_code == 200:
        cat_data = response.json()
        category_ids[cat_name] = cat_data['id']
        print(f"✓ Создана категория '{cat_name}' (ID: {cat_data['id']})")
    elif response.status_code == 400:
        # Категория уже существует
        print(f"⚠ Категория '{cat_name}' уже существует")
        # Получаем ID существующей категории
        all_cats = requests.get(f"{BASE_URL}/categories").json()
        for cat in all_cats:
            if cat['name'] == cat_name:
                category_ids[cat_name] = cat['id']
    else:
        print(f"✗ Ошибка при создании '{cat_name}': {response.status_code}")


# ============================================================================
# 3. СОЗДАНИЕ ТОВАРОВ
# ============================================================================

print("\n\n3️⃣ СОЗДАНИЕ ТОВАРОВ\n")

goods_data = [
    {
        "name": "Ноутбук Dell XPS 13",
        "code": "DELL-XPS-13-2026",
        "category": "Электроника"
    },
    {
        "name": "Смартфон iPhone 15",
        "code": "IPHONE-15-2026",
        "category": "Электроника"
    },
    {
        "name": "Футболка Blue",
        "code": "TSHIRT-BLUE-001",
        "category": "Одежда"
    },
    {
        "name": "Python Programming",
        "code": "BOOK-PYTHON-001",
        "category": "Книги"
    }
]

goods_ids = {}

for goods in goods_data:
    response = requests.post(
        f"{BASE_URL}/goods",
        json={
            "name": goods["name"],
            "code": goods["code"],
            "category_id": category_ids.get(goods["category"], 1)
        }
    )
    
    if response.status_code == 200:
        goods_data_resp = response.json()
        goods_ids[goods["code"]] = goods_data_resp['id']
        print(f"✓ Создан товар '{goods['name']}' (ID: {goods_data_resp['id']})")
    else:
        print(f"✗ Ошибка при создании товара: {response.status_code}")
        print(f"  Error: {response.json()}")


# ============================================================================
# 4. РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЕЙ
# ============================================================================

print("\n\n4️⃣ РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЕЙ\n")

users_data = [
    {"name": "john_doe", "password": "secure_pass_123", "role_id": 1},
    {"name": "jane_smith", "password": "secure_pass_456", "role_id": 1},
    {"name": "admin_user", "password": "admin_pass_789", "role_id": 3}
]

user_ids = {}

for user in users_data:
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json=user
    )
    
    if response.status_code == 200:
        user_data = response.json()
        user_ids[user["name"]] = user_data['id']
        print(f"✓ Зарегистрирован пользователь '{user['name']}' (ID: {user_data['id']})")
    elif response.status_code == 400:
        print(f"⚠ Пользователь '{user['name']}' уже существует")
    else:
        print(f"✗ Ошибка при регистрации: {response.status_code}")
        print(f"  Error: {response.json()}")


# ============================================================================
# 5. ВХОД ПОЛЬЗОВАТЕЛЯ
# ============================================================================

print("\n\n5️⃣ ВХОД ПОЛЬЗОВАТЕЛЯ\n")

response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"name": "john_doe", "password": "secure_pass_123"}
)

if response.status_code == 200:
    login_data = response.json()
    print(f"✓ Успешный вход пользователя john_doe")
    print(f"  ID: {login_data['id']}")
    print(f"  Role ID: {login_data['role_id']}")
    print(f"  Сообщение: {login_data['message']}")
else:
    print(f"✗ Ошибка при входе: {response.status_code}")


# ============================================================================
# 6. ПОЛУЧЕНИЕ ИНФОРМАЦИИ О ПОЛЬЗОВАТЕЛЯХ
# ============================================================================

print("\n\n6️⃣ ПОЛУЧЕНИЕ ИНФОРМАЦИИ О ПОЛЬЗОВАТЕЛЯХ\n")

response = requests.get(f"{BASE_URL}/auth/users")
users = response.json()

print(f"Всего пользователей: {len(users)}")
for user in users:
    print(f"  - {user['name']} (ID: {user['id']}, Role: {user['role_id']})")


# ============================================================================
# 7. ПОЛУЧЕНИЕ ТОВАРОВ
# ============================================================================

print("\n\n7️⃣ ПОЛУЧЕНИЕ ТОВАРОВ\n")

# Все товары
response = requests.get(f"{BASE_URL}/goods")
all_goods = response.json()
print(f"Всего товаров: {len(all_goods)}")
for goods in all_goods[:5]:  # Показываем первые 5
    print(f"  - {goods['name']} (код: {goods['code']}, категория ID: {goods['category_id']})")

# Товары по категории
if category_ids:
    first_cat_id = list(category_ids.values())[0]
    response = requests.get(f"{BASE_URL}/goods/category/{first_cat_id}")
    cat_goods = response.json()
    cat_name = list(category_ids.keys())[0]
    print(f"\nТовары в категории '{cat_name}': {len(cat_goods)}")


# ============================================================================
# 8. ПОЛУЧЕНИЕ КОРЗИНЫ ПОЛЬЗОВАТЕЛЯ
# ============================================================================

print("\n\n8️⃣ ПОЛУЧЕНИЕ КОРЗИНЫ ПОЛЬЗОВАТЕЛЯ\n")

if user_ids:
    first_user_id = list(user_ids.values())[0]
    response = requests.get(f"{BASE_URL}/baskets/user/{first_user_id}")
    
    if response.status_code == 200:
        basket = response.json()
        print(f"✓ Получена корзина пользователя (ID корзины: {basket['id']})")
        print(f"  Товаров в корзине: {len(basket['goods_items'])}")
    else:
        print(f"⚠ Корзина не найдена")


# ============================================================================
# 9. ДОБАВЛЕНИЕ ТОВАРОВ В КОРЗИНУ
# ============================================================================

print("\n\n9️⃣ ДОБАВЛЕНИЕ ТОВАРОВ В КОРЗИНУ\n")

if user_ids and goods_ids:
    first_user_id = list(user_ids.values())[0]
    
    # Получаем ID корзины
    response = requests.get(f"{BASE_URL}/baskets/user/{first_user_id}")
    basket_id = response.json()['id']
    
    # Добавляем товары
    goods_to_add = list(goods_ids.items())[:2]  # Первые 2 товара
    
    for code, goods_id in goods_to_add:
        response = requests.post(
            f"{BASE_URL}/baskets/{basket_id}/items",
            json={"goods_id": goods_id, "count": 2}
        )
        
        if response.status_code == 200:
            print(f"✓ Товар {code} добавлен в корзину (кол-во: 2)")
        else:
            print(f"✗ Ошибка при добавлении товара: {response.status_code}")


# ============================================================================
# 10. ПРОСМОТР СОДЕРЖИМОГО КОРЗИНЫ
# ============================================================================

print("\n\n🔟 ПРОСМОТР СОДЕРЖИМОГО КОРЗИНЫ\n")

if user_ids:
    first_user_id = list(user_ids.values())[0]
    response = requests.get(f"{BASE_URL}/baskets/user/{first_user_id}")
    
    if response.status_code == 200:
        basket = response.json()
        print(f"Товары в корзине пользователя:")
        
        total_price = 0
        total_items = 0
        
        for item in basket['goods_items']:
            goods = item['goods']
            count = item['count']
            total_items += count
            
            print(f"  - {goods['name']}")
            print(f"    Код: {goods['code']}")
            print(f"    Количество: {count}")
            print()


# ============================================================================
# 11. ОБНОВЛЕНИЕ КОЛИЧЕСТВА ТОВАРА В КОРЗИНЕ
# ============================================================================

print("\n1️⃣1️⃣ ОБНОВЛЕНИЕ КОЛИЧЕСТВА ТОВАРА\n")

if user_ids and goods_ids:
    first_user_id = list(user_ids.values())[0]
    response = requests.get(f"{BASE_URL}/baskets/user/{first_user_id}")
    basket = response.json()
    
    if basket['goods_items']:
        first_item = basket['goods_items'][0]
        goods_id = first_item['goods_id']
        basket_id = basket['id']
        
        response = requests.put(
            f"{BASE_URL}/baskets/{basket_id}/items/{goods_id}",
            json={"count": 5}
        )
        
        if response.status_code == 200:
            print(f"✓ Количество товара обновлено на 5")
        else:
            print(f"✗ Ошибка при обновлении: {response.status_code}")


# ============================================================================
# 12. УДАЛЕНИЕ ТОВАРА ИЗ КОРЗИНЫ
# ============================================================================

print("\n1️⃣2️⃣ УДАЛЕНИЕ ТОВАРА ИЗ КОРЗИНЫ\n")

if user_ids and goods_ids:
    first_user_id = list(user_ids.values())[0]
    response = requests.get(f"{BASE_URL}/baskets/user/{first_user_id}")
    basket = response.json()
    
    if len(basket['goods_items']) > 0:
        item = basket['goods_items'][-1]  # Последний товар
        goods_id = item['goods_id']
        basket_id = basket['id']
        
        response = requests.delete(
            f"{BASE_URL}/baskets/{basket_id}/items/{goods_id}"
        )
        
        if response.status_code == 204:
            print(f"✓ Товар удален из корзины")
        else:
            print(f"✗ Ошибка при удалении: {response.status_code}")


# ============================================================================
# 13. ОЧИСТКА КОРЗИНЫ
# ============================================================================

print("\n1️⃣3️⃣ ОЧИСТКА КОРЗИНЫ\n")

if user_ids:
    first_user_id = list(user_ids.values())[0]
    response = requests.get(f"{BASE_URL}/baskets/user/{first_user_id}")
    basket_id = response.json()['id']
    
    response = requests.delete(f"{BASE_URL}/baskets/{basket_id}/clear")
    
    if response.status_code == 204:
        print(f"✓ Корзина очищена")
    else:
        print(f"✗ Ошибка при очистке: {response.status_code}")


# ============================================================================
# ИТОГИ
# ============================================================================

print("\n\n" + "=" * 80)
print("✅ ПРИМЕРЫ ВЫПОЛНЕНЫ УСПЕШНО")
print("=" * 80)
print("\nСоздано:")
print(f"  - Категорий: {len(category_ids)}")
print(f"  - Товаров: {len(goods_ids)}")
print(f"  - Пользователей: {len(user_ids)}")
print("\nДокументация доступна в Swagger UI: http://localhost:8000/docs")
