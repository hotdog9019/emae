from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func
from database import get_db, SessionLocal
from models import User, Role, Basket, EmailVerificationCode, TelegramLoginCode, TelegramLinkRequest, TelegramMagicLoginToken, TelegramBotLoginRequest, TelegramBotContact
from schemas import UserResponse
from utils import hash_password, verify_password
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
import json
import hmac
import hashlib
import random
import secrets
import smtplib
import threading
import time
from email.message import EmailMessage
from datetime import datetime, timedelta, timezone
from urllib import request as urlrequest
from urllib.parse import urlencode

router = APIRouter(prefix="/api/auth", tags=["authentication"])

_polling_thread = None
_polling_stop_event = threading.Event()
_polling_lock = threading.Lock()
_polling_running = False
_polling_offset = 0


class RegisterPayload(BaseModel):
    name: str
    password: str
    role_id: int = 1
    email: Optional[EmailStr] = None


class LoginPayload(BaseModel):
    name: str
    password: str


class GoogleAuthCode(BaseModel):
    code: str


class VkAuthCode(BaseModel):
    code: str
    redirect_uri: str


class TelegramAuthPayload(BaseModel):
    id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str


class LinkTelegramPayload(TelegramAuthPayload):
    user_id: int


class LinkVkPayload(VkAuthCode):
    user_id: int


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None


class EmailCodeRequest(BaseModel):
    user_id: int
    email: EmailStr


class EmailCodeConfirm(BaseModel):
    user_id: int
    code: str


class TelegramOtpRequest(BaseModel):
    name: str


class TelegramOtpConfirm(BaseModel):
    name: str
    code: str


class TelegramMagicRequest(BaseModel):
    name: str


class TelegramMagicConsume(BaseModel):
    token: str


class TelegramSetWebhookPayload(BaseModel):
    url: str


class TelegramLinkRequestPayload(BaseModel):
    user_id: int
    telegram_username: Optional[str] = None


def _user_columns() -> set:
    return set(User.__table__.columns.keys())


def _has(col: str) -> bool:
    return col in _user_columns()


def _resolve_default_role_id(db: Session) -> int:
    default_role = db.query(Role).filter(Role.id == 1).first() or db.query(Role).first()
    if not default_role:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Role not found")
    return default_role.id


def _public_user_payload(db_user, message: str) -> dict:
    display_name = getattr(db_user, "name", None) or getattr(db_user, "username", None) or getattr(db_user, "email", None) or "user"
    role_id = getattr(db_user, "role_id", None) or 1
    registration_date = getattr(db_user, "registration_date", None) or getattr(db_user, "created_at", None) or datetime.utcnow()
    avatar = getattr(db_user, "telegram_photo_url", None) or getattr(db_user, "vk_avatar_url", None)
    return {
        "id": db_user.id,
        "name": display_name,
        "role_id": role_id,
        "registration_date": registration_date,
        "message": message,
        "avatar_url": avatar,
    }


def _profile_payload(db_user) -> dict:
    return {
        "id": db_user.id,
        "name": getattr(db_user, "name", None) or getattr(db_user, "username", None) or "",
        "full_name": getattr(db_user, "full_name", None) or "",
        "phone": getattr(db_user, "phone", None) or "",
        "birth_date": getattr(db_user, "birth_date", None) or "",
        "email": getattr(db_user, "email", None) or "",
        "email_verified": bool(getattr(db_user, "email_verified", False)),
        "telegram_username": getattr(db_user, "telegram_username", None) or "",
        "telegram_photo_url": getattr(db_user, "telegram_photo_url", None) or "",
        "vk_username": getattr(db_user, "vk_username", None) or "",
        "vk_avatar_url": getattr(db_user, "vk_avatar_url", None) or "",
    }


def _create_user_if_needed(db: Session, payload: dict) -> User:
    user = User(**payload)
    db.add(user)
    db.flush()
    if "user_id" in set(Basket.__table__.columns.keys()):
        existing_basket = db.query(Basket).filter(Basket.user_id == user.id).first()
        if not existing_basket:
            db.add(Basket(user_id=user.id))
    db.commit()
    db.refresh(user)
    return user


def _build_local_payload(db: Session, name: str, password: str, role_id: int, email: Optional[str]) -> dict:
    cols = _user_columns()
    payload = {}
    hashed = hash_password(password)
    safe_email = email or f"{name}@local.user"

    if "name" in cols:
        payload["name"] = name
    if "password" in cols:
        payload["password"] = hashed
    if "role_id" in cols:
        payload["role_id"] = role_id
    if "email" in cols:
        payload["email"] = safe_email
    if "username" in cols:
        payload["username"] = name
    if "hashed_password" in cols:
        payload["hashed_password"] = hashed
    if "full_name" in cols:
        payload["full_name"] = name
    if "is_active" in cols:
        payload["is_active"] = True
    if "email_verified" in cols:
        payload["email_verified"] = False
    return payload


def _build_google_payload(db: Session, email: Optional[str], username: str, display_name: str) -> dict:
    cols = _user_columns()
    payload = {}
    random_password = hash_password(os.urandom(16).hex())

    if "name" in cols:
        payload["name"] = username
    if "password" in cols:
        payload["password"] = random_password
    if "role_id" in cols:
        payload["role_id"] = _resolve_default_role_id(db)
    if "email" in cols:
        payload["email"] = email or f"{username}@google.local"
    if "username" in cols:
        payload["username"] = username
    if "hashed_password" in cols:
        payload["hashed_password"] = random_password
    if "full_name" in cols:
        payload["full_name"] = display_name
    if "is_active" in cols:
        payload["is_active"] = True
    if "email_verified" in cols:
        payload["email_verified"] = bool(email)
    return payload


def _build_telegram_payload(db: Session, tg: TelegramAuthPayload) -> dict:
    cols = _user_columns()
    payload = {}
    username = tg.username or f"tg_{tg.id}"
    display_name = " ".join([x for x in [tg.first_name, tg.last_name] if x]) or username
    random_password = hash_password(os.urandom(16).hex())

    if "name" in cols:
        payload["name"] = username
    if "password" in cols:
        payload["password"] = random_password
    if "role_id" in cols:
        payload["role_id"] = _resolve_default_role_id(db)
    if "email" in cols:
        payload["email"] = f"{username}@telegram.local"
    if "username" in cols:
        payload["username"] = username
    if "hashed_password" in cols:
        payload["hashed_password"] = random_password
    if "full_name" in cols:
        payload["full_name"] = display_name
    if "is_active" in cols:
        payload["is_active"] = True
    if "email_verified" in cols:
        payload["email_verified"] = False
    if "telegram_id" in cols:
        payload["telegram_id"] = str(tg.id)
    if "telegram_username" in cols:
        payload["telegram_username"] = tg.username or ""
    if "telegram_photo_url" in cols:
        payload["telegram_photo_url"] = tg.photo_url or ""
    return payload


def _build_vk_payload(db: Session, vk_user: dict, email: Optional[str]) -> dict:
    cols = _user_columns()
    payload = {}
    vk_id = str(vk_user.get("id", ""))
    username = vk_user.get("screen_name") or f"vk_{vk_id}"
    display_name = " ".join([x for x in [vk_user.get("first_name"), vk_user.get("last_name")] if x]).strip() or username
    random_password = hash_password(os.urandom(16).hex())
    bdate = vk_user.get("bdate")

    if "name" in cols:
        payload["name"] = username
    if "password" in cols:
        payload["password"] = random_password
    if "role_id" in cols:
        payload["role_id"] = _resolve_default_role_id(db)
    if "email" in cols:
        payload["email"] = email or f"{username}@vk.local"
    if "username" in cols:
        payload["username"] = username
    if "hashed_password" in cols:
        payload["hashed_password"] = random_password
    if "full_name" in cols:
        payload["full_name"] = display_name
    if "is_active" in cols:
        payload["is_active"] = True
    if "email_verified" in cols:
        payload["email_verified"] = bool(email)
    if "vk_id" in cols:
        payload["vk_id"] = vk_id
    if "vk_username" in cols:
        payload["vk_username"] = username
    if "vk_avatar_url" in cols:
        payload["vk_avatar_url"] = vk_user.get("photo_200", "")
    if "birth_date" in cols and bdate:
        payload["birth_date"] = _vk_birth_to_iso(bdate)
    return payload


def _vk_birth_to_iso(bdate: str) -> str:
    # VK can return "DD.MM.YYYY" or "DD.MM"
    parts = bdate.split(".")
    if len(parts) == 3:
        d, m, y = parts
        if len(y) == 4:
            return f"{y}-{m.zfill(2)}-{d.zfill(2)}"
    return ""


def _find_user_for_login(db: Session, login_value: str):
    cols = _user_columns()
    if "name" in cols:
        user = db.query(User).filter(User.name == login_value).first()
        if user:
            return user
    if "username" in cols:
        user = db.query(User).filter(User.username == login_value).first()
        if user:
            return user
    if "email" in cols:
        user = db.query(User).filter(User.email == login_value).first()
        if user:
            return user
    return None


def _find_user_for_telegram_otp(db: Session, login_value: str):
    value = (login_value or "").strip()
    if not value:
        return None

    # Allow OTP request directly by Telegram username: "@myname" or "myname"
    tg_username = value.lstrip("@")
    if tg_username and _has("telegram_username"):
        user = (
            db.query(User)
            .filter(sa_func.lower(User.telegram_username) == tg_username.lower())
            .first()
        )
        if user and getattr(user, "telegram_id", None):
            return user

    # Fallback to local login name/email/username
    user = _find_user_for_login(db, value)
    if user and getattr(user, "telegram_id", None):
        return user
    return None


def _verify_user_password(db_user, raw_password: str) -> bool:
    if hasattr(db_user, "password") and getattr(db_user, "password", None):
        return verify_password(raw_password, db_user.password)
    if hasattr(db_user, "hashed_password") and getattr(db_user, "hashed_password", None):
        return verify_password(raw_password, db_user.hashed_password)
    return False


def _find_google_user(db: Session, email: Optional[str], username: str):
    cols = _user_columns()
    if "email" in cols and email:
        user = db.query(User).filter(User.email == email).first()
        if user:
            return user
    if "name" in cols:
        user = db.query(User).filter(User.name == username).first()
        if user:
            return user
    if "username" in cols:
        user = db.query(User).filter(User.username == username).first()
        if user:
            return user
    return None


def _verify_telegram_auth(payload: TelegramAuthPayload) -> None:
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Telegram is not configured")

    data = payload.model_dump()
    received_hash = data.pop("hash")
    data_check_string = "\n".join([f"{k}={data[k]}" for k in sorted(data.keys()) if data[k] is not None])
    secret_key = hashlib.sha256(bot_token.encode("utf-8")).digest()
    calc_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(calc_hash, received_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Telegram auth hash")

    now_ts = int(datetime.now(tz=timezone.utc).timestamp())
    if now_ts - int(payload.auth_date) > 86400:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Telegram auth data is expired")


def _exchange_google_code(code: str) -> dict:
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback")
    if not client_id or not client_secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Google is not configured")

    body = urlencode({
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }).encode("utf-8")
    req = urlrequest.Request(
        "https://oauth2.googleapis.com/token",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urlrequest.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not exchange Google code")


def _google_userinfo(access_token: str) -> dict:
    req = urlrequest.Request(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        method="GET",
    )
    try:
        with urlrequest.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not fetch Google user info")


def _exchange_vk_code(code: str, redirect_uri: str) -> dict:
    client_id = os.getenv("VK_CLIENT_ID")
    client_secret = os.getenv("VK_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="VK is not configured")
    qs = urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "code": code,
    })
    url = f"https://oauth.vk.com/access_token?{qs}"
    try:
        with urlrequest.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if "error" in data:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"VK auth error: {data.get('error_description', data['error'])}")
            return data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not exchange VK code")


def _vk_userinfo(access_token: str, user_id: str) -> dict:
    qs = urlencode({
        "user_ids": user_id,
        "fields": "photo_200,bdate,screen_name",
        "access_token": access_token,
        "v": "5.199",
    })
    url = f"https://api.vk.com/method/users.get?{qs}"
    try:
        with urlrequest.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("error"):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"VK user info error: {data['error'].get('error_msg', 'unknown')}")
            users = data.get("response") or []
            if not users:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="VK user info is empty")
            return users[0]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not fetch VK user info")


def _send_email_verification_code(email: str, code: str) -> None:
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASS")
    sender = os.getenv("SMTP_FROM", user or "noreply@example.com")
    if not host or not user or not password:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SMTP is not configured")

    msg = EmailMessage()
    msg["Subject"] = "Email verification code"
    msg["From"] = sender
    msg["To"] = email
    msg.set_content(f"Your verification code: {code}\nThis code is valid for 10 minutes.")

    try:
        with smtplib.SMTP(host, port, timeout=10) as smtp:
            smtp.starttls()
            smtp.login(user, password)
            smtp.send_message(msg)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not send verification email")


def _send_telegram_message(chat_id: str, text: str) -> None:
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Telegram bot token is not configured")

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    body = urlencode({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
    }).encode("utf-8")
    req = urlrequest.Request(
        url,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urlrequest.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if not data.get("ok"):
                desc = data.get("description") or "Could not send Telegram message"
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=desc)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not send Telegram message")


def _send_telegram_message_with_button(chat_id: str, text: str, button_text: str, button_url: str) -> None:
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Telegram bot token is not configured")

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    markup = {
        "inline_keyboard": [[{"text": button_text, "url": button_url}]]
    }
    body = urlencode({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "reply_markup": json.dumps(markup, ensure_ascii=False),
    }).encode("utf-8")
    req = urlrequest.Request(
        url,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urlrequest.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if not data.get("ok"):
                desc = data.get("description") or "Could not send Telegram message"
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=desc)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not send Telegram message")


def _create_telegram_otp(db: Session, user: User) -> str:
    code = f"{random.randint(0, 999999):06d}"
    expires_at = datetime.now(tz=timezone.utc) + timedelta(minutes=5)
    rec = TelegramLoginCode(
        user_id=user.id,
        telegram_id=str(user.telegram_id),
        code=code,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(rec)
    db.commit()
    return code


def _generate_link_code() -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(random.choice(alphabet) for _ in range(8))


def _frontend_public_url() -> str:
    explicit = (os.getenv("FRONTEND_PUBLIC_URL") or "").strip().rstrip("/")
    if explicit:
        return explicit
    origins = [o.strip() for o in (os.getenv("FRONTEND_ORIGINS") or "").split(",") if o.strip()]
    if origins:
        return origins[0].rstrip("/")
    return "http://localhost:3000"


def _create_telegram_magic_token(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(tz=timezone.utc) + timedelta(minutes=10)
    rec = TelegramMagicLoginToken(
        user_id=user.id,
        telegram_id=str(user.telegram_id),
        token=token,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(rec)
    db.commit()
    return token


def _telegram_bot_username() -> str:
    username = (os.getenv("TELEGRAM_BOT_USERNAME") or os.getenv("REACT_APP_TELEGRAM_BOT_USERNAME") or "").strip().lstrip("@")
    if username:
        return username
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if token:
        try:
            req = urlrequest.Request(f"https://api.telegram.org/bot{token}/getMe", method="GET")
            with urlrequest.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("ok") and (data.get("result") or {}).get("username"):
                    return str(data["result"]["username"]).strip().lstrip("@")
        except Exception:
            pass
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="TELEGRAM_BOT_USERNAME is not configured",
    )


def _create_telegram_bot_login_request(db: Session) -> str:
    code = secrets.token_urlsafe(12)
    expires_at = datetime.now(tz=timezone.utc) + timedelta(minutes=10)
    rec = TelegramBotLoginRequest(
        code=code,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(rec)
    db.commit()
    return code


def _upsert_telegram_contact(db: Session, chat_id: str, tg_id: str, from_user: dict) -> None:
    username = (from_user.get("username") or "").strip() or None
    first_name = (from_user.get("first_name") or "").strip() or None
    last_name = (from_user.get("last_name") or "").strip() or None
    rec = db.query(TelegramBotContact).filter(TelegramBotContact.telegram_id == str(tg_id)).first()
    if not rec:
        rec = TelegramBotContact(
            telegram_id=str(tg_id),
            telegram_username=username,
            chat_id=str(chat_id),
            first_name=first_name,
            last_name=last_name,
        )
        db.add(rec)
        db.commit()
        return
    changed = False
    if rec.chat_id != str(chat_id):
        rec.chat_id = str(chat_id)
        changed = True
    if username and rec.telegram_username != username:
        rec.telegram_username = username
        changed = True
    if first_name and rec.first_name != first_name:
        rec.first_name = first_name
        changed = True
    if last_name and rec.last_name != last_name:
        rec.last_name = last_name
        changed = True
    if changed:
        db.add(rec)
        db.commit()


def _find_contact_by_username(db: Session, username_or_login: str):
    value = (username_or_login or "").strip()
    if not value:
        return None
    tg_username = value.lstrip("@")
    if not tg_username:
        return None
    return (
        db.query(TelegramBotContact)
        .filter(sa_func.lower(TelegramBotContact.telegram_username) == tg_username.lower())
        .order_by(TelegramBotContact.updated_at.desc())
        .first()
    )


def _create_user_for_telegram_identity(db: Session, tg_id: str, tg_username: str, first_name: str = "", last_name: str = ""):
    cols = _user_columns()
    payload = {}
    login_name = (tg_username or f"tg_{tg_id}").strip()
    display_name = " ".join([x for x in [first_name, last_name] if x]).strip() or login_name
    random_password = hash_password(os.urandom(16).hex())
    if "name" in cols:
        payload["name"] = login_name
    if "password" in cols:
        payload["password"] = random_password
    if "role_id" in cols:
        payload["role_id"] = _resolve_default_role_id(db)
    if "email" in cols:
        payload["email"] = f"{login_name}@telegram.local"
    if "username" in cols:
        payload["username"] = login_name
    if "hashed_password" in cols:
        payload["hashed_password"] = random_password
    if "full_name" in cols:
        payload["full_name"] = display_name
    if "is_active" in cols:
        payload["is_active"] = True
    if "email_verified" in cols:
        payload["email_verified"] = False
    if "telegram_id" in cols:
        payload["telegram_id"] = str(tg_id)
    if "telegram_username" in cols:
        payload["telegram_username"] = tg_username or ""
    if "telegram_photo_url" in cols:
        payload["telegram_photo_url"] = ""
    return _create_user_if_needed(db, payload)


def _find_or_create_user_by_telegram_message(db: Session, tg_id: str, from_user: dict):
    cols = _user_columns()
    username = (from_user.get("username") or "").strip()
    first_name = (from_user.get("first_name") or "").strip()
    last_name = (from_user.get("last_name") or "").strip()

    user = None
    if "telegram_id" in cols:
        user = db.query(User).filter(User.telegram_id == str(tg_id)).first()

    if not user and username and "telegram_username" in cols:
        user = (
            db.query(User)
            .filter(sa_func.lower(User.telegram_username) == username.lower())
            .first()
        )

    if not user and username and "username" in cols:
        user = db.query(User).filter(User.username == username).first()

    if not user:
        payload = {}
        display_name = " ".join([x for x in [first_name, last_name] if x]).strip() or username or f"tg_{tg_id}"
        login_name = username or f"tg_{tg_id}"
        random_password = hash_password(os.urandom(16).hex())
        if "name" in cols:
            payload["name"] = login_name
        if "password" in cols:
            payload["password"] = random_password
        if "role_id" in cols:
            payload["role_id"] = _resolve_default_role_id(db)
        if "email" in cols:
            payload["email"] = f"{login_name}@telegram.local"
        if "username" in cols:
            payload["username"] = login_name
        if "hashed_password" in cols:
            payload["hashed_password"] = random_password
        if "full_name" in cols:
            payload["full_name"] = display_name
        if "is_active" in cols:
            payload["is_active"] = True
        if "email_verified" in cols:
            payload["email_verified"] = False
        if "telegram_id" in cols:
            payload["telegram_id"] = str(tg_id)
        if "telegram_username" in cols:
            payload["telegram_username"] = username
        if "telegram_photo_url" in cols:
            payload["telegram_photo_url"] = ""
        return _create_user_if_needed(db, payload)

    changed = False
    if "telegram_id" in cols and not getattr(user, "telegram_id", None):
        user.telegram_id = str(tg_id)
        changed = True
    if "telegram_username" in cols and username and getattr(user, "telegram_username", "") != username:
        user.telegram_username = username
        changed = True
    if changed:
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _process_telegram_message(db: Session, chat_id: str, tg_id: str, from_user: dict, text: str) -> None:
    if not chat_id or not tg_id:
        return
    _upsert_telegram_contact(db, chat_id, tg_id, from_user)

    if text.startswith("/start"):
        parts = text.split(maxsplit=1)
        start_payload = parts[1].strip() if len(parts) > 1 else ""
        if start_payload.startswith("login_"):
            login_code = start_payload[len("login_"):].strip()
            req = (
                db.query(TelegramBotLoginRequest)
                .filter(
                    TelegramBotLoginRequest.code == login_code,
                    TelegramBotLoginRequest.is_used == False,  # noqa: E712
                )
                .order_by(TelegramBotLoginRequest.created_at.desc())
                .first()
            )
            if not req:
                _send_telegram_message(chat_id, "Login link is invalid or already used.")
                return
            if req.expires_at.replace(tzinfo=timezone.utc) < datetime.now(tz=timezone.utc):
                _send_telegram_message(chat_id, "Login link expired. Please request login again on the website.")
                return

            user = _find_or_create_user_by_telegram_message(db, tg_id, from_user)
            token = _create_telegram_magic_token(db, user)
            login_url = f"{_frontend_public_url()}/auth/telegram/magic?token={token}"
            req.is_used = True
            req.telegram_id = str(tg_id)
            req.user_id = user.id
            db.add(req)
            db.commit()

            msg = "Confirm website login.\nTap the button below:"
            try:
                _send_telegram_message_with_button(chat_id, msg, "Authorize", login_url)
            except HTTPException:
                _send_telegram_message(chat_id, f"Confirm login by link:\n{login_url}")
            return

        _send_telegram_message(
            chat_id,
            "Hello! Commands:\n/otp <login_or_@username>\n/bind <CODE>\n/bindlogin <login_or_email>\n/me",
        )
        return
    if text.startswith("/me"):
        user = db.query(User).filter(User.telegram_id == tg_id).first() if _has("telegram_id") else None
        if user:
            _send_telegram_message(chat_id, f"РџСЂРёРІСЏР·Р°РЅ Р°РєРєР°СѓРЅС‚: {getattr(user, 'name', '') or getattr(user, 'username', '') or user.id}")
        else:
            _send_telegram_message(chat_id, "Рљ СЌС‚РѕРјСѓ Telegram РїРѕРєР° РЅРµ РїСЂРёРІСЏР·Р°РЅ Р°РєРєР°СѓРЅС‚.")
        return

    if text.startswith("/otp"):
        parts = text.split(maxsplit=1)
        if len(parts) < 2 or not parts[1].strip():
            _send_telegram_message(chat_id, "РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ: /otp <Р»РѕРіРёРЅ_РёР»Рё_@username>")
            return
        login_value = parts[1].strip()
        user = _find_user_for_telegram_otp(db, login_value)
        if not user:
            _send_telegram_message(chat_id, "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ РёР»Рё Telegram РЅРµ РїСЂРёРІСЏР·Р°РЅ.")
            return
        if str(getattr(user, "telegram_id", "")) != tg_id:
            _send_telegram_message(chat_id, "Р­С‚РѕС‚ Telegram РЅРµ РїСЂРёРІСЏР·Р°РЅ Рє СѓРєР°Р·Р°РЅРЅРѕРјСѓ Р°РєРєР°СѓРЅС‚Сѓ.")
            return
        code = _create_telegram_otp(db, user)
        _send_telegram_message(chat_id, f"Р’Р°С€ РєРѕРґ РІС…РѕРґР°: <b>{code}</b>\nРљРѕРґ РґРµР№СЃС‚РІРёС‚РµР»РµРЅ 5 РјРёРЅСѓС‚.")
        return

    if text == "/bind" or text.startswith("/bind "):
        parts = text.split(maxsplit=1)
        if len(parts) < 2 or not parts[1].strip():
            _send_telegram_message(chat_id, "РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ: /bind CODE")
            return
        bind_code = parts[1].strip().upper()
        req = (
            db.query(TelegramLinkRequest)
            .filter(
                TelegramLinkRequest.code == bind_code,
                TelegramLinkRequest.is_used == False,  # noqa: E712
            )
            .order_by(TelegramLinkRequest.created_at.desc())
            .first()
        )
        if not req:
            _send_telegram_message(chat_id, "РљРѕРґ РїСЂРёРІСЏР·РєРё РЅРµ РЅР°Р№РґРµРЅ.")
            return
        if req.expires_at.replace(tzinfo=timezone.utc) < datetime.now(tz=timezone.utc):
            _send_telegram_message(chat_id, "РљРѕРґ РїСЂРёРІСЏР·РєРё РёСЃС‚РµРє.")
            return

        user = db.query(User).filter(User.id == req.user_id).first()
        if not user:
            _send_telegram_message(chat_id, "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РґР»СЏ РїСЂРёРІСЏР·РєРё РЅРµ РЅР°Р№РґРµРЅ.")
            return

        if _has("telegram_id"):
            existing = db.query(User).filter(User.telegram_id == tg_id, User.id != user.id).first()
            if existing:
                _send_telegram_message(chat_id, "Р­С‚РѕС‚ Telegram СѓР¶Рµ РїСЂРёРІСЏР·Р°РЅ Рє РґСЂСѓРіРѕРјСѓ Р°РєРєР°СѓРЅС‚Сѓ.")
                return
            user.telegram_id = tg_id
        if _has("telegram_username"):
            user.telegram_username = from_user.get("username", "") or user.telegram_username
        if _has("telegram_photo_url"):
            user.telegram_photo_url = user.telegram_photo_url or ""
        req.is_used = True
        db.add(user)
        db.add(req)
        db.commit()
        _send_telegram_message(chat_id, "Telegram СѓСЃРїРµС€РЅРѕ РїСЂРёРІСЏР·Р°РЅ Рє РІР°С€РµРјСѓ Р°РєРєР°СѓРЅС‚Сѓ.")
        return

    if text.startswith("/bindlogin"):
        parts = text.split(maxsplit=1)
        if len(parts) < 2 or not parts[1].strip():
            _send_telegram_message(chat_id, "РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ: /bindlogin <Р»РѕРіРёРЅ_РёР»Рё_email>")
            return
        login_value = parts[1].strip()
        user = _find_user_for_login(db, login_value)
        if not user:
            _send_telegram_message(chat_id, "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ. РЈРєР°Р¶РёС‚Рµ Р»РѕРіРёРЅ РёР»Рё email РѕС‚ СЃР°Р№С‚Р°.")
            return
        if _has("telegram_id"):
            existing = db.query(User).filter(User.telegram_id == tg_id, User.id != user.id).first()
            if existing:
                _send_telegram_message(chat_id, "Р­С‚РѕС‚ Telegram СѓР¶Рµ РїСЂРёРІСЏР·Р°РЅ Рє РґСЂСѓРіРѕРјСѓ Р°РєРєР°СѓРЅС‚Сѓ.")
                return
            user.telegram_id = tg_id
        if _has("telegram_username"):
            user.telegram_username = from_user.get("username", "") or user.telegram_username
        if _has("telegram_photo_url"):
            user.telegram_photo_url = user.telegram_photo_url or ""
        db.add(user)
        db.commit()
        _send_telegram_message(chat_id, f"Р“РѕС‚РѕРІРѕ. Telegram РїСЂРёРІСЏР·Р°РЅ Рє Р°РєРєР°СѓРЅС‚Сѓ {getattr(user, 'name', '') or getattr(user, 'username', '') or user.id}.")
        return

    _send_telegram_message(chat_id, "Р”РѕСЃС‚СѓРїРЅС‹Рµ РєРѕРјР°РЅРґС‹:\n/start\n/me\n/otp <Р»РѕРіРёРЅ_РёР»Рё_@username>\n/bind <CODE>\n/bindlogin <Р»РѕРіРёРЅ_РёР»Рё_email>")


def _set_telegram_webhook(url: str) -> dict:
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Telegram bot token is not configured")
    api_url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
    body = urlencode({"url": url}).encode("utf-8")
    req = urlrequest.Request(
        api_url,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urlrequest.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if not data.get("ok"):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Telegram setWebhook failed")
            return data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Telegram setWebhook failed")


def _telegram_bot_token() -> str:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Telegram bot token is not configured")
    return token


def _delete_telegram_webhook(drop_pending_updates: bool = True) -> None:
    token = _telegram_bot_token()
    api_url = f"https://api.telegram.org/bot{token}/deleteWebhook"
    body = urlencode({"drop_pending_updates": "true" if drop_pending_updates else "false"}).encode("utf-8")
    req = urlrequest.Request(
        api_url,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urlrequest.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if not data.get("ok"):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Telegram deleteWebhook failed")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Telegram deleteWebhook failed")


def _telegram_get_updates(offset: int, timeout_sec: int = 25) -> dict:
    token = _telegram_bot_token()
    qs = urlencode({
        "offset": offset,
        "timeout": timeout_sec,
    })
    api_url = f"https://api.telegram.org/bot{token}/getUpdates?{qs}"
    req = urlrequest.Request(api_url, method="GET")
    with urlrequest.urlopen(req, timeout=timeout_sec + 5) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        if not data.get("ok"):
            raise RuntimeError("Telegram getUpdates failed")
        return data


@router.post("/register", response_model=UserResponse)
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    existing = _find_user_for_login(db, payload.name)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")
    if _has("email") and payload.email:
        email_taken = db.query(User).filter(User.email == payload.email).first()
        if email_taken:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    if _has("role_id"):
        role = db.query(Role).filter(Role.id == payload.role_id).first()
        if not role:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role not found")

    user = _create_user_if_needed(db, _build_local_payload(db, payload.name, payload.password, payload.role_id, payload.email))
    return _public_user_payload(user, "Registration successful")


@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    user = _find_user_for_login(db, payload.name)
    if not user or not _verify_user_password(user, payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _public_user_payload(user, "Login successful")


@router.post("/telegram/otp/request")
def telegram_otp_request(payload: TelegramOtpRequest, db: Session = Depends(get_db)):
    user = _find_user_for_telegram_otp(db, payload.name)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or Telegram is not linked")

    code = _create_telegram_otp(db, user)

    _send_telegram_message(
        str(user.telegram_id),
        f"Р’Р°С€ РєРѕРґ РІС…РѕРґР°: <b>{code}</b>\nРљРѕРґ РґРµР№СЃС‚РІРёС‚РµР»РµРЅ 5 РјРёРЅСѓС‚.",
    )
    return {"message": "OTP sent to Telegram"}


@router.post("/telegram/otp/confirm")
def telegram_otp_confirm(payload: TelegramOtpConfirm, db: Session = Depends(get_db)):
    user = _find_user_for_telegram_otp(db, payload.name)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or Telegram is not linked")

    now = datetime.now(tz=timezone.utc)
    rec = (
        db.query(TelegramLoginCode)
        .filter(
            TelegramLoginCode.user_id == user.id,
            TelegramLoginCode.telegram_id == str(user.telegram_id),
            TelegramLoginCode.code == payload.code.strip(),
            TelegramLoginCode.is_used == False,  # noqa: E712
        )
        .order_by(TelegramLoginCode.created_at.desc())
        .first()
    )
    if not rec:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code")
    if rec.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP code expired")

    rec.is_used = True
    db.add(rec)
    db.commit()
    db.refresh(user)
    return _public_user_payload(user, "Telegram OTP login successful")


@router.post("/telegram/bot-login/start")
def telegram_bot_login_start(db: Session = Depends(get_db)):
    code = _create_telegram_bot_login_request(db)
    bot_username = _telegram_bot_username()
    auth_url = f"https://t.me/{bot_username}?start=login_{code}"
    return {
        "message": "Telegram bot login started",
        "auth_url": auth_url,
        "expires_in_sec": 600,
    }


@router.post("/telegram/magic/request")
def telegram_magic_request(payload: TelegramMagicRequest, db: Session = Depends(get_db)):
    raw_name = (payload.name or "").strip()
    if not raw_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Telegram username is required")

    tg_username = raw_name.lstrip("@")
    user = None
    if tg_username and _has("telegram_username"):
        user = (
            db.query(User)
            .filter(sa_func.lower(User.telegram_username) == tg_username.lower())
            .first()
        )
    if not user:
        user = _find_user_for_login(db, raw_name)

    tg_id = str(getattr(user, "telegram_id", "") or "") if user else ""
    chat_id = tg_id
    contact = None
    if not tg_id:
        contact = _find_contact_by_username(db, raw_name)
        if contact:
            tg_id = str(contact.telegram_id)
            chat_id = str(contact.chat_id)

    if not tg_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telegram user is not available for bot messages. Open @EmaeFreebot and send /start first.",
        )

    if not user:
        user = _create_user_for_telegram_identity(
            db,
            tg_id=tg_id,
            tg_username=(contact.telegram_username if contact else tg_username),
            first_name=(contact.first_name if contact else ""),
            last_name=(contact.last_name if contact else ""),
        )

    token = _create_telegram_magic_token(db, user)
    login_url = f"{_frontend_public_url()}/auth/telegram/magic?token={token}"
    message = (
        "Р—Р°РїСЂРѕСЃ РЅР° РІС…РѕРґ РІ Р°РєРєР°СѓРЅС‚.\n"
        "РќР°Р¶РјРёС‚Рµ РєРЅРѕРїРєСѓ РЅРёР¶Рµ, С‡С‚РѕР±С‹ Р°РІС‚РѕСЂРёР·РѕРІР°С‚СЊСЃСЏ РЅР° СЃР°Р№С‚Рµ.\n\n"
        "РЎСЃС‹Р»РєР° РґРµР№СЃС‚РІСѓРµС‚ 10 РјРёРЅСѓС‚."
    )
    try:
        _send_telegram_message_with_button(
            str(chat_id),
            message,
            "РђРІС‚РѕСЂРёР·РѕРІР°С‚СЊСЃСЏ",
            login_url,
        )
        return {"message": "Telegram login message sent", "button": True}
    except HTTPException as e:
        # Some Telegram clients/bot API validations reject local URLs in button markup.
        detail = str(getattr(e, "detail", "") or "")
        fallback_text = (
            "Р—Р°РїСЂРѕСЃ РЅР° РІС…РѕРґ РІ Р°РєРєР°СѓРЅС‚.\n"
            "РљРЅРѕРїРєР° СЃРµР№С‡Р°СЃ РЅРµРґРѕСЃС‚СѓРїРЅР°, РёСЃРїРѕР»СЊР·СѓР№С‚Рµ СЃСЃС‹Р»РєСѓ РЅРёР¶Рµ:\n"
            f"{login_url}\n\n"
            "РЎСЃС‹Р»РєР° РґРµР№СЃС‚РІСѓРµС‚ 10 РјРёРЅСѓС‚."
        )
        _send_telegram_message(str(chat_id), fallback_text)
        return {"message": "Telegram login message sent (fallback link)", "button": False, "reason": detail}


@router.post("/telegram/magic/consume")
def telegram_magic_consume(payload: TelegramMagicConsume, db: Session = Depends(get_db)):
    raw_token = (payload.token or "").strip()
    if not raw_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token is required")

    rec = (
        db.query(TelegramMagicLoginToken)
        .filter(
            TelegramMagicLoginToken.token == raw_token,
            TelegramMagicLoginToken.is_used == False,  # noqa: E712
        )
        .order_by(TelegramMagicLoginToken.created_at.desc())
        .first()
    )
    if not rec:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")

    now = datetime.now(tz=timezone.utc)
    if rec.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token expired")

    user = db.query(User).filter(User.id == rec.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    rec.is_used = True
    db.add(rec)
    db.commit()
    db.refresh(user)
    return _public_user_payload(user, "Telegram login successful")


@router.post("/telegram/bot/set-webhook")
def telegram_bot_set_webhook(payload: TelegramSetWebhookPayload):
    data = _set_telegram_webhook(payload.url)
    return {"message": "Webhook is set", "telegram": data}


@router.post("/telegram/bot/webhook")
def telegram_bot_webhook(update: dict, db: Session = Depends(get_db)):
    message = update.get("message") or update.get("edited_message")
    if not message:
        return {"ok": True}

    text = (message.get("text") or "").strip()
    chat = message.get("chat") or {}
    from_user = message.get("from") or {}
    chat_id = str(chat.get("id", ""))
    tg_id = str(from_user.get("id", ""))

    _process_telegram_message(db, chat_id, tg_id, from_user, text)
    return {"ok": True}


def _polling_loop():
    global _polling_running, _polling_offset
    while not _polling_stop_event.is_set():
        try:
            data = _telegram_get_updates(offset=_polling_offset, timeout_sec=20)
            updates = data.get("result", []) or []
            for upd in updates:
                upd_id = int(upd.get("update_id", 0))
                if upd_id >= _polling_offset:
                    _polling_offset = upd_id + 1

                msg = upd.get("message") or upd.get("edited_message")
                if not msg:
                    continue
                text = (msg.get("text") or "").strip()
                chat = msg.get("chat") or {}
                from_user = msg.get("from") or {}
                chat_id = str(chat.get("id", ""))
                tg_id = str(from_user.get("id", ""))
                if not chat_id or not tg_id:
                    continue

                db = SessionLocal()
                try:
                    _process_telegram_message(db, chat_id, tg_id, from_user, text)
                finally:
                    db.close()
        except Exception:
            time.sleep(1)

    _polling_running = False


def start_telegram_polling() -> dict:
    global _polling_thread, _polling_running
    with _polling_lock:
        if _polling_running and _polling_thread and _polling_thread.is_alive():
            return {"running": True, "message": "Polling is already running"}
        _delete_telegram_webhook(drop_pending_updates=False)
        _polling_stop_event.clear()
        _polling_thread = threading.Thread(target=_polling_loop, daemon=True, name="telegram-polling")
        _polling_thread.start()
        _polling_running = True
        return {"running": True, "message": "Polling started"}


def stop_telegram_polling() -> dict:
    global _polling_running
    with _polling_lock:
        if not _polling_running:
            return {"running": False, "message": "Polling is not running"}
        _polling_stop_event.set()
        _polling_running = False
        return {"running": False, "message": "Polling stop signal sent"}


def telegram_polling_status() -> dict:
    alive = bool(_polling_thread and _polling_thread.is_alive())
    return {"running": bool(_polling_running and alive), "offset": _polling_offset}


@router.post("/telegram/bot/polling/start")
def telegram_bot_polling_start():
    return start_telegram_polling()


@router.post("/telegram/bot/polling/stop")
def telegram_bot_polling_stop():
    return stop_telegram_polling()


@router.get("/telegram/bot/polling/status")
def telegram_bot_polling_status():
    return telegram_polling_status()


@router.post("/telegram/link/request")
def telegram_link_request(payload: TelegramLinkRequestPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if _has("telegram_id") and getattr(user, "telegram_id", None):
        return {
            "message": "Telegram is already linked",
            "already_linked": True,
            "telegram_username": getattr(user, "telegram_username", "") or "",
        }

    code = _generate_link_code()
    expires_at = datetime.now(tz=timezone.utc) + timedelta(minutes=10)
    req = TelegramLinkRequest(
        user_id=user.id,
        code=code,
        requested_username=(payload.telegram_username or "").lstrip("@").strip() or None,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(req)
    db.commit()
    return {
        "message": "Link code created",
        "code": code,
        "expires_at": expires_at.isoformat(),
        "instruction": "Open Telegram bot and send /bind CODE",
    }


@router.get("/telegram/link/status/{user_id}")
def telegram_link_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    linked = bool(getattr(user, "telegram_id", None))
    return {
        "linked": linked,
        "telegram_username": getattr(user, "telegram_username", "") or "",
    }


@router.post("/google/callback")
def google_callback(payload: GoogleAuthCode, db: Session = Depends(get_db)):
    token_data = _exchange_google_code(payload.code)
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No access_token from Google")
    info = _google_userinfo(access_token)
    email = info.get("email")
    sub = info.get("sub", "")
    username = email or f"google_{sub}"
    display_name = info.get("name") or username
    user = _find_google_user(db, email=email, username=username)
    if not user:
        user = _create_user_if_needed(db, _build_google_payload(db, email, username, display_name))
    return _public_user_payload(user, "Google login successful")


@router.post("/telegram/callback")
def telegram_callback(payload: TelegramAuthPayload, db: Session = Depends(get_db)):
    _verify_telegram_auth(payload)
    cols = _user_columns()
    user = None
    if "telegram_id" in cols:
        user = db.query(User).filter(User.telegram_id == str(payload.id)).first()
    if not user and payload.username and "username" in cols:
        user = db.query(User).filter(User.username == payload.username).first()
    if not user:
        user = _create_user_if_needed(db, _build_telegram_payload(db, payload))
    return _public_user_payload(user, "Telegram login successful")


@router.post("/vk/callback")
def vk_callback(payload: VkAuthCode, db: Session = Depends(get_db)):
    token = _exchange_vk_code(payload.code, payload.redirect_uri)
    access_token = token.get("access_token")
    vk_user_id = str(token.get("user_id", ""))
    email = token.get("email")
    if not access_token or not vk_user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="VK token payload is invalid")
    vk_user = _vk_userinfo(access_token, vk_user_id)
    cols = _user_columns()
    user = None
    if "vk_id" in cols:
        user = db.query(User).filter(User.vk_id == vk_user_id).first()
    if not user and email and "email" in cols:
        user = db.query(User).filter(User.email == email).first()
    if not user:
        user = _create_user_if_needed(db, _build_vk_payload(db, vk_user, email))
    return _public_user_payload(user, "VK login successful")


@router.post("/telegram/link")
def link_telegram(payload: LinkTelegramPayload, db: Session = Depends(get_db)):
    _verify_telegram_auth(payload)
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if _has("telegram_id"):
        existing = db.query(User).filter(User.telegram_id == str(payload.id), User.id != payload.user_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Telegram account already linked to another user")
        user.telegram_id = str(payload.id)
    if _has("telegram_username"):
        user.telegram_username = payload.username or ""
    if _has("telegram_photo_url"):
        user.telegram_photo_url = payload.photo_url or ""
    if _has("full_name") and not user.full_name:
        user.full_name = " ".join([x for x in [payload.first_name, payload.last_name] if x]).strip()
    db.add(user)
    db.commit()
    db.refresh(user)
    return _profile_payload(user)


@router.post("/vk/link")
def link_vk(payload: LinkVkPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    token = _exchange_vk_code(payload.code, payload.redirect_uri)
    access_token = token.get("access_token")
    vk_user_id = str(token.get("user_id", ""))
    if not access_token or not vk_user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="VK token payload is invalid")

    if _has("vk_id"):
        existing = db.query(User).filter(User.vk_id == vk_user_id, User.id != payload.user_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="VK account already linked to another user")

    vk_user = _vk_userinfo(access_token, vk_user_id)
    if _has("vk_id"):
        user.vk_id = vk_user_id
    if _has("vk_username"):
        user.vk_username = vk_user.get("screen_name") or ""
    if _has("vk_avatar_url"):
        user.vk_avatar_url = vk_user.get("photo_200", "")
    if _has("birth_date") and not user.birth_date:
        user.birth_date = _vk_birth_to_iso(vk_user.get("bdate", ""))
    db.add(user)
    db.commit()
    db.refresh(user)
    return _profile_payload(user)


@router.post("/email/send-code")
def send_email_code(payload: EmailCodeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    code = f"{random.randint(0, 999999):06d}"
    expires_at = datetime.now(tz=timezone.utc) + timedelta(minutes=10)
    rec = EmailVerificationCode(
        user_id=payload.user_id,
        email=str(payload.email),
        code=code,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(rec)
    db.commit()
    _send_email_verification_code(str(payload.email), code)
    return {"message": "Verification code sent"}


@router.post("/email/confirm")
def confirm_email_code(payload: EmailCodeConfirm, db: Session = Depends(get_db)):
    now = datetime.now(tz=timezone.utc)
    rec = (
        db.query(EmailVerificationCode)
        .filter(
            EmailVerificationCode.user_id == payload.user_id,
            EmailVerificationCode.code == payload.code.strip(),
            EmailVerificationCode.is_used == False,  # noqa: E712
        )
        .order_by(EmailVerificationCode.created_at.desc())
        .first()
    )
    if not rec:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")
    if rec.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code expired")

    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if _has("email"):
        user.email = rec.email
    if _has("email_verified"):
        user.email_verified = True
    rec.is_used = True
    db.add(user)
    db.add(rec)
    db.commit()
    db.refresh(user)
    return _profile_payload(user)


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _public_user_payload(user, "OK")


@router.get("/users/{user_id}/profile")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _profile_payload(user)


@router.put("/users/{user_id}/profile")
def update_user_profile(user_id: int, profile: UserProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    cols = _user_columns()

    if profile.name is not None:
        cleaned = profile.name.strip()
        if not cleaned:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name cannot be empty")
        if "name" in cols:
            user.name = cleaned
        if "username" in cols:
            user.username = cleaned
    if profile.full_name is not None and "full_name" in cols:
        user.full_name = profile.full_name.strip()
    if profile.phone is not None and "phone" in cols:
        user.phone = profile.phone.strip()
    if profile.birth_date is not None and "birth_date" in cols:
        user.birth_date = profile.birth_date.strip()

    db.add(user)
    db.commit()
    db.refresh(user)
    return _profile_payload(user)


@router.get("/users", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [_public_user_payload(u, "OK") for u in users]


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    db.delete(user)
    db.commit()
    return None
