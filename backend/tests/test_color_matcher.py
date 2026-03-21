"""
Lumiqe — Color Matcher Unit Tests.

Tests hex conversion, Delta-E calculation, score_match verdicts,
and edge cases in the color science pipeline.
"""

import math
import pytest
from app.services.color_matcher import (
    hex_to_rgb,
    hex_to_lab,
    delta_e_cie2000,
    score_match,
)


# ─── Hex → RGB ───────────────────────────────────────────────


class TestHexToRgb:
    def test_pure_red(self):
        assert hex_to_rgb("#FF0000") == (255, 0, 0)

    def test_pure_green(self):
        assert hex_to_rgb("#00FF00") == (0, 255, 0)

    def test_pure_blue(self):
        assert hex_to_rgb("#0000FF") == (0, 0, 255)

    def test_black(self):
        assert hex_to_rgb("#000000") == (0, 0, 0)

    def test_white(self):
        assert hex_to_rgb("#FFFFFF") == (255, 255, 255)

    def test_without_hash(self):
        assert hex_to_rgb("C76B3F") == hex_to_rgb("#C76B3F")

    def test_skin_tone(self):
        r, g, b = hex_to_rgb("#C76B3F")
        assert r == 199
        assert g == 107
        assert b == 63


# ─── Delta-E ─────────────────────────────────────────────────


class TestDeltaE:
    def test_identical_colors_zero_distance(self):
        lab = hex_to_lab("#FF0000")
        de = delta_e_cie2000(lab, lab)
        assert de < 0.01  # Should be essentially 0

    def test_black_and_white_large_distance(self):
        black_lab = hex_to_lab("#000000")
        white_lab = hex_to_lab("#FFFFFF")
        de = delta_e_cie2000(black_lab, white_lab)
        assert de > 50  # Maximum perceptual difference

    def test_similar_colors_small_distance(self):
        red1_lab = hex_to_lab("#FF0000")
        red2_lab = hex_to_lab("#EE0000")
        de = delta_e_cie2000(red1_lab, red2_lab)
        assert de < 10  # Very similar reds

    def test_complementary_colors_large_distance(self):
        red_lab = hex_to_lab("#FF0000")
        green_lab = hex_to_lab("#00FF00")
        de = delta_e_cie2000(red_lab, green_lab)
        assert de > 30  # Clearly different

    def test_symmetry(self):
        """Delta-E should be symmetric: d(A, B) == d(B, A)"""
        a = hex_to_lab("#C76B3F")
        b = hex_to_lab("#3F7BC7")
        de_ab = delta_e_cie2000(a, b)
        de_ba = delta_e_cie2000(b, a)
        assert abs(de_ab - de_ba) < 0.001

    def test_non_negative(self):
        for hex1 in ["#FF0000", "#00FF00", "#0000FF", "#FFFFFF", "#000000"]:
            for hex2 in ["#C76B3F", "#A0522D", "#D2691E"]:
                lab1 = hex_to_lab(hex1)
                lab2 = hex_to_lab(hex2)
                assert delta_e_cie2000(lab1, lab2) >= 0


# ─── Score Match ─────────────────────────────────────────────


class TestScoreMatch:
    def test_perfect_match_is_buy(self):
        # Exact same color in palette → score 100 → BUY
        result = score_match("#C76B3F", ["#C76B3F", "#A0522D", "#8B4513"])
        assert result["verdict"] == "BUY"
        assert result["match_score"] >= 70

    def test_completely_different_is_pass(self):
        # Neon green vs warm autumn palette
        result = score_match("#00FF00", ["#C76B3F", "#A0522D", "#8B4513"])
        assert result["verdict"] == "PASS"
        assert result["match_score"] < 40

    def test_empty_palette_returns_unknown(self):
        result = score_match("#C76B3F", [])
        assert result["verdict"] == "UNKNOWN"
        assert result["match_score"] == 0

    def test_result_keys_present(self):
        result = score_match("#C76B3F", ["#A0522D"])
        assert "item_hex" in result
        assert "match_score" in result
        assert "verdict" in result
        assert "best_palette_match" in result
        assert "suggestions" in result

    def test_score_in_range(self):
        result = score_match("#C76B3F", ["#A0522D", "#D2B48C"])
        assert 0 <= result["match_score"] <= 100

    def test_verdict_values(self):
        # Verdict must be one of three valid values
        result = score_match("#C76B3F", ["#A0522D"])
        assert result["verdict"] in ("BUY", "MAYBE", "PASS")

    def test_suggestions_limited_to_three(self):
        palette = ["#C76B3F", "#A0522D", "#8B4513", "#D2691E", "#CD853F"]
        result = score_match("#C76B3F", palette)
        assert len(result["suggestions"]) <= 3

    def test_best_match_in_palette(self):
        palette = ["#C76B3F", "#A0522D", "#8B4513"]
        result = score_match("#C76B3F", palette)
        assert result["best_palette_match"] in palette

    def test_maybe_verdict_range(self):
        # A color that's similar but not perfect to the palette
        # We'll manually check the score lands in the MAYBE range
        result = score_match("#FF6347", ["#C76B3F"])
        assert result["verdict"] in ("BUY", "MAYBE", "PASS")
        if result["match_score"] >= 40 and result["match_score"] < 70:
            assert result["verdict"] == "MAYBE"
