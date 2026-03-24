"""Tests for token_utils — in-memory fallback path (no Redis required)."""

import os
from datetime import datetime, timedelta, timezone

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-must-be-32-chars-minimum")

import pytest  # noqa: E402

from app.core.token_utils import (  # noqa: E402
    _token_store,
    generate_token,
    validate_token,
)


@pytest.fixture(autouse=True)
def _clear_token_store():
    """Reset the in-memory token store before each test."""
    _token_store.clear()
    yield
    _token_store.clear()


@pytest.mark.asyncio
async def test_generate_returns_url_safe_string():
    token = await generate_token("user@example.com", "password_reset")
    assert all(c.isalnum() or c in ("_", "-") for c in token)


@pytest.mark.asyncio
async def test_token_uniqueness():
    t1 = await generate_token("a@b.com", "password_reset")
    t2 = await generate_token("a@b.com", "password_reset")
    assert t1 != t2


@pytest.mark.asyncio
async def test_valid_token_returns_email():
    token = await generate_token("test@example.com", "password_reset")
    email = await validate_token(token, "password_reset")
    assert email == "test@example.com"


@pytest.mark.asyncio
async def test_consumed_token_returns_none():
    """Second call must return None (single-use)."""
    token = await generate_token("test@example.com", "password_reset")
    await validate_token(token, "password_reset")
    result = await validate_token(token, "password_reset")
    assert result is None


@pytest.mark.asyncio
async def test_expired_token_rejected():
    """Manually expire a token, then validate it."""
    token = await generate_token("test@example.com", "password_reset")
    _token_store[token]["expires_at"] = datetime.now(timezone.utc) - timedelta(
        minutes=1
    )
    result = await validate_token(token, "password_reset")
    assert result is None


@pytest.mark.asyncio
async def test_uppercase_email_normalised():
    token = await generate_token("User@Example.COM", "email_verify")
    email = await validate_token(token, "email_verify")
    assert email == "user@example.com"
