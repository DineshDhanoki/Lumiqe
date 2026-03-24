"""Tests for app.api.notifications — Pydantic models, constants, helpers."""

import os
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-characters")

import inspect

import pytest
from pydantic import ValidationError

from app.api.notifications import (
    NotificationOut,
    _MAX_PER_USER,
    _TTL_SECONDS,
    create_notification,
    _memory_store,
)


# ── create_notification exists and is callable ────────────────


def test_create_notification_exists():
    """create_notification is an async callable."""
    assert callable(create_notification)
    assert inspect.iscoroutinefunction(create_notification)


# ── NotificationOut field checks ──────────────────────────────


def test_notification_out_has_correct_fields():
    """NotificationOut must expose all required fields."""
    required_fields = {
        "id",
        "user_id",
        "title",
        "message",
        "type",
        "is_read",
        "created_at",
    }
    assert required_fields == set(NotificationOut.model_fields.keys())


def test_notification_out_valid_construction():
    """A NotificationOut can be built with correct data."""
    notif = NotificationOut(
        id="notif_1_123_1",
        user_id=1,
        title="Welcome",
        message="Hello!",
        type="info",
        is_read=False,
        created_at="2026-01-01T00:00:00+00:00",
    )
    assert notif.id == "notif_1_123_1"
    assert notif.is_read is False


def test_notification_out_rejects_missing_type():
    """Type field is required (no default)."""
    with pytest.raises(ValidationError):
        NotificationOut(
            id="x",
            user_id=1,
            title="T",
            message="M",
            # type omitted
            is_read=False,
            created_at="2026-01-01T00:00:00",
        )


# ── Allowed notification types (documented in Field description) ─


@pytest.mark.parametrize(
    "ntype",
    ["info", "success", "warning", "price_alert", "digest"],
)
def test_valid_notification_types_accepted(ntype: str):
    """Each documented notification type can be stored."""
    notif = NotificationOut(
        id="n1",
        user_id=1,
        title="T",
        message="M",
        type=ntype,
        is_read=False,
        created_at="2026-01-01T00:00:00",
    )
    assert notif.type == ntype


# ── Constants ─────────────────────────────────────────────────


def test_max_per_user_is_50():
    """The per-user notification cap is 50."""
    assert _MAX_PER_USER == 50


def test_ttl_is_30_days():
    """TTL must equal 30 days in seconds."""
    expected = 60 * 60 * 24 * 30
    assert _TTL_SECONDS == expected


# ── create_notification returns correct structure ─────────────


@pytest.mark.asyncio
async def test_create_notification_returns_correct_dict():
    """create_notification returns a dict with all expected keys."""
    notif = await create_notification(
        user_id=9999,
        title="Test",
        message="body",
        notification_type="success",
    )
    assert set(notif.keys()) == {
        "id",
        "user_id",
        "title",
        "message",
        "type",
        "is_read",
        "created_at",
    }
    assert notif["user_id"] == 9999
    assert notif["type"] == "success"
    assert notif["is_read"] is False
    # Clean up in-memory store
    _memory_store.pop(9999, None)
