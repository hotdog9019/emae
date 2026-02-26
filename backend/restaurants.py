from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Restaurant, Table
from typing import List

router = APIRouter(prefix="/api/restaurants", tags=["restaurants"])


@router.get("/", response_model=List[dict])
def list_restaurants(db: Session = Depends(get_db)):
    rs = db.query(Restaurant).all()
    return [
        {"id": r.id, "name": r.name, "address": r.address, "phone": r.phone}
        for r in rs
    ]


@router.get("/{restaurant_id}/tables", response_model=List[dict])
def list_tables(restaurant_id: int, db: Session = Depends(get_db)):
    tbls = db.query(Table).filter(Table.restaurant_id == restaurant_id).all()
    return [
        {"id": t.id, "restaurant_id": t.restaurant_id, "name": t.name, "seats": t.seats, "x": t.x, "y": t.y}
        for t in tbls
    ]
