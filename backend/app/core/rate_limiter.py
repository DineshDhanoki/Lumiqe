"""
Lumiqe — Redis-Backed Rate Limiter.

Sliding window rate limiting using Redis. Falls back to in-memory
if Redis is not available (development mode).
"""

import logging
import time
from collections import defaultdict

from fastapi import HTTPException, Request

from app.core.config import settings

logger = logging.getLogger("lumiqe.rate_limiter")

# ─── In-Memory Fallback (dev only) ───────────────────────────
_memory_store: dict[str, list[float]] = defaultdict(list)


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

    Args:
        key: Unique identifier (e.g., "analyze:user@email.com" or "analyze:ip:1.2.3.4")
        max_requests: Maximum requests allowed in the window
        window_seconds: Sliding window duration in seconds (default 1 hour)
    """
    if _redis_available and _redis_client:
        await _check_redis(key, max_requests, window_seconds)
    else:
        _check_memory(key, max_requests, window_seconds)


async def _check_redis(key: str, max_requests: int, window_seconds: int) -> None:
    """Redis sliding window rate limit check."""
    redis_key = f"lumiqe:ratelimit:{key}"
    now = time.time()
    window_start = now - window_seconds

    pipe = _redis_client.pipeline()
    pipe.zremrangebyscore(redis_key, 0, window_start)
    pipe.zcard(redis_key)
    pipe.zadd(redis_key, {str(now): now})
    pipe.expire(redis_key, window_seconds)
    results = await pipe.execute()

    current_count = results[1]
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
    now = time.time()
    window_start = now - window_seconds

    # Prune old entries
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


def get_rate_limit_key(request: Request, user: dict | None, endpoint: str) -> str:
    """Build a rate limit key from user or IP."""
    if user:
        return f"{endpoint}:user:{user['email']}"
    client_ip = request.client.host if request.client else "unknown"
    return f"{endpoint}:ip:{client_ip}"
