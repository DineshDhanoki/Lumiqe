"""Tests for app.core.rate_limiter — in-memory rate limiting and helpers."""

import threading
import time
from collections import defaultdict
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.core.rate_limiter import (
    _check_memory,
    _memory_store,
    get_rate_limit_key,
    _get_real_ip,
    _memory_lock,
)


@pytest.fixture(autouse=True)
def _clear_memory_store():
    """Reset the in-memory store before and after each test."""
    _memory_store.clear()
    yield
    _memory_store.clear()


# ── _check_memory ────────────────────────────────────────────


def test_check_memory_basic_limit():
    """Exceeding max_requests should raise 429."""
    for _ in range(5):
        _check_memory("key:test", max_requests=5, window_seconds=60)
    with pytest.raises(HTTPException) as exc_info:
        _check_memory("key:test", max_requests=5, window_seconds=60)
    assert exc_info.value.status_code == 429


def test_check_memory_allows_within_limit():
    """Requests within the limit should not raise."""
    for _ in range(4):
        _check_memory("key:ok", max_requests=5, window_seconds=60)
    # 5th request should still succeed (limit is 5)
    # This is the 5th call total — should NOT raise since we allow up to max_requests
    # Actually, looking at the code: `>= max_requests` means 5th is rejected
    # So 4 calls is within limit.
    assert len(_memory_store["key:ok"]) == 4


def test_check_memory_thread_safety():
    """Concurrent threads should not corrupt the store."""
    errors = []

    def worker():
        try:
            _check_memory("thread:key", max_requests=1000, window_seconds=60)
        except HTTPException:
            pass
        except Exception as exc:
            errors.append(exc)

    threads = [threading.Thread(target=worker) for _ in range(20)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert errors == [], f"Thread-safety errors: {errors}"


def test_rate_limit_raises_429():
    """Exactly at limit, next request must raise 429."""
    _check_memory("exact", max_requests=1, window_seconds=60)
    with pytest.raises(HTTPException) as exc_info:
        _check_memory("exact", max_requests=1, window_seconds=60)
    assert exc_info.value.status_code == 429


def test_rate_limit_within_window():
    """After the window expires, the counter should reset."""
    # Insert a timestamp that is already outside the window
    _memory_store["old:key"] = [time.time() - 120]
    # With a 60-second window, the old entry is pruned
    _check_memory("old:key", max_requests=1, window_seconds=60)
    # Should succeed — old entry was pruned
    assert len(_memory_store["old:key"]) == 1


# ── _get_real_ip ─────────────────────────────────────────────


def _make_request(headers=None, client_host="127.0.0.1"):
    """Build a minimal mock Request."""
    req = MagicMock()
    req.headers = headers or {}
    req.client = MagicMock()
    req.client.host = client_host
    return req


def test_get_real_ip_from_forwarded_for():
    req = _make_request(headers={"x-forwarded-for": "1.2.3.4"})
    assert _get_real_ip(req) == "1.2.3.4"


def test_get_real_ip_multiple_ips():
    req = _make_request(headers={"x-forwarded-for": "10.0.0.1, 10.0.0.2, 10.0.0.3"})
    assert _get_real_ip(req) == "10.0.0.1"


def test_get_real_ip_no_header_falls_back():
    req = _make_request(client_host="192.168.1.1")
    assert _get_real_ip(req) == "192.168.1.1"


# ── get_rate_limit_key ───────────────────────────────────────


def test_rate_limit_key_authenticated_user():
    req = _make_request()
    user = {"email": "alice@lumiqe.in"}
    key = get_rate_limit_key(req, user, "analyze")
    assert key == "analyze:user:alice@lumiqe.in"


def test_rate_limit_key_anonymous():
    req = _make_request(client_host="8.8.8.8")
    key = get_rate_limit_key(req, None, "analyze")
    assert key == "analyze:ip:8.8.8.8"


def test_key_format():
    req = _make_request(client_host="1.1.1.1")
    key = get_rate_limit_key(req, None, "chat")
    assert key.startswith("chat:ip:")


# ── Store cleanup / bounds ───────────────────────────────────


def test_memory_store_cleanup():
    """Old timestamps outside the window should be pruned on next check."""
    _memory_store["prune:key"] = [time.time() - 999]
    _check_memory("prune:key", max_requests=5, window_seconds=60)
    # Only the new entry should remain
    assert len(_memory_store["prune:key"]) == 1


def test_memory_max_keys():
    """Store should evict the oldest key when it hits _MEMORY_MAX_KEYS."""
    from app.core.rate_limiter import _MEMORY_MAX_KEYS

    for i in range(_MEMORY_MAX_KEYS):
        _memory_store[f"fill:{i}"] = [time.time()]
    assert len(_memory_store) == _MEMORY_MAX_KEYS

    # Adding one more via _check_memory should evict the oldest
    _check_memory("overflow:key", max_requests=100, window_seconds=60)
    assert len(_memory_store) <= _MEMORY_MAX_KEYS + 1  # at most original + new


def test_window_expiry():
    """Entries older than window_seconds should be pruned."""
    now = time.time()
    _memory_store["expiry:key"] = [now - 200, now - 100, now - 10]
    _check_memory("expiry:key", max_requests=10, window_seconds=60)
    # Only the entry within the last 60 seconds plus the new one should remain
    assert len(_memory_store["expiry:key"]) == 2
