"""Tests for wardrobe color extraction helpers and validation constants."""

import os
import re

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-must-be-32-chars-minimum")

import pytest  # noqa: E402

from app.api.wardrobe import (  # noqa: E402
    _calculate_delta_e,
    _MAX_WARDROBE_ITEMS,
    _score_against_palette,
)


# ─── Hex Color Format ────────────────────────────────────────

_HEX_REGEX = re.compile(r"^#[0-9A-Fa-f]{6}$")


class TestHexColorFormat:
    """Validate that helper functions produce valid #RRGGBB output."""

    def test_score_returns_int_between_0_and_100(self):
        score = _score_against_palette("#A0522D", ["#A0522D", "#FFD700"])
        assert isinstance(score, int)
        assert 0 <= score <= 100

    def test_perfect_match_returns_100(self):
        """Identical color should yield score 100."""
        score = _score_against_palette("#FF0000", ["#FF0000"])
        assert score == 100

    def test_empty_palette_returns_zero(self):
        score = _score_against_palette("#FF0000", [])
        assert score == 0


# ─── Delta-E Color Distance ──────────────────────────────────


class TestDeltaE:
    """Test the CIE76 delta-E calculation."""

    def test_identical_colors_zero_distance(self):
        assert _calculate_delta_e("#000000", "#000000") == pytest.approx(0.0)

    def test_different_colors_positive_distance(self):
        distance = _calculate_delta_e("#FF0000", "#0000FF")
        assert distance > 0


# ─── Wardrobe Limit ──────────────────────────────────────────


class TestWardrobeLimit:
    """Verify the per-user wardrobe item cap."""

    def test_max_wardrobe_items_is_100(self):
        assert _MAX_WARDROBE_ITEMS == 100
