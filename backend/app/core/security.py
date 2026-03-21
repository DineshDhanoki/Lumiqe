"""
Lumiqe — Security Utilities.

Password hashing, JWT token management, and security helpers.
"""

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


# ─── Password Hashing ────────────────────────────────────────


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return bcrypt.hashpw(
        plain_password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


# ─── JWT Tokens ──────────────────────────────────────────────


def _get_secret_key() -> str:
    """Return the JWT secret key, raising if not configured."""
    key = settings.JWT_SECRET_KEY
    if not key:
        raise RuntimeError(
            "JWT_SECRET_KEY is not set. Add it to your .env file."
        )
    return key


def create_access_token(data: dict) -> str:
    """Create a short-lived access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, _get_secret_key(), algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a long-lived refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, _get_secret_key(), algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT token. Returns payload or None."""
    try:
        payload = jwt.decode(
            token, _get_secret_key(), algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


# ─── File Upload Validation ──────────────────────────────────

# Magic byte signatures for allowed image formats
_IMAGE_SIGNATURES = {
    "jpeg": [b"\xff\xd8\xff"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "webp": [b"RIFF"],  # WebP starts with RIFF, verified with WEBP at offset 8
}


def validate_image_bytes(data: bytes) -> str | None:
    """
    Validate image bytes by checking magic byte signatures.

    Returns the detected format ('jpeg', 'png', 'webp') or None if invalid.
    This is more secure than checking the Content-Type header, which is
    trivially spoofable.
    """
    if len(data) < 12:
        return None

    # JPEG: starts with FF D8 FF
    if data[:3] == b"\xff\xd8\xff":
        return "jpeg"

    # PNG: starts with 89 50 4E 47 0D 0A 1A 0A
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"

    # WebP: starts with RIFF....WEBP
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"

    return None


# ─── LLM Prompt Injection Defense ────────────────────────────

_INJECTION_PATTERNS = [
    "ignore previous",
    "ignore above",
    "disregard",
    "system:",
    "assistant:",
    "user:",
    "you are",
    "act as",
    "pretend",
    "forget",
    "new instructions",
    "override",
    "jailbreak",
]


def sanitize_llm_input(value: str, max_length: int = 100) -> str:
    """
    Sanitize user input before injecting into LLM prompts.

    - Strips control characters
    - Enforces max length
    - Rejects prompt injection patterns
    - Returns cleaned string

    Raises ValueError if injection attempt detected.
    """
    import re

    # Strip control characters (keep printable + spaces)
    cleaned = re.sub(r"[^\x20-\x7E]", "", value).strip()

    # Enforce length
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]

    # Check for injection patterns
    lower = cleaned.lower()
    for pattern in _INJECTION_PATTERNS:
        if pattern in lower:
            raise ValueError(f"Invalid input: contains disallowed pattern")

    return cleaned


