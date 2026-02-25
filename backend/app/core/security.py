import base64
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- Пароли ---

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# --- JWT ---

def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": subject, "exp": expire, "type": "access"}, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    return jwt.encode({"sub": subject, "exp": expire, "type": "refresh"}, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict:
    """Возвращает payload или бросает JWTError."""
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


# --- Шифрование (AES-256-GCM) ---

def _get_key() -> bytes:
    key = settings.encryption_key.encode()
    # Дополняем/обрезаем до 32 байт
    return key[:32].ljust(32, b"\x00")


def encrypt_field(plaintext: str) -> str:
    """Шифрует строку, возвращает base64-строку."""
    if not plaintext:
        return plaintext
    import os
    nonce = os.urandom(12)
    aesgcm = AESGCM(_get_key())
    ct = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ct).decode()


def decrypt_field(ciphertext: str) -> str:
    """Расшифровывает base64-строку."""
    if not ciphertext:
        return ciphertext
    raw = base64.b64decode(ciphertext)
    nonce, ct = raw[:12], raw[12:]
    aesgcm = AESGCM(_get_key())
    return aesgcm.decrypt(nonce, ct, None).decode()
