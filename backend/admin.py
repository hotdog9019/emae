from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Reservation

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/clear_reservations")
def clear_reservations(db: Session = Depends(get_db)):
    """Удалить все бронирования (для разработки)."""
    deleted = db.query(Reservation).delete()
    db.commit()
    return {"deleted": deleted}
