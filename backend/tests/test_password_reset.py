"""Tests for app.core.token_utils — token generation, validation, and eviction."""

import re
from unittest.mock import patch
from datetime import datetime, timedelta, timezone

import pytest

from app.core.token_utils import (
    generate_token,
    validate_token,
    _token_store,
    _MAX_TOKENS,
    _TOKEN_EXPIRY_MINUTES,
)


@pytest.fixture(autouse=True)
def _clear_token_store():
    """Ensure a clean token store for every test."""
    _token_store.clear()
    yield
    _token_store.clear()


# ── Generation ───────────────────────────────────────────────


def test_generate_token_returns_string():
    token = generate_token("user@example.com", "reset")
    assert isinstance(token, str)
    assert len(token) > 0


def test_generate_token_unique():
    token_a = generate_token("user@example.com", "reset")
    token_b = generate_token("user@example.com", "reset")
    assert token_a != token_b


def test_generate_token_email_normalization():
    token = generate_token("User@Example.COM", "reset")
    entry = _token_store[token]
    assert entry["email"] == "user@example.com"


def test_generate_token_url_safe():
    """Token must not contain +, /, or = (URL-unsafe base64 chars)."""
    for _ in range(50):
        token = generate_token("a@b.com", "reset")
        assert re.search(r"[+/=]", token) is None, (
            f"Token contains URL-unsafe character: {token}"
        )


def test_generate_different_types():
    """Tokens of different types are stored independently."""
    token_reset = generate_token("a@b.com", "reset")
    token_verify = generate_token("a@b.com", "verify")
    assert _token_store[token_reset]["type"] == "reset"
    assert _token_store[token_verify]["type"] == "verify"


# ── Validation ───────────────────────────────────────────────


def test_token_returns_email():
    token = generate_token("test@lumiqe.in", "reset")
    email = validate_token(token, "reset")
    assert email == "test@lumiqe.in"


def test_validate_token_consumes():
    """Second validate of the same token must return None (single-use)."""
    token = generate_token("u@u.com", "reset")
    assert validate_token(token, "reset") == "u@u.com"
    assert validate_token(token, "reset") is None


def test_validate_token_wrong_type():
    token = generate_token("u@u.com", "reset")
    assert validate_token(token, "verify") is None


def test_validate_token_expired():
    token = generate_token("u@u.com", "reset")
    future = datetime.now(timezone.utc) + timedelta(minutes=_TOKEN_EXPIRY_MINUTES + 1)
    with patch("app.core.token_utils.datetime") as mock_dt:
        mock_dt.now.return_value = future
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        result = validate_token(token, "reset")
    assert result is None


def test_validate_token_invalid_token():
    assert validate_token("not-a-real-token-abc123", "reset") is None


# ── Eviction / Store Limits ──────────────────────────────────


def test_eviction_on_max_tokens():
    """Filling the store to _MAX_TOKENS must trigger cleanup."""
    for i in range(_MAX_TOKENS):
        generate_token(f"user{i}@test.com", "reset")
    assert len(_token_store) == _MAX_TOKENS
    # One more should still succeed (oldest evicted)
    generate_token("overflow@test.com", "reset")
    assert len(_token_store) <= _MAX_TOKENS


def test_cleanup_expired():
    """Expired tokens are removed when the store reaches capacity."""
    past = datetime.now(timezone.utc) - timedelta(minutes=1)
    for i in range(5):
        tok = generate_token(f"old{i}@test.com", "reset")
        _token_store[tok]["expires_at"] = past

    valid_before = len([
        v for v in _token_store.values()
        if v["expires_at"] > datetime.now(timezone.utc)
    ])

    # Trigger eviction by filling to limit
    for i in range(_MAX_TOKENS):
        generate_token(f"new{i}@test.com", "reset")

    # Expired tokens should have been cleaned up
    for entry in _token_store.values():
        assert entry["expires_at"] > datetime.now(timezone.utc) - timedelta(seconds=5)


def test_token_store_limit():
    """The store never exceeds _MAX_TOKENS."""
    for i in range(_MAX_TOKENS + 100):
        generate_token(f"u{i}@t.com", "reset")
    assert len(_token_store) <= _MAX_TOKENS
