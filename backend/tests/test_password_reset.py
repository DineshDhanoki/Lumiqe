"""Tests for app.core.token_utils — token generation, validation, and eviction."""

import asyncio
import re
from unittest.mock import patch
from datetime import datetime, timedelta, timezone

import pytest

# Patch _get_redis before any token_utils functions are called so the import
# inside generate_token/validate_token returns (None, False) and avoids
# pulling in rate_limiter -> config -> Settings which needs env vars.
with patch("app.core.token_utils._get_redis", return_value=(None, False)):
    pass

from app.core.token_utils import (
    generate_token,
    validate_token,
    _token_store,
    _MAX_TOKENS,
    _TOKEN_EXPIRY_MINUTES,
)


@pytest.fixture(autouse=True)
def _mock_redis_and_clear_store():
    """Ensure a clean token store and mock Redis away for every test."""
    _token_store.clear()
    with patch("app.core.token_utils._get_redis", return_value=(None, False)):
        yield
    _token_store.clear()


# ── Generation ───────────────────────────────────────────────


def test_generate_token_returns_string():
    token = asyncio.run(generate_token("user@example.com", "reset"))
    assert isinstance(token, str)
    assert len(token) > 0


def test_generate_token_unique():
    token_a = asyncio.run(generate_token("user@example.com", "reset"))
    token_b = asyncio.run(generate_token("user@example.com", "reset"))
    assert token_a != token_b


def test_generate_token_email_normalization():
    token = asyncio.run(generate_token("User@Example.COM", "reset"))
    entry = _token_store[token]
    assert entry["email"] == "user@example.com"


def test_generate_token_url_safe():
    """Token must not contain +, /, or = (URL-unsafe base64 chars)."""
    for _ in range(50):
        token = asyncio.run(generate_token("a@b.com", "reset"))
        assert re.search(r"[+/=]", token) is None, (
            f"Token contains URL-unsafe character: {token}"
        )


def test_generate_different_types():
    """Tokens of different types are stored independently."""
    token_reset = asyncio.run(generate_token("a@b.com", "reset"))
    token_verify = asyncio.run(generate_token("a@b.com", "verify"))
    assert _token_store[token_reset]["type"] == "reset"
    assert _token_store[token_verify]["type"] == "verify"


# ── Validation ───────────────────────────────────────────────


def test_token_returns_email():
    token = asyncio.run(generate_token("test@lumiqe.in", "reset"))
    email = asyncio.run(validate_token(token, "reset"))
    assert email == "test@lumiqe.in"


def test_validate_token_consumes():
    """Second validate of the same token must return None (single-use)."""
    token = asyncio.run(generate_token("u@u.com", "reset"))
    assert asyncio.run(validate_token(token, "reset")) == "u@u.com"
    assert asyncio.run(validate_token(token, "reset")) is None


def test_validate_token_wrong_type():
    token = asyncio.run(generate_token("u@u.com", "reset"))
    assert asyncio.run(validate_token(token, "verify")) is None


def test_validate_token_expired():
    token = asyncio.run(generate_token("u@u.com", "reset"))
    future = datetime.now(timezone.utc) + timedelta(minutes=_TOKEN_EXPIRY_MINUTES + 1)
    with patch("app.core.token_utils.datetime") as mock_dt:
        mock_dt.now.return_value = future
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        result = asyncio.run(validate_token(token, "reset"))
    assert result is None


def test_validate_token_invalid_token():
    assert asyncio.run(validate_token("not-a-real-token-abc123", "reset")) is None


# ── Eviction / Store Limits ──────────────────────────────────


def test_eviction_on_max_tokens():
    """Filling the store to _MAX_TOKENS must trigger cleanup."""
    for i in range(_MAX_TOKENS):
        asyncio.run(generate_token(f"user{i}@test.com", "reset"))
    assert len(_token_store) == _MAX_TOKENS
    # One more should still succeed (oldest evicted)
    asyncio.run(generate_token("overflow@test.com", "reset"))
    assert len(_token_store) <= _MAX_TOKENS


def test_cleanup_expired():
    """Expired tokens are removed when the store reaches capacity."""
    past = datetime.now(timezone.utc) - timedelta(minutes=1)
    for i in range(5):
        tok = asyncio.run(generate_token(f"old{i}@test.com", "reset"))
        _token_store[tok]["expires_at"] = past

    # Trigger eviction by filling to limit
    for i in range(_MAX_TOKENS):
        asyncio.run(generate_token(f"new{i}@test.com", "reset"))

    # Expired tokens should have been cleaned up
    for entry in _token_store.values():
        assert entry["expires_at"] > datetime.now(timezone.utc) - timedelta(seconds=5)


def test_token_store_limit():
    """The store never exceeds _MAX_TOKENS."""
    for i in range(_MAX_TOKENS + 100):
        asyncio.run(generate_token(f"u{i}@t.com", "reset"))
    assert len(_token_store) <= _MAX_TOKENS
