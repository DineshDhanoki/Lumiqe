"""Tests for app.api.referral — Pydantic models and URL format."""

import os
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-characters")

import pytest
from pydantic import ValidationError

from app.api.referral import (
    ReferralCodeResponse,
    ApplyReferralRequest,
)


# ── ReferralCodeResponse fields ───────────────────────────────


def test_referral_code_response_has_required_fields():
    """ReferralCodeResponse exposes referral_code, referral_url, referral_count."""
    expected = {"referral_code", "referral_url", "referral_count"}
    assert expected == set(ReferralCodeResponse.model_fields.keys())


def test_referral_code_response_valid_construction():
    """Model can be built with valid data."""
    resp = ReferralCodeResponse(
        referral_code="ABC123",
        referral_url="https://lumiqe.in/?ref=ABC123",
        referral_count=5,
    )
    assert resp.referral_code == "ABC123"
    assert resp.referral_count == 5


# ── ApplyReferralRequest ──────────────────────────────────────


def test_apply_referral_request_requires_code():
    """ApplyReferralRequest must have a 'code' field."""
    assert "code" in ApplyReferralRequest.model_fields
    with pytest.raises(ValidationError):
        ApplyReferralRequest()  # missing 'code'


def test_apply_referral_request_accepts_valid_code():
    """A valid code string is accepted."""
    req = ApplyReferralRequest(code="XYZ789")
    assert req.code == "XYZ789"


# ── Referral URL format ───────────────────────────────────────


def test_referral_url_contains_lumiqe_ref():
    """The referral URL must contain 'lumiqe.in/?ref='."""
    resp = ReferralCodeResponse(
        referral_code="TESTCODE",
        referral_url="https://lumiqe.in/?ref=TESTCODE",
        referral_count=0,
    )
    assert "lumiqe.in/?ref=" in resp.referral_url
    assert resp.referral_url.endswith(resp.referral_code)
