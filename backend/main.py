from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import auth
import reservations
import models

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
