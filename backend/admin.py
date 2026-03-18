from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Reservation, User, Role
from schemas import ReservationResponse, ReservationUpdate, UserResponse, UserUpdate

router = APIRouter(prefix="/api/admin", tags=["admin"])


def get_current_admin(user_id: int, db: Session = Depends(get_db)) -> User:
    """Проверить, что текущий пользователь - администратор"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    role_name = None
    try:
        role_name = getattr(user.role, "name", None)
    except Exception:
        role_name = None
    if not role_name and getattr(user, "role_id", None):
        role = db.query(Role).filter(Role.id == user.role_id).first()
        role_name = getattr(role, "name", None) if role else None
    if role_name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав. Требуется роль администратора"
        )
    return user


# ================ УПРАВЛЕНИЕ ЗАКАЗАМИ ================

@router.get("/reservations", response_model=list[ReservationResponse])
def get_all_reservations_admin(
    admin_id: int,
    db: Session = Depends(get_db)
):
    """Получить все заказы (только для админа)"""
    get_current_admin(admin_id, db)
    
    reservations = db.query(Reservation).all()
    return reservations


@router.get("/reservations/user/{user_id}", response_model=list[ReservationResponse])
def get_user_reservations_admin(
    user_id: int,
    admin_id: int,
    db: Session = Depends(get_db)
):
    """Получить все заказы конкретного пользователя (только для админа)"""
    get_current_admin(admin_id, db)
    
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


@router.get("/reservations/{reservation_id}", response_model=ReservationResponse)
def get_reservation_admin(
    reservation_id: int,
    admin_id: int,
    db: Session = Depends(get_db)
):
    """Получить информацию о конкретном заказе (только для админа)"""
    get_current_admin(admin_id, db)
    
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id
    ).first()
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заказ не найден"
        )
    
    return reservation


@router.put("/reservations/{reservation_id}", response_model=ReservationResponse)
def update_reservation_admin(
    reservation_id: int,
    reservation_update: ReservationUpdate,
    admin_id: int,
    db: Session = Depends(get_db)
):
    """Изменить заказ пользователя (только для админа)"""
    get_current_admin(admin_id, db)
    
    db_reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id
    ).first()
    
    if not db_reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заказ не найден"
        )
    
    # Обновляем только переданные поля
    update_data = reservation_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_reservation, field, value)
    
    db.add(db_reservation)
    db.commit()
    db.refresh(db_reservation)
    
    return db_reservation


@router.delete("/reservations/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reservation_admin(
    reservation_id: int,
    admin_id: int,
    db: Session = Depends(get_db)
):
    """Удалить заказ пользователя (только для админа)"""
    get_current_admin(admin_id, db)
    
    db_reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id
    ).first()
    
    if not db_reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заказ не найден"
        )
    
    db.delete(db_reservation)
    db.commit()
    
    return None


@router.delete("/reservations/user/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_reservations_admin(
    user_id: int,
    admin_id: int,
    db: Session = Depends(get_db)
):
    """Удалить все заказы пользователя (только для админа)"""
    get_current_admin(admin_id, db)
    
    # Проверяем, существует ли пользователь
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    deleted = db.query(Reservation).filter(
        Reservation.user_id == user_id
    ).delete()
    db.commit()
    
    return None


# ================ УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ================

@router.get("/users", response_model=list[UserResponse])
def get_all_users_admin(
    admin_id: int,
    db: Session = Depends(get_db)
):
    """Получить всех пользователей (только для админа)"""
    get_current_admin(admin_id, db)
    
    users = db.query(User).all()
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_admin(
    user_id: int,
    admin_id: int,
    db: Session = Depends(get_db)
):
    """Получить информацию о пользователе (только для админа)"""
    get_current_admin(admin_id, db)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user_admin(
    user_id: int,
    user_update: UserUpdate,
    admin_id: int,
    db: Session = Depends(get_db)
):
    """Обновить информацию о пользователе (только для админа)"""
    get_current_admin(admin_id, db)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Обновляем только переданные поля
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/users/{user_id}/role/{role}")
def set_user_role_admin(
    user_id: int,
    role: str,
    admin_id: int,
    db: Session = Depends(get_db)
):
    """Назначить роль пользователю (только для админа)"""
    get_current_admin(admin_id, db)
    
    # Проверяем корректность роли
    if role not in ["user", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверная роль. Допустимые значения: 'user', 'admin'"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    target_role = db.query(Role).filter(Role.name == role).first()
    if not target_role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Роль не найдена")
    user.role_id = target_role.id
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": f"Роль пользователя изменена на {role}", "user": user}


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_admin(
    user_id: int,
    admin_id: int,
    db: Session = Depends(get_db)
):
    """Удалить пользователя (только для админа)"""
    get_current_admin(admin_id, db)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Удаляем все заказы пользователя
    db.query(Reservation).filter(
        Reservation.user_id == user_id
    ).delete()
    
    # Удаляем пользователя
    db.delete(user)
    db.commit()
    
    return None


# ================ РАЗРАБОТКА ================

@router.post("/clear_reservations")
def clear_reservations(
    admin_id: int,
    db: Session = Depends(get_db)
):
    """Удалить все заказы (для разработки, только для админа)."""
    get_current_admin(admin_id, db)
    deleted = db.query(Reservation).delete()
    db.commit()
    return {"deleted": deleted}
