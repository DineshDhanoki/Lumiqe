"""Tests for app.api.makeup — Pydantic models, constants, helpers."""

import os
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-characters")

import pytest
from pydantic import ValidationError

from app.api.makeup import (
    ShadeMatchResponse,
    MakeupRecommendationResponse,
    VALID_CATEGORIES,
    VALID_SEASONS,
    _build_purchase_url,
)


# ── ShadeMatchResponse model ─────────────────────────────────


def test_shade_match_response_valid():
    """ShadeMatchResponse accepts well-formed data."""
    resp = ShadeMatchResponse(
        query_hex="#D4A97A",
        category="foundation",
        undertone_filter=None,
        matches=[],
    )
    assert resp.query_hex == "#D4A97A"
    assert resp.matches == []


def test_shade_match_response_rejects_missing_category():
    """category is required."""
    with pytest.raises(ValidationError):
        ShadeMatchResponse(
            query_hex="#D4A97A",
            # category omitted
            matches=[],
        )


# ── MakeupRecommendationResponse model ───────────────────────


def test_makeup_recommendation_response_valid():
    """MakeupRecommendationResponse builds with complete data."""
    resp = MakeupRecommendationResponse(
        season="spring",
        undertone="warm",
        undertone_guidance="Warm golden tones",
        foundation_tip="Choose peachy undertones",
        lipstick_families=["coral"],
        lipstick_picks=["MAC Coral"],
        blush_families=["peach"],
        blush_picks=["NARS Orgasm"],
        eyeshadow_palettes=["Warm Neutrals"],
    )
    assert resp.season == "spring"
    assert len(resp.lipstick_families) == 1


def test_makeup_recommendation_response_rejects_missing_fields():
    """All fields on MakeupRecommendationResponse are required."""
    with pytest.raises(ValidationError):
        MakeupRecommendationResponse(
            season="spring",
            undertone="warm",
            # remaining fields omitted
        )


# ── Valid categories constant ─────────────────────────────────


def test_valid_categories():
    """VALID_CATEGORIES must contain the four makeup types."""
    assert VALID_CATEGORIES == {"foundation", "concealer", "lipstick", "blush"}


# ── Season families constant ─────────────────────────────────


def test_valid_seasons():
    """VALID_SEASONS must contain the four seasons."""
    assert VALID_SEASONS == {"spring", "summer", "autumn", "winter"}


# ── _build_purchase_url helper ────────────────────────────────


def test_build_purchase_url_format():
    """Purchase URL uses slugified brand and shade name."""
    url = _build_purchase_url("MAC", "Studio Fix")
    assert url == "https://www.lumiqe.com/shop/mac-studio-fix"
