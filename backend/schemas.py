from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    phone: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ReservationCreate(BaseModel):
    email: EmailStr
    phone: str
    date: str
    time: str
    guests: int
    special_requests: Optional[str] = None


class ReservationResponse(BaseModel):
    id: int
    user_id: int
    email: str
    phone: str
    date: str
    time: str
    guests: int
    special_requests: Optional[str]
    is_confirmed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ReservationUpdate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    guests: Optional[int] = None
    special_requests: Optional[str] = None
    is_confirmed: Optional[bool] = None
