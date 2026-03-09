from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from database import engine, Base
import auth_new as auth
import reservations
import restaurants
import admin
from Telegram import router as telegram_official_router
import models
import os
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal


def load_dotenv_files():
    candidates = [
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent / ".env",
    ]
    for env_path in candidates:
        if not env_path.exists():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


load_dotenv_files()


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
def migrate_legacy_users_schema():
    db: Session = SessionLocal()
    try:
        user_cols = {
            row[1] for row in db.execute(text("PRAGMA table_info(users)")).fetchall()
        }
        if not user_cols:
            return

        if "name" not in user_cols:
            db.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR"))
        if "password" not in user_cols:
            db.execute(text("ALTER TABLE users ADD COLUMN password VARCHAR"))
        if "role_id" not in user_cols:
            db.execute(text("ALTER TABLE users ADD COLUMN role_id INTEGER"))
        if "registration_date" not in user_cols:
            db.execute(text("ALTER TABLE users ADD COLUMN registration_date DATETIME"))
        if "birth_date" not in user_cols:
            db.execute(text("ALTER TABLE users ADD COLUMN birth_date VARCHAR"))
        if "email_verified" not in user_cols:
            db.execute(text("ALTER TABLE users ADD COLUMN email_verified BOOLEAN"))
        if "telegram_id" not in user_cols:
            db.execute(text("ALTER TABLE users ADD COLUMN telegram_id VARCHAR"))
        if "telegram_username" not in user_cols:
            db.execute(text("ALTER TABLE users ADD COLUMN telegram_username VARCHAR"))
        if "telegram_photo_url" not in user_cols:
            db.execute(text("ALTER TABLE users ADD COLUMN telegram_photo_url VARCHAR"))
        if "vk_id" not in user_cols:
            db.execute(text("ALTER TABLE users ADD COLUMN vk_id VARCHAR"))
        if "vk_username" not in user_cols:
            db.execute(text("ALTER TABLE users ADD COLUMN vk_username VARCHAR"))
        if "vk_avatar_url" not in user_cols:
            db.execute(text("ALTER TABLE users ADD COLUMN vk_avatar_url VARCHAR"))

        user_cols = {
            row[1] for row in db.execute(text("PRAGMA table_info(users)")).fetchall()
        }

        if "name" in user_cols:
            if "username" in user_cols:
                db.execute(text("UPDATE users SET name = COALESCE(name, username) WHERE name IS NULL OR TRIM(name) = ''"))
            if "email" in user_cols:
                db.execute(text("UPDATE users SET name = COALESCE(name, email) WHERE name IS NULL OR TRIM(name) = ''"))

        if "password" in user_cols and "hashed_password" in user_cols:
            db.execute(text("UPDATE users SET password = COALESCE(password, hashed_password) WHERE password IS NULL OR TRIM(password) = ''"))

        if "role_id" in user_cols:
            db.execute(text("UPDATE users SET role_id = 1 WHERE role_id IS NULL"))
        if "email_verified" in user_cols:
            db.execute(text("UPDATE users SET email_verified = COALESCE(email_verified, 0)"))

        if "registration_date" in user_cols:
            if "created_at" in user_cols:
                db.execute(text("UPDATE users SET registration_date = COALESCE(registration_date, created_at, CURRENT_TIMESTAMP) WHERE registration_date IS NULL"))
            else:
                db.execute(text("UPDATE users SET registration_date = COALESCE(registration_date, CURRENT_TIMESTAMP) WHERE registration_date IS NULL"))

        db.commit()
    finally:
        db.close()


Base.metadata.create_all(bind=engine)
migrate_legacy_users_schema()

# Создаем приложение FastAPI
app = FastAPI(
    title="Restaurant API",
    description="API для ресторана с функциями регистрации и бронирования",
    version="1.0.0"
)

# Добавляем CORS middleware для работы с фронтендом
frontend_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
)
allow_origins = [origin.strip() for origin in frontend_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(telegram_official_router)
app.include_router(reservations.router)
app.include_router(restaurants.router)
app.include_router(admin.router)

# seed restaurants/tables if not present
seed_restaurants()


@app.on_event("startup")
def startup_events():
    if os.getenv("TELEGRAM_POLLING_AUTOSTART", "0") == "1":
        try:
            auth.start_telegram_polling()
        except Exception:
            # do not block API startup if telegram is unavailable
            pass


@app.on_event("shutdown")
def shutdown_events():
    try:
        auth.stop_telegram_polling()
    except Exception:
        pass


@app.get("/")
def read_root():
    # Root should serve the SPA when build artifacts exist.
    if build_index.exists():
        return FileResponse(str(build_index))
    return {
        "message": "Welcome to Restaurant API",
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


# Serve frontend build from backend to avoid dev-server tunnel MIME/host issues.
project_root = Path(__file__).resolve().parent.parent
build_dir = project_root / "build"
build_static = build_dir / "static"
build_index = build_dir / "index.html"

if build_static.exists():
    app.mount("/static", StaticFiles(directory=str(build_static)), name="frontend-static")


@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    if full_path.startswith("api/") or full_path in {"api", "docs", "openapi.json", "health"}:
        raise HTTPException(status_code=404, detail="Not found")
    if build_index.exists():
        return FileResponse(str(build_index))
    return {
        "message": "Frontend build not found. Run `npm run build` in project root.",
        "requested_path": full_path,
    }
