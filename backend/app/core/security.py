"""
Security utilities — JWT tokens and password hashing.
=======================================================
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import AuthenticationError

# ──────────────────────────────────────────────────────────────
# Password hashing (using bcrypt directly — passlib is broken
# with bcrypt >= 4.1 on Python 3.12+)
# ──────────────────────────────────────────────────────────────


def hash_password(plain: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ──────────────────────────────────────────────────────────────
# JWT access tokens
# ──────────────────────────────────────────────────────────────

def create_access_token(
    user_id: UUID,
    role: str,
    permissions: list[str],
    *,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a signed JWT access token.

    Payload::

        {
            "sub": "<user_id>",
            "role": "user",
            "perms": ["cot", "journal"],
            "exp": <utc_timestamp>,
            "iat": <utc_timestamp>,
            "type": "access"
        }
    """
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta
        or timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "perms": permissions,
        "exp": expire,
        "iat": now,
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """
    Decode and validate an access token.

    Returns the payload dict on success, raises AuthenticationError on failure.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        if payload.get("type") != "access":
            raise AuthenticationError("Invalid token type")
        return payload
    except JWTError as exc:
        raise AuthenticationError(f"Could not validate token: {exc}") from exc


# ──────────────────────────────────────────────────────────────
# Refresh tokens (opaque — stored as SHA-256 hash in DB)
# ──────────────────────────────────────────────────────────────

def generate_refresh_token() -> str:
    """Generate a cryptographically secure random refresh token."""
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    """SHA-256 hash of the refresh token for DB storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def refresh_token_expires_at() -> datetime:
    """Calculate refresh token expiry datetime."""
    return datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_token_expire_days)
