"""Tests for the built-in makeup shade database."""

import re

from app.services.makeup_database import (
    BLUSH_SHADES,
    CONCEALER_SHADES,
    FOUNDATION_SHADES,
    LIPSTICK_SHADES,
    SEASON_RECOMMENDATIONS,
)

HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")
REQUIRED_SHADE_KEYS = {"name", "brand", "hex", "undertone"}


def test_foundation_shades_has_20_plus_entries():
    assert len(FOUNDATION_SHADES) >= 20


def test_lipstick_shades_has_10_plus_entries():
    assert len(LIPSTICK_SHADES) >= 10


def test_blush_shades_has_10_plus_entries():
    assert len(BLUSH_SHADES) >= 10


def test_concealer_shades_has_10_plus_entries():
    assert len(CONCEALER_SHADES) >= 10


def test_each_shade_has_required_fields():
    """Every shade dict must have name, brand, hex, and undertone."""
    all_shades = (
        FOUNDATION_SHADES
        + LIPSTICK_SHADES
        + BLUSH_SHADES
        + CONCEALER_SHADES
    )
    for shade in all_shades:
        missing = REQUIRED_SHADE_KEYS - shade.keys()
        assert not missing, f"Shade {shade.get('name')} missing: {missing}"


def test_hex_format_is_valid():
    """All hex values must match #RRGGBB pattern."""
    all_shades = (
        FOUNDATION_SHADES
        + LIPSTICK_SHADES
        + BLUSH_SHADES
        + CONCEALER_SHADES
    )
    for shade in all_shades:
        assert HEX_RE.match(shade["hex"]), (
            f"Invalid hex '{shade['hex']}' for {shade['name']}"
        )


def test_season_recommendations_has_all_four_families():
    expected = {"spring", "summer", "autumn", "winter"}
    assert set(SEASON_RECOMMENDATIONS.keys()) == expected


def test_each_recommendation_has_required_keys():
    """Each season recommendation must include guidance keys."""
    required = {
        "foundation_tip",
        "lipstick_families",
        "blush_families",
        "eyeshadow_palettes",
    }
    for season, rec in SEASON_RECOMMENDATIONS.items():
        missing = required - rec.keys()
        assert not missing, (
            f"Recommendation for {season} missing: {missing}"
        )
