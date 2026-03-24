"""Tests for user Pydantic schemas — pure validation logic."""

import pytest
from pydantic import ValidationError

from app.schemas.user import (
    AuthResponse,
    GoogleAuthRequest,
    ProfileResponse,
    TokenRefreshResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)


# ── UserCreate ────────────────────────────────────────────────


def test_user_create_valid():
    """UserCreate accepts valid name, email, and strong password."""
    user = UserCreate(
        name="Alice",
        email="alice@example.com",
        password="Str0ng!Pass",
    )
    assert user.name == "Alice"
    assert user.email == "alice@example.com"


def test_user_create_requires_fields():
    """UserCreate rejects missing required fields."""
    with pytest.raises(ValidationError):
        UserCreate(name="Alice", email="alice@example.com")  # no password
    with pytest.raises(ValidationError):
        UserCreate(name="Alice", password="Str0ng!Pass")  # no email
    with pytest.raises(ValidationError):
        UserCreate(email="a@b.com", password="Str0ng!Pass")  # no name


def test_user_create_rejects_short_password():
    """Passwords shorter than 8 characters are rejected."""
    with pytest.raises(ValidationError, match="at least 8"):
        UserCreate(name="A", email="a@b.com", password="Ab1!")


@pytest.mark.parametrize("weak", ["12345678", "password", "abcdefgh", "ABCDEFGH"])
def test_user_create_rejects_weak_passwords(weak: str):
    """Passwords missing complexity requirements are rejected."""
    with pytest.raises(ValidationError):
        UserCreate(name="A", email="a@b.com", password=weak)


# ── UserLogin ─────────────────────────────────────────────────


def test_user_login_requires_email_and_password():
    """UserLogin needs both email and password."""
    login = UserLogin(email="a@b.com", password="anything")
    assert login.email == "a@b.com"

    with pytest.raises(ValidationError):
        UserLogin(email="a@b.com")  # no password


# ── GoogleAuthRequest ─────────────────────────────────────────


def test_google_auth_request_fields():
    """GoogleAuthRequest requires email, name, google_id_token."""
    req = GoogleAuthRequest(
        email="g@g.com",
        name="Goo",
        google_id_token="token123",
    )
    assert req.google_id_token == "token123"

    with pytest.raises(ValidationError):
        GoogleAuthRequest(email="g@g.com", name="Goo")  # missing token


# ── AuthResponse ──────────────────────────────────────────────


def test_auth_response_has_expected_fields():
    """AuthResponse contains user, access_token, refresh_token."""
    user = UserResponse(
        id=1, name="A", email="a@b.com", free_scans_left=3,
    )
    resp = AuthResponse(
        user=user, access_token="at", refresh_token="rt",
    )
    assert resp.access_token == "at"
    assert resp.refresh_token == "rt"
    assert resp.token_type == "bearer"


# ── TokenRefreshResponse ─────────────────────────────────────


def test_token_refresh_response_fields():
    """TokenRefreshResponse has access_token and refresh_token."""
    resp = TokenRefreshResponse(access_token="a", refresh_token="r")
    assert resp.access_token == "a"
    assert resp.refresh_token == "r"


# ── ProfileResponse ──────────────────────────────────────────


def test_profile_response_all_fields():
    """ProfileResponse includes all expected dashboard fields."""
    profile = ProfileResponse(
        id=1,
        name="Test",
        email="t@t.com",
        is_premium=True,
        free_scans_left=5,
        credits=10,
        trial_ends_at="2025-01-01T00:00:00",
        referral_code="ABC123",
        referral_count=2,
        season="Deep Winter",
        palette=["#FFFFFF"],
        stripe_subscription_id="sub_123",
        created_at="2024-01-01T00:00:00",
    )
    assert profile.season == "Deep Winter"
    assert profile.stripe_subscription_id == "sub_123"
    assert profile.created_at == "2024-01-01T00:00:00"
    assert profile.palette == ["#FFFFFF"]
