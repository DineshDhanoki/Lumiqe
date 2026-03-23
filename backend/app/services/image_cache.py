"""
Lumiqe — LRU Image Cache.

In-memory LRU cache for processed image data. Bounded by both entry count
and total byte size to prevent unbounded memory growth.

Key generation uses SHA-256 hashing of the provided key parts for
consistent, collision-resistant cache keys.
"""

import hashlib
import logging
from collections import OrderedDict
from typing import Callable

logger = logging.getLogger("lumiqe.image_cache")

# ─── Configuration ──────────────────────────────────────────

_MAX_ENTRIES = 500
_MAX_BYTES = 100 * 1024 * 1024  # 100 MB

# ─── Cache State ────────────────────────────────────────────

_cache: OrderedDict[str, bytes] = OrderedDict()
_cache_bytes: int = 0


# ─── Key Generation ─────────────────────────────────────────


def _make_key(key_parts: list) -> str:
    """Generate a SHA-256 cache key from a list of parts."""
    raw = "|".join(str(p) for p in key_parts)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


# ─── Eviction ───────────────────────────────────────────────


def _evict_until_fits(incoming_size: int) -> None:
    """Evict oldest entries until the cache can fit a new entry."""
    global _cache_bytes

    while _cache and (
        len(_cache) >= _MAX_ENTRIES
        or (_cache_bytes + incoming_size) > _MAX_BYTES
    ):
        evicted_key, evicted_data = _cache.popitem(last=False)
        _cache_bytes -= len(evicted_data)
        logger.debug(
            f"Evicted cache entry {evicted_key[:12]}... "
            f"({len(evicted_data)} bytes)"
        )


# ─── Public API ─────────────────────────────────────────────


def get(key_parts: list) -> bytes | None:
    """
    Retrieve cached image data by key parts.

    Moves the entry to the end of the LRU order on access.

    Args:
        key_parts: List of values that uniquely identify the cached item.

    Returns:
        Cached bytes if found, otherwise None.
    """
    key = _make_key(key_parts)
    data = _cache.get(key)

    if data is None:
        logger.debug(f"Cache miss: {key[:12]}...")
        return None

    # LRU touch — move to most-recently-used end
    _cache.move_to_end(key)
    logger.debug(f"Cache hit: {key[:12]}... ({len(data)} bytes)")
    return data


def put(key_parts: list, data: bytes) -> None:
    """
    Store image data in the cache.

    Evicts oldest entries if the cache would exceed size or count limits.

    Args:
        key_parts: List of values that uniquely identify the cached item.
        data: Raw image bytes to cache.
    """
    global _cache_bytes

    key = _make_key(key_parts)
    incoming_size = len(data)

    # If the single entry exceeds the max, don't cache it
    if incoming_size > _MAX_BYTES:
        logger.warning(
            f"Skipping cache: entry size ({incoming_size} bytes) "
            f"exceeds max cache size ({_MAX_BYTES} bytes)"
        )
        return

    # Remove existing entry if updating
    if key in _cache:
        old_data = _cache.pop(key)
        _cache_bytes -= len(old_data)

    _evict_until_fits(incoming_size)

    _cache[key] = data
    _cache_bytes += incoming_size

    logger.debug(
        f"Cached {key[:12]}... ({incoming_size} bytes, "
        f"total: {len(_cache)} entries / {_cache_bytes} bytes)"
    )


def get_or_generate(key_parts: list, generator: Callable) -> bytes:
    """
    Cache-through pattern: return cached data or generate and cache it.

    Args:
        key_parts: List of values that uniquely identify the cached item.
        generator: A callable that returns bytes when the cache misses.

    Returns:
        Cached or freshly generated image bytes.
    """
    cached = get(key_parts)
    if cached is not None:
        return cached

    logger.debug(f"Generating data for {_make_key(key_parts)[:12]}...")
    data = generator()
    put(key_parts, data)
    return data


def stats() -> dict:
    """
    Return cache statistics.

    Returns:
        Dictionary with entries, total_bytes, max_entries, and max_bytes.
    """
    return {
        "entries": len(_cache),
        "total_bytes": _cache_bytes,
        "max_entries": _MAX_ENTRIES,
        "max_bytes": _MAX_BYTES,
    }
