from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import auth_new as auth
import reservations
import restaurants
import admin
import models
from sqlalchemy.orm import Session
from database import SessionLocal


def seed_restaurants():
    db: Session = SessionLocal()
    try:
        # Создаем дефолтные роли если их нет
        from models import Restaurant, Table, Role
        
        # Проверяем и создаем роли
        default_roles = ["user", "admin", "manager"]
        for role_name in default_roles:
            existing_role = db.query(Role).filter(Role.name == role_name).first()
            if not existing_role:
                new_role = Role(name=role_name)
                db.add(new_role)
        db.commit()
        
        # Если рестораны уже есть — не сидим
        # если рестораны уже есть — убедимся, что для каждого ресторана созданы все столики по макету
        if db.query(Restaurant).count() > 0:
            # ensure full layout tables exist for each restaurant
            base_layout = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,100,101,102,103,104,105,106]
            rests = db.query(Restaurant).all()
            for r in rests:
                for num in base_layout:
                    name = f"T{num}"
                    exists = db.query(Table).filter(Table.restaurant_id==r.id, Table.name==name).first()
                    if not exists:
                        # compute base coords approximately like seed below
                        coords = {
                            1: (70,210),2: (70,170),3: (70,130),4: (70,90),
                            5: (180,60),6: (300,60),7: (380,90),8: (380,130),9: (380,170),10: (380,210),
                            11: (300,200),12: (300,140),13: (200,200),14: (200,140),
                            100: (80,280),101: (140,280),102: (200,280),103: (260,280),104: (320,280),105: (380,280),106: (440,280)
                        }[num]
                        x_base, y_base = coords
                        off_x = (r.id * 7) % 24 - 12
                        off_y = (r.id * 13) % 18 - 9
                        seats = 2 if (num >= 100 or num % 3 != 0) else 4
                        tbl = Table(
                            restaurant_id=r.id,
                            name=name,
                            seats=seats,
                            x=int(x_base + off_x),
                            y=int(y_base + off_y)
                        )
                        db.add(tbl)
            db.commit()
            return

        addresses = [
            "г. Москва, ул. Тверская, 15",
            "г. Москва, ул. Арбат, 12",
            "г. Москва, просп. Мира, 45",
            "г. Москва, наб. Тараса Шевченко, 3",
            "г. Москва, ул. Новый Арбат, 21",
            "г. Москва, Ленинградский просп., 10",
            "г. Москва, ул. Покровка, 18",
            "г. Москва, ул. Большая Никитская, 7",
            "г. Москва, Кутузовский просп., 30",
            "г. Москва, ул. Остоженка, 25"
        ]

        # layout positions roughly matching frontend SVG (base coords)
        base_layout = {
            1: (70,210),2: (70,170),3: (70,130),4: (70,90),
            5: (180,60),6: (300,60),7: (380,90),8: (380,130),9: (380,170),10: (380,210),
            11: (300,200),12: (300,140),13: (200,200),14: (200,140),
            100: (80,280),101: (140,280),102: (200,280),103: (260,280),104: (320,280),105: (380,280),106: (440,280)
        }

        for i, addr in enumerate(addresses, start=1):
            r = Restaurant(name=f"Yomayo {i}", address=addr, phone="+7 (495) 111-22-33")
            db.add(r)
            db.flush()
            # создаём полный набор столиков соответствующий макету (1-14 и 100-106)
            for num, coords in base_layout.items():
                x_base, y_base = coords
                # небольшой уникальный сдвиг координат для каждого ресторана
                off_x = (i * 7) % 24 - 12
                off_y = (i * 13) % 18 - 9
                seats = 2 if (num >= 100 or num % 3 != 0) else 4
                tbl = Table(
                    restaurant_id=r.id,
                    name=f"T{num}",
                    seats=seats,
                    x=int(x_base + off_x),
                    y=int(y_base + off_y)
                )
                db.add(tbl)

        db.commit()
    finally:
        db.close()

# Создаем таблицы в БД
Base.metadata.create_all(bind=engine)

# Создаем приложение FastAPI
app = FastAPI(
    title="Restaurant API",
    description="API для ресторана с функциями регистрации и бронирования",
    version="1.0.0"
)

# Добавляем CORS middleware для работы с фронтенд
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене измените на конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(reservations.router)
app.include_router(restaurants.router)
app.include_router(admin.router)

# seed restaurants/tables if not present
seed_restaurants()


@app.get("/")
def read_root():
    """Главная страница API"""
    return {
        "message": "Добро пожаловать в Restaurant API",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }


@app.get("/health")
def health_check():
    """Проверка здоровья приложения"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
