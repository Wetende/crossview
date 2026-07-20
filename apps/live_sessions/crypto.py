import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


def _fernet():
    configured = str(getattr(settings, "LIVE_SESSION_ENCRYPTION_KEY", "") or "").strip()
    key = configured.encode() if configured else base64.urlsafe_b64encode(
        hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    )
    return Fernet(key)


def encrypt_session_secret(value):
    return _fernet().encrypt(str(value).encode()).decode() if value else ""


def decrypt_session_secret(ciphertext):
    if not ciphertext:
        return ""
    try:
        return _fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken:
        return ""
