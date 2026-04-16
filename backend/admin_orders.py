from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Order, User, Role
import json


router = APIRouter(prefix="/api/admin/orders", tags=["admin"])


def _is_admin(db: Session, user_id: int) -> bool:
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        return False
    role_name = None
    try:
        role_name = getattr(u.role, "name", None)
    except Exception:
        role_name = None
    if not role_name and getattr(u, "role_id", None):
        role = db.query(Role).filter(Role.id == u.role_id).first()
        role_name = getattr(role, "name", None) if role else None
    return role_name == "admin"


def _payload(o: Order) -> dict:
    items = []
    try:
        items = json.loads(o.items_json or "[]")
        if not isinstance(items, list):
            items = []
    except Exception:
        items = []
    return {
        "id": o.id,
        "user_id": o.user_id,
        "items": items,
        "total": o.total,
        "fulfillment": o.fulfillment,
        "fulfillment_time": o.fulfillment_time,
        "restaurant_id": getattr(o, "restaurant_id", None),
        "address": o.address,
        "payment": o.payment,
        "comment": o.comment,
        "created_at": o.created_at,
    }


@router.get("/")
def list_orders(admin_id: int = Query(...), db: Session = Depends(get_db)):
    if not _is_admin(db, admin_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    rows = db.query(Order).order_by(Order.created_at.desc()).all()
    return [_payload(o) for o in rows]
