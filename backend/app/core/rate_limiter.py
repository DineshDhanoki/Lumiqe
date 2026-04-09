"""
Lumiqe — Redis-Backed Rate Limiter.

Sliding window rate limiting using Redis. Falls back to in-memory
if Redis is not available (development mode).
"""

import logging
import threading
import time
from collections import defaultdict

from fastapi import HTTPException, Request

from app.core.config import settings

logger = logging.getLogger("lumiqe.rate_limiter")

# ─── In-Memory Fallback (dev only) ───────────────────────────
_memory_store: dict[str, list[float]] = defaultdict(list)
_MEMORY_MAX_KEYS = 10_000  # prevent unbounded growth under bot traffic
_memory_lock = threading.Lock()


# ─── Redis Connection ────────────────────────────────────────
_redis_client = None
_redis_available = False


async def init_redis() -> None:
    """Initialize Redis connection. Graceful on failure."""
    global _redis_client, _redis_available
    redis_url = settings.REDIS_URL
    if not redis_url:
        logger.warning("REDIS_URL not set — using in-memory rate limiting (not production-safe)")
        return

    try:
        import redis.asyncio as aioredis
        _redis_client = aioredis.from_url(redis_url, decode_responses=True)
        await _redis_client.ping()
        _redis_available = True
        logger.info("Redis connected for rate limiting")
    except Exception as exc:
        logger.warning(f"Redis not available — falling back to in-memory: {exc}")
        _redis_available = False


async def close_redis() -> None:
    """Close Redis connection."""
    global _redis_client, _redis_available
    if _redis_client and _redis_available:
        await _redis_client.aclose()
        logger.info("Redis connection closed")


# ─── Rate Limit Check ────────────────────────────────────────


async def check_rate_limit(
    key: str,
    max_requests: int,
    window_seconds: int = 3600,
) -> None:
    """
    Check rate limit for the given key. Raises 429 if exceeded.

    In production (Redis was available at startup), a Redis failure mid-flight
    returns 503 rather than silently falling back to per-pod in-memory dicts.

    Args:
        key: Unique identifier (e.g., "analyze:user@email.com" or "analyze:ip:1.2.3.4")
        max_requests: Maximum requests allowed in the window
        window_seconds: Sliding window duration in seconds (default 1 hour)
    """
    if _redis_available and _redis_client:
        try:
            await _check_redis(key, max_requests, window_seconds)
        except HTTPException:
            raise  # re-raise 429s
        except Exception as exc:
            logger.error(f"Redis rate-limit check failed: {exc}")
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "RATE_LIMITER_UNAVAILABLE",
                    "detail": "Rate limiting service temporarily unavailable. Please retry.",
                    "code": 503,
                },
            )
    elif not settings.REDIS_URL:
        # Local dev with no Redis configured — in-memory is fine
        _check_memory(key, max_requests, window_seconds)
    else:
        # Redis was configured but never connected — shouldn't happen in prod
        # (startup would have failed), but be safe
        raise HTTPException(
            status_code=503,
            detail={
                "error": "RATE_LIMITER_UNAVAILABLE",
                "detail": "Rate limiting service is not available.",
                "code": 503,
            },
        )


async def _check_redis(key: str, max_requests: int, window_seconds: int) -> None:
    """Redis sliding window rate limit check using atomic Lua script."""
    redis_key = f"lumiqe:ratelimit:{key}"
    now = time.time()
    window_start = now - window_seconds

    # Atomic Lua script: prune old entries, count current, add new entry, set TTL
    # All operations execute in a single Redis transaction — no race conditions.
    lua_script = """
    redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1])
    local count = redis.call('ZCARD', KEYS[1])
    if count < tonumber(ARGV[3]) then
        redis.call('ZADD', KEYS[1], ARGV[2], ARGV[2])
        redis.call('EXPIRE', KEYS[1], tonumber(ARGV[4]))
    end
    return count
    """
    current_count = await _redis_client.eval(
        lua_script,
        1,
        redis_key,
        str(window_start),
        str(now),
        str(max_requests),
        str(window_seconds),
    )

    if current_count >= max_requests:
        retry_after = int(window_seconds - (now - window_start))
        raise HTTPException(
            status_code=429,
            detail={
                "error": "RATE_LIMIT_EXCEEDED",
                "detail": f"Too many requests. Please try again in {retry_after} seconds.",
                "code": 429,
            },
            headers={"Retry-After": str(retry_after)},
        )


def _check_memory(key: str, max_requests: int, window_seconds: int) -> None:
    """In-memory fallback for development."""
    with _memory_lock:
        now = time.time()
        window_start = now - window_seconds

        # Drop oldest keys if store is too large (bot protection)
        if len(_memory_store) >= _MEMORY_MAX_KEYS and key not in _memory_store:
            oldest_key = next(iter(_memory_store))
            del _memory_store[oldest_key]

        # Prune old entries for this key
        _memory_store[key] = [ts for ts in _memory_store[key] if ts > window_start]

        if len(_memory_store[key]) >= max_requests:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "RATE_LIMIT_EXCEEDED",
                    "detail": "Too many requests. Please try again later.",
                    "code": 429,
                },
                headers={"Retry-After": str(window_seconds)},
            )

        _memory_store[key].append(now)


def _get_real_ip(request: Request) -> str:
    """Extract the real client IP from X-Forwarded-For header or fallback to client.host.

    Takes the rightmost IP — this is the one added by your trusted reverse proxy.
    The leftmost IP is client-supplied and trivially spoofable.
    """
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Rightmost entry is set by the nearest trusted proxy
        return forwarded_for.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def get_redis():
    """Return the Redis client and availability flag as a tuple.

    Prefer this over importing the private _redis_client/_redis_available directly.
    Returns (client, is_available).
    """
    return _redis_client, _redis_available


def get_rate_limit_key(request: Request, user: dict | None, endpoint: str) -> str:
    """Build a rate limit key from user or IP."""
    if user:
        return f"{endpoint}:user:{user['email']}"
    client_ip = _get_real_ip(request)
    return f"{endpoint}:ip:{client_ip}"
