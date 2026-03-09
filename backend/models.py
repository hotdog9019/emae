from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# ================ Р’Р•РўР’Р¬ Р РђР—Р Р•РЁР•РќРР™ Р Р РћР›Р•Р™ ================

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    # РћС‚РЅРѕС€РµРЅРёСЏ
    roles = relationship("Role", secondary="role_permissions", back_populates="permissions")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    # РћС‚РЅРѕС€РµРЅРёСЏ
    users = relationship("User", back_populates="role")
    permissions = relationship("Permission", secondary="role_permissions", back_populates="roles")


# ================ Р’Р•РўР’Р¬ РџРћР›Р¬Р—РћР’РђРўР•Р›Р•Р™ ================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    # New auth schema (used by current backend routes)
    name = Column(String, nullable=True)
    password = Column(String, nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    registration_date = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    # Legacy schema columns that still exist in app.db and are NOT NULL there.
    email = Column(String, nullable=True)
    username = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    birth_date = Column(String, nullable=True)
    email_verified = Column(Boolean, nullable=True, default=False)
    telegram_id = Column(String, nullable=True, index=True)
    telegram_username = Column(String, nullable=True)
    telegram_photo_url = Column(String, nullable=True)
    vk_id = Column(String, nullable=True, index=True)
    vk_username = Column(String, nullable=True)
    vk_avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=True, default=True)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    
    # РћС‚РЅРѕС€РµРЅРёСЏ
    role = relationship("Role", back_populates="users")
    basket = relationship("Basket", uselist=False, back_populates="user", cascade="all, delete-orphan")


class Basket(Base):
    __tablename__ = "baskets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # РћС‚РЅРѕС€РµРЅРёСЏ
    user = relationship("User", back_populates="basket")
    goods_items = relationship("GoodsBasket", back_populates="basket", cascade="all, delete-orphan")


# ================ Р’Р•РўР’Р¬ РўРћР’РђР РћР’ ================

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    # РћС‚РЅРѕС€РµРЅРёСЏ
    goods = relationship("Goods", back_populates="category")


class Goods(Base):
    __tablename__ = "goods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    import_date = Column(DateTime(timezone=True), server_default=func.now())
    finish_date = Column(DateTime(timezone=True), nullable=True)
    
    # РћС‚РЅРѕС€РµРЅРёСЏ
    category = relationship("Category", back_populates="goods")
    basket_items = relationship("GoodsBasket", back_populates="goods", cascade="all, delete-orphan")


class GoodsBasket(Base):
    __tablename__ = "goods_baskets"

    goods_id = Column(Integer, ForeignKey("goods.id"), primary_key=True, index=True)
    basket_id = Column(Integer, ForeignKey("baskets.id"), primary_key=True, index=True)
    count = Column(Integer, default=1, nullable=False)
    
    # РћС‚РЅРѕС€РµРЅРёСЏ
    goods = relationship("Goods", back_populates="basket_items")
    basket = relationship("Basket", back_populates="goods_items")


# ================ РўРђР‘Р›РР¦Рђ РЎР’РЇР—Р•Р™ Р РћР›Р•Р™ Р Р РђР—Р Р•РЁР•РќРР™ ================

from sqlalchemy import Table

role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)


# ================ РЎРўРђР Р«Р• РњРћР”Р•Р›Р (РґР»СЏ РѕР±СЂР°С‚РЅРѕР№ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё) ================

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

    # РћС‚РЅРѕС€РµРЅРёСЏ
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


class EmailVerificationCode(Base):
    __tablename__ = "email_verification_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    email = Column(String, nullable=False, index=True)
    code = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TelegramLoginCode(Base):
    __tablename__ = "telegram_login_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    telegram_id = Column(String, nullable=False, index=True)
    code = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TelegramMagicLoginToken(Base):
    __tablename__ = "telegram_magic_login_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    telegram_id = Column(String, nullable=False, index=True)
    token = Column(String, nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TelegramBotLoginRequest(Base):
    __tablename__ = "telegram_bot_login_requests"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False, unique=True, index=True)
    telegram_id = Column(String, nullable=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TelegramBotContact(Base):
    __tablename__ = "telegram_bot_contacts"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, nullable=False, unique=True, index=True)
    telegram_username = Column(String, nullable=True, index=True)
    chat_id = Column(String, nullable=False, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TelegramLinkRequest(Base):
    __tablename__ = "telegram_link_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    code = Column(String, nullable=False, unique=True, index=True)
    requested_username = Column(String, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
