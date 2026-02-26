from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Reservation, User
from schemas import ReservationCreate, ReservationResponse, ReservationUpdate
from models import Table

router = APIRouter(prefix="/api/reservations", tags=["reservations"])


@router.post("/", response_model=ReservationResponse)
def create_reservation(
    reservation: ReservationCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Создать новое бронирование"""
    
    # Проверяем, существует ли пользователь
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Создаем бронирование
    # Проверяем выбранный ресторан/столик (если переданы)
    if reservation.table_id:
        tbl = db.query(Table).filter(Table.id == reservation.table_id).first()
        if not tbl or tbl.restaurant_id != reservation.restaurant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неверный столик или ресторан")
        # Проверим, не забронирован ли столик на это время
        exists = db.query(Reservation).filter(
            Reservation.table_id == reservation.table_id,
            Reservation.date == reservation.date,
            Reservation.time == reservation.time
        ).first()
        if exists:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Столик уже забронирован на выбранное время")

    db_reservation = Reservation(
        user_id=user_id,
        email=reservation.email,
        phone=reservation.phone,
        date=reservation.date,
        time=reservation.time,
        guests=reservation.guests,
        special_requests=reservation.special_requests,
        restaurant_id=reservation.restaurant_id,
        table_id=reservation.table_id
    )
    
    db.add(db_reservation)
    db.commit()
    db.refresh(db_reservation)
    
    return db_reservation


@router.get("/{reservation_id}", response_model=ReservationResponse)
def get_reservation(reservation_id: int, db: Session = Depends(get_db)):
    """Получить информацию о бронировании"""
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id
    ).first()
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бронирование не найдено"
        )
    
    return reservation


@router.get("/user/{user_id}", response_model=list[ReservationResponse])
def get_user_reservations(user_id: int, db: Session = Depends(get_db)):
    """Получить все бронирования пользователя"""
    
    # Проверяем, существует ли пользователь
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    reservations = db.query(Reservation).filter(
        Reservation.user_id == user_id
    ).all()
    
    return reservations


@router.get("/", response_model=list[ReservationResponse])
def get_all_reservations(db: Session = Depends(get_db)):
    """Получить все бронирования"""
    reservations = db.query(Reservation).all()
    return reservations


@router.put("/{reservation_id}", response_model=ReservationResponse)
def update_reservation(
    reservation_id: int,
    reservation_update: ReservationUpdate,
    db: Session = Depends(get_db)
):
    """Обновить бронирование"""
    
    db_reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id
    ).first()
    
    if not db_reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бронирование не найдено"
        )
    
    # Обновляем только переданные поля
    update_data = reservation_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_reservation, field, value)
    
    db.add(db_reservation)
    db.commit()
    db.refresh(db_reservation)
    
    return db_reservation


@router.delete("/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reservation(reservation_id: int, db: Session = Depends(get_db)):
    """Удалить бронирование"""
    
    db_reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id
    ).first()
    
    if not db_reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бронирование не найдено"
        )
    
    db.delete(db_reservation)
    db.commit()
    
    return None
