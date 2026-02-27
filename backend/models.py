from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# ================ ВЕТВЬ РАЗРЕШЕНИЙ И РОЛЕЙ ================

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    # Отношения
    roles = relationship("Role", secondary="role_permissions", back_populates="permissions")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    # Отношения
    users = relationship("User", back_populates="role")
    permissions = relationship("Permission", secondary="role_permissions", back_populates="roles")


# ================ ВЕТВЬ ПОЛЬЗОВАТЕЛЕЙ ================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    password = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    registration_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Отношения
    role = relationship("Role", back_populates="users")
    basket = relationship("Basket", uselist=False, back_populates="user", cascade="all, delete-orphan")


class Basket(Base):
    __tablename__ = "baskets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Отношения
    user = relationship("User", back_populates="basket")
    goods_items = relationship("GoodsBasket", back_populates="basket", cascade="all, delete-orphan")


# ================ ВЕТВЬ ТОВАРОВ ================

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    # Отношения
    goods = relationship("Goods", back_populates="category")


class Goods(Base):
    __tablename__ = "goods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    import_date = Column(DateTime(timezone=True), server_default=func.now())
    finish_date = Column(DateTime(timezone=True), nullable=True)
    
    # Отношения
    category = relationship("Category", back_populates="goods")
    basket_items = relationship("GoodsBasket", back_populates="goods", cascade="all, delete-orphan")


class GoodsBasket(Base):
    __tablename__ = "goods_baskets"

    goods_id = Column(Integer, ForeignKey("goods.id"), primary_key=True, index=True)
    basket_id = Column(Integer, ForeignKey("baskets.id"), primary_key=True, index=True)
    count = Column(Integer, default=1, nullable=False)
    
    # Отношения
    goods = relationship("Goods", back_populates="basket_items")
    basket = relationship("Basket", back_populates="goods_items")


# ================ ТАБЛИЦА СВЯЗЕЙ РОЛЕЙ И РАЗРЕШЕНИЙ ================

from sqlalchemy import Table

role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)


# ================ СТАРЫЕ МОДЕЛИ (для обратной совместимости) ================

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    date = Column(String, nullable=False)
    time = Column(String, nullable=False)
    guests = Column(Integer, nullable=False)
    special_requests = Column(Text, nullable=True)
    is_confirmed = Column(Boolean, default=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Отношения
    restaurant = relationship("Restaurant", backref="reservations")
    table = relationship("Table", backref="reservations")


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, index=True, nullable=False)
    name = Column(String, nullable=False)
    seats = Column(Integer, nullable=False, default=2)
    x = Column(Integer, nullable=True)
    y = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
