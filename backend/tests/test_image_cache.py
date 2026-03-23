"""Tests for app.services.image_cache — LRU cache with size bounds."""

import pytest

from app.services import image_cache as _mod


@pytest.fixture(autouse=True)
def _reset_cache():
    """Reset cache state before and after each test."""
    _mod._cache.clear()
    _mod._cache_bytes = 0
    yield
    _mod._cache.clear()
    _mod._cache_bytes = 0


# ── Basic get / put ──────────────────────────────────────────


def test_put_and_get():
    _mod.put(["img", "1"], b"hello")
    assert _mod.get(["img", "1"]) == b"hello"


def test_get_miss_returns_none():
    assert _mod.get(["nonexistent"]) is None


# ── Eviction ─────────────────────────────────────────────────


def test_lru_eviction_by_count():
    """Exceeding _MAX_ENTRIES should evict the oldest."""
    original_max = _mod._MAX_ENTRIES
    _mod._MAX_ENTRIES = 3
    try:
        _mod.put(["a"], b"1")
        _mod.put(["b"], b"2")
        _mod.put(["c"], b"3")
        _mod.put(["d"], b"4")  # should evict ["a"]
        assert _mod.get(["a"]) is None
        assert _mod.get(["d"]) == b"4"
    finally:
        _mod._MAX_ENTRIES = original_max


def test_lru_eviction_by_size():
    """Exceeding _MAX_BYTES should evict oldest entries."""
    original_max = _mod._MAX_BYTES
    _mod._MAX_BYTES = 10
    try:
        _mod.put(["x"], b"12345")   # 5 bytes
        _mod.put(["y"], b"12345")   # 5 bytes, total 10
        _mod.put(["z"], b"123456")  # 6 bytes, must evict to fit
        assert _mod.get(["x"]) is None
        assert _mod.get(["z"]) == b"123456"
    finally:
        _mod._MAX_BYTES = original_max


def test_lru_touch():
    """Accessing an entry via get() should move it to the end (most recent)."""
    original_max = _mod._MAX_ENTRIES
    _mod._MAX_ENTRIES = 3
    try:
        _mod.put(["a"], b"1")
        _mod.put(["b"], b"2")
        _mod.put(["c"], b"3")
        # Touch "a" to move it to end
        _mod.get(["a"])
        # Insert "d" — should evict "b" (now oldest), not "a"
        _mod.put(["d"], b"4")
        assert _mod.get(["a"]) is not None
        assert _mod.get(["b"]) is None
    finally:
        _mod._MAX_ENTRIES = original_max


# ── get_or_generate ──────────────────────────────────────────


def test_get_or_generate_caches():
    call_count = 0

    def generator():
        nonlocal call_count
        call_count += 1
        return b"generated"

    result = _mod.get_or_generate(["gen", "1"], generator)
    assert result == b"generated"
    assert call_count == 1


def test_get_or_generate_returns_cached():
    call_count = 0

    def generator():
        nonlocal call_count
        call_count += 1
        return b"data"

    _mod.get_or_generate(["gen", "2"], generator)
    result = _mod.get_or_generate(["gen", "2"], generator)
    assert result == b"data"
    assert call_count == 1  # generator only called once


# ── Stats ────────────────────────────────────────────────────


def test_stats():
    _mod.put(["s1"], b"abc")
    _mod.put(["s2"], b"defgh")
    info = _mod.stats()
    assert info["entries"] == 2
    assert info["total_bytes"] == 8
    assert "max_entries" in info
    assert "max_bytes" in info


# ── Key Generation ───────────────────────────────────────────


def test_key_determinism():
    """Same key_parts must produce the same hash."""
    k1 = _mod._make_key(["user", 42, "v1"])
    k2 = _mod._make_key(["user", 42, "v1"])
    assert k1 == k2


def test_key_different_parts():
    k1 = _mod._make_key(["user", 1])
    k2 = _mod._make_key(["user", 2])
    assert k1 != k2


# ── Fixture Isolation ────────────────────────────────────────


def test_cache_reset_between_tests():
    """The autouse fixture should guarantee an empty cache at test start."""
    assert len(_mod._cache) == 0
    assert _mod._cache_bytes == 0
