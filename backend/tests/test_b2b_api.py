"""Tests for B2B API helpers: rate limiting, pruning, and key hashing."""

import hashlib
import os
import time

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-must-be-32-chars-minimum")

import pytest  # noqa: E402
from fastapi import HTTPException  # noqa: E402

from app.api.b2b_api import (  # noqa: E402
    _B2B_RATE_LIMIT,
    _MAX_RATE_KEYS,
    _check_b2b_rate_limit,
    _hash_key,
    _prune_stale_rate_keys,
    _rate_window,
)


@pytest.fixture(autouse=True)
def _clear_rate_window():
    """Reset the global rate window before each test."""
    _rate_window.clear()
    yield
    _rate_window.clear()


class TestHashKey:
    """Verify SHA-256 key hashing."""

    def test_returns_sha256_hex(self):
        raw = "lmq_test_key_abc123"
        result = _hash_key(raw)
        expected = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        assert result == expected

    def test_different_keys_produce_different_hashes(self):
        assert _hash_key("key_a") != _hash_key("key_b")

    def test_hash_length_is_64(self):
        assert len(_hash_key("anything")) == 64


class TestPruneStaleRateKeys:
    """Verify that stale entries are removed from the rate window."""

    def test_removes_old_entries(self):
        old_timestamp = time.time() - 7200  # 2 hours ago
        _rate_window["old_key"] = [old_timestamp]
        _rate_window["fresh_key"] = [time.time()]

        _prune_stale_rate_keys()

        assert "old_key" not in _rate_window
        assert "fresh_key" in _rate_window

    def test_removes_empty_list_entries(self):
        _rate_window["empty_key"] = []
        _prune_stale_rate_keys()
        assert "empty_key" not in _rate_window


class TestCheckB2BRateLimit:
    """Verify per-key rate limit enforcement."""

    def test_allows_within_limit(self):
        key_hash = "test_hash_allow"
        calls = _check_b2b_rate_limit(key_hash)
        assert calls == 1

    def test_blocks_over_limit(self):
        key_hash = "test_hash_block"
        _rate_window[key_hash] = [time.time()] * _B2B_RATE_LIMIT

        with pytest.raises(HTTPException) as exc_info:
            _check_b2b_rate_limit(key_hash)
        assert exc_info.value.status_code == 429


class TestMaxRateKeysCap:
    """Verify eviction when the rate window hits capacity."""

    def test_evicts_oldest_when_full(self):
        # Fill to capacity
        for i in range(_MAX_RATE_KEYS):
            _rate_window[f"key_{i}"] = [time.time()]

        new_key = "brand_new_key"
        _check_b2b_rate_limit(new_key)

        assert new_key in _rate_window
        # Total keys should not exceed max + 1 (new key added after eviction)
        assert len(_rate_window) <= _MAX_RATE_KEYS + 1
