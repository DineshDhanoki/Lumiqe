"""
Lumiqe — Token Utilities.

Token store for password reset and email verification flows.
Uses Redis when available, falls back to in-memory.
Extracted from password_reset to break circular dependency.

Tokens are URL-safe, single-use, and expire after a configurable period.
"""

import json
import logging
import secrets
from datetime import datetime, timedelta, timezone

logger = logging.getLogger("lumiqe.token_utils")

# ─── Configuration ──────────────────────────────────────────

_MAX_TOKENS = 10_000
_TOKEN_EXPIRY_MINUTES = 30
_TOKEN_REDIS_PREFIX = "lumiqe:token:"

# ─── In-Memory Token Store (fallback) ───────────────────────

_token_store: dict[str, dict] = {}


def _evict_expired() -> int:
    """Remove all expired tokens from the store. Returns count evicted."""
    now = datetime.now(timezone.utc)
    expired_keys = [
        key for key, entry in _token_store.items()
        if entry["expires_at"] <= now
    ]
    for key in expired_keys:
        del _token_store[key]

    if expired_keys:
        logger.info(f"Evicted {len(expired_keys)} expired tokens")

    return len(expired_keys)


def _get_redis():
    """Return (redis_client, is_available) from rate_limiter, or (None, False)."""
    try:
        from app.core.rate_limiter import _redis_client, _redis_available
        return _redis_client, _redis_available
    except ImportError:
        return None, False


async def generate_token(email: str, token_type: str) -> str:
    """
    Generate a URL-safe token and store it with an expiry.

    Args:
        email: User email address (will be normalised to lowercase).
        token_type: Token purpose (e.g., "password_reset", "email_verify").

    Returns:
        A URL-safe token string.
    """
    token = secrets.token_urlsafe(32)
    normalised_email = email.strip().lower()
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=_TOKEN_EXPIRY_MINUTES
    )
    ttl_seconds = _TOKEN_EXPIRY_MINUTES * 60

    redis_client, redis_available = _get_redis()

    if redis_available and redis_client:
        payload = json.dumps({
            "email": normalised_email,
            "type": token_type,
            "expires_at": expires_at.isoformat(),
        })
        await redis_client.set(
            f"{_TOKEN_REDIS_PREFIX}{token}",
            payload,
            ex=ttl_seconds,
        )
    else:
        # In-memory fallback with capacity management
        if len(_token_store) >= _MAX_TOKENS:
            evicted = _evict_expired()
            if evicted == 0 and len(_token_store) >= _MAX_TOKENS:
                oldest_key = next(iter(_token_store))
                del _token_store[oldest_key]
                logger.warning(
                    "Token store at capacity with no expired entries — "
                    "evicted oldest token"
                )

        _token_store[token] = {
            "email": normalised_email,
            "type": token_type,
            "expires_at": expires_at,
        }

    logger.info(
        f"Generated {token_type} token for {normalised_email} "
        f"(expires {expires_at.isoformat()})"
    )

    return token


async def validate_token(token: str, token_type: str) -> str | None:
    """
    Validate and consume a token (single-use).

    Args:
        token: The token string to validate.
        token_type: Expected token type (must match the stored type).

    Returns:
        The associated email address if valid, or None.
    """
    redis_client, redis_available = _get_redis()

    if redis_available and redis_client:
        redis_key = f"{_TOKEN_REDIS_PREFIX}{token}"
        raw = await redis_client.get(redis_key)
        if raw is None:
            logger.debug("Token validation failed: token not found")
            return None

        entry = json.loads(raw)
        entry["expires_at"] = datetime.fromisoformat(entry["expires_at"])

        if entry["type"] != token_type:
            logger.debug(
                f"Token validation failed: type mismatch "
                f"(expected {token_type}, got {entry['type']})"
            )
            return None

        now = datetime.now(timezone.utc)
        if entry["expires_at"] <= now:
            await redis_client.delete(redis_key)
            logger.debug("Token validation failed: token expired")
            return None

        # Consume the token (one-time use)
        await redis_client.delete(redis_key)
        email = entry["email"]
        logger.info(f"Token validated and consumed for {email} ({token_type})")
        return email
    else:
        entry = _token_store.get(token)

        if entry is None:
            logger.debug("Token validation failed: token not found")
            return None

        if entry["type"] != token_type:
            logger.debug(
                f"Token validation failed: type mismatch "
                f"(expected {token_type}, got {entry['type']})"
            )
            return None

        now = datetime.now(timezone.utc)
        if entry["expires_at"] <= now:
            del _token_store[token]
            logger.debug("Token validation failed: token expired")
            return None

        # Consume the token (one-time use)
        email = entry["email"]
        del _token_store[token]

        logger.info(f"Token validated and consumed for {email} ({token_type})")
        return email
