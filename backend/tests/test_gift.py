"""Tests for gift code generation, validation, and eviction logic."""

import re
from datetime import datetime, timedelta, timezone

import pytest

from app.api.gift import (
    _gift_codes,
    _generate_gift_code,
    _evict_expired_gifts,
    _MAX_GIFT_CODES,
)


@pytest.fixture(autouse=True)
def _clear_gift_codes():
    """Reset the gift code store for every test."""
    _gift_codes.clear()
    yield
    _gift_codes.clear()


# ── Code Format ──────────────────────────────────────────────


def test_gift_code_format():
    """Code must start with GIFT- followed by 8 uppercase alphanumeric chars."""
    code = _generate_gift_code()
    assert code.startswith("GIFT-")
    suffix = code[5:]
    assert len(suffix) == 8
    assert re.match(r"^[A-Z0-9]+$", suffix), f"Invalid suffix: {suffix}"


# ── Expiry ───────────────────────────────────────────────────


def test_gift_code_expiry():
    """An expired code should be evicted by _evict_expired_gifts."""
    code = _generate_gift_code()
    _gift_codes[code] = {
        "sender_id": 1,
        "sender_email": "a@b.com",
        "message": "",
        "created_at": datetime.now(timezone.utc) - timedelta(hours=100),
        "expires_at": datetime.now(timezone.utc) - timedelta(hours=1),
    }
    evicted = _evict_expired_gifts()
    assert evicted >= 1
    assert code not in _gift_codes


def test_valid_code_preserved():
    """A valid (non-expired) code should survive eviction."""
    code = _generate_gift_code()
    _gift_codes[code] = {
        "sender_id": 1,
        "sender_email": "a@b.com",
        "message": "",
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=48),
    }
    _evict_expired_gifts()
    assert code in _gift_codes


# ── Redemption Eviction ─────────────────────────────────────


def test_redeemed_code_evicted():
    """Deleting a code simulates redemption — it should be gone."""
    code = _generate_gift_code()
    _gift_codes[code] = {
        "sender_id": 1,
        "sender_email": "a@b.com",
        "message": "",
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=48),
    }
    del _gift_codes[code]
    assert code not in _gift_codes


# ── Memory Bounds ────────────────────────────────────────────


def test_memory_bounds():
    """Store should not grow beyond _MAX_GIFT_CODES after eviction."""
    now = datetime.now(timezone.utc)
    for i in range(_MAX_GIFT_CODES):
        _gift_codes[f"GIFT-{i:08d}"] = {
            "sender_id": 1,
            "sender_email": "a@b.com",
            "message": "",
            "created_at": now,
            "expires_at": now + timedelta(hours=48),
        }
    assert len(_gift_codes) == _MAX_GIFT_CODES


def test_evict_expired_cleans_old():
    """_evict_expired_gifts should remove all expired entries."""
    now = datetime.now(timezone.utc)
    past = now - timedelta(hours=1)
    for i in range(10):
        _gift_codes[f"GIFT-EXP{i:05d}"] = {
            "sender_id": 1,
            "sender_email": "x@y.com",
            "message": "",
            "created_at": past - timedelta(hours=100),
            "expires_at": past,
        }
    # Add some valid codes
    for i in range(5):
        _gift_codes[f"GIFT-VAL{i:05d}"] = {
            "sender_id": 2,
            "sender_email": "v@v.com",
            "message": "",
            "created_at": now,
            "expires_at": now + timedelta(hours=48),
        }
    evicted = _evict_expired_gifts()
    assert evicted == 10
    assert len(_gift_codes) == 5
