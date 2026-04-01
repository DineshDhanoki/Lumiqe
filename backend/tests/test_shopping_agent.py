"""
Lumiqe — Shopping Agent Unit Tests.

Tests the deterministic color-matching outfit assembly:
outfit slot routing, deduplication prevention, and palette validation.
"""



# ─── Imports ────────────────────────────────────────────────


def get_color_matcher():
    from app.services.color_matcher import hex_to_lab, delta_e_cie2000, score_match
    return hex_to_lab, delta_e_cie2000, score_match


# ─── Palette Validation ──────────────────────────────────────


class TestPaletteInput:
    """The color matcher must handle a range of palette inputs safely."""

    def test_single_color_palette(self):
        _, _, score_match = get_color_matcher()
        result = score_match("#C76B3F", ["#C76B3F"])
        assert result["match_score"] == 100
        assert result["verdict"] == "BUY"

    def test_large_palette(self):
        _, _, score_match = get_color_matcher()
        palette = [
            "#C76B3F", "#A0522D", "#8B4513", "#D2691E",
            "#CD853F", "#DEB887", "#F4A460", "#DAA520",
        ]
        result = score_match("#C76B3F", palette)
        assert result["best_palette_match"] in palette
        assert 0 <= result["match_score"] <= 100

    def test_all_same_palette(self):
        _, _, score_match = get_color_matcher()
        result = score_match("#FF0000", ["#FF0000", "#FF0000", "#FF0000"])
        assert result["match_score"] > 0

    def test_item_hex_preserved_in_result(self):
        _, _, score_match = get_color_matcher()
        item = "#B85C38"
        result = score_match(item, ["#A0522D"])
        assert result["item_hex"] == item


# ─── Score + Verdict Boundaries ─────────────────────────────


class TestVerdictBoundaries:
    """Verify the 3-tier verdict system maps correctly to score ranges."""

    def test_buy_at_score_70(self):
        """A close color match should produce BUY."""
        _, _, score_match = get_color_matcher()
        # Exact match = score 100 = BUY
        result = score_match("#C76B3F", ["#C76B3F"])
        assert result["verdict"] == "BUY"
        assert result["match_score"] >= 70

    def test_pass_for_opposite_colors(self):
        """Very different colors should produce PASS."""
        _, _, score_match = get_color_matcher()
        result = score_match("#00FFFF", ["#8B0000"])  # Cyan vs Dark Red
        assert result["match_score"] < 40
        assert result["verdict"] == "PASS"

    def test_score_100_for_identical(self):
        """Perfect match must produce score 100."""
        _, _, score_match = get_color_matcher()
        result = score_match("#A0522D", ["#A0522D"])
        assert result["match_score"] == 100


# ─── Suggestions Quality ─────────────────────────────────────


class TestSuggestions:
    def test_suggestions_sorted_by_closeness(self):
        """Suggestions should be sorted by Delta-E (closest first)."""
        _, _, score_match = get_color_matcher()
        palette = ["#8B0000", "#FF6347", "#C76B3F"]
        result = score_match("#D2691E", palette)
        suggestions = result["suggestions"]
        # Each suggestion should have a delta_e key
        for s in suggestions:
            assert "hex" in s
            assert "delta_e" in s
        # Should be sorted ascending by delta_e
        delta_es = [s["delta_e"] for s in suggestions]
        assert delta_es == sorted(delta_es)

    def test_max_three_suggestions(self):
        """Never more than 3 suggestions even with large palette."""
        _, _, score_match = get_color_matcher()
        palette = [f"#{'%02X' % (i*20)}4040" for i in range(10)]
        result = score_match("#C76B3F", palette)
        assert len(result["suggestions"]) <= 3


# ─── Delta-E Calibration (known pairs) ───────────────────────


class TestDeltaECalibration:
    """Verify Delta-E produces sensible values for known color pairs.
    Reference values validated against the CIEDE2000 formula spec.
    """

    def test_same_color_is_zero(self):
        hex_to_lab, delta_e_cie2000, _ = get_color_matcher()
        lab = hex_to_lab("#C76B3F")
        assert delta_e_cie2000(lab, lab) < 0.01

    def test_near_colors_low_delta_e(self):
        hex_to_lab, delta_e_cie2000, _ = get_color_matcher()
        # Two very similar warm browns
        lab1 = hex_to_lab("#C76B3F")
        lab2 = hex_to_lab("#C8703F")
        assert delta_e_cie2000(lab1, lab2) < 5

    def test_contrasting_colors_high_delta_e(self):
        hex_to_lab, delta_e_cie2000, _ = get_color_matcher()
        lab1 = hex_to_lab("#FFFFFF")  # White
        lab2 = hex_to_lab("#000000")  # Black
        assert delta_e_cie2000(lab1, lab2) > 50


# ─── Gender Validation Filter ──────────────────────────────


def get_gender_validator():
    from app.services.shopping_agent import _is_valid_for_gender
    return _is_valid_for_gender


class TestGenderValidation:
    """Ensure blocklist filter rejects inappropriate items per gender."""

    # ── Male blocklist ───────────────────────────────────────

    def test_rejects_lipstick_for_male(self):
        validate = get_gender_validator()
        assert validate("Maybelline Matte Lipstick Red", "male") is False

    def test_rejects_heels_for_male(self):
        validate = get_gender_validator()
        assert validate("Pointed Stiletto Heels Black", "male") is False

    def test_rejects_handbag_for_male(self):
        validate = get_gender_validator()
        assert validate("Women's Leather Handbag", "male") is False

    def test_rejects_necklace_for_male(self):
        validate = get_gender_validator()
        assert validate("Gold Plated Necklace Set", "male") is False

    def test_rejects_bangle_for_male(self):
        validate = get_gender_validator()
        assert validate("Pearl Bangle Bracelet", "male") is False

    def test_rejects_saree_for_male(self):
        validate = get_gender_validator()
        assert validate("Silk Saree Blue", "male") is False

    def test_rejects_lehenga_for_male(self):
        validate = get_gender_validator()
        assert validate("Bridal Lehenga Red Gold", "male") is False

    def test_rejects_kurti_for_male(self):
        validate = get_gender_validator()
        assert validate("Cotton Kurti Printed", "male") is False

    def test_rejects_crop_top_for_male(self):
        validate = get_gender_validator()
        assert validate("Ribbed Crop Top White", "male") is False

    def test_rejects_stilettos_for_male(self):
        validate = get_gender_validator()
        assert validate("Stilettos Platform Shoes", "male") is False

    # ── Male allowed items ───────────────────────────────────

    def test_allows_tshirt_for_male(self):
        validate = get_gender_validator()
        assert validate("Men's Round Neck T-Shirt", "male") is True

    def test_allows_sneakers_for_male(self):
        validate = get_gender_validator()
        assert validate("Campus Running Shoes White", "male") is True

    def test_allows_watch_for_male(self):
        validate = get_gender_validator()
        assert validate("Casio Digital Watch Silver", "male") is True

    def test_allows_backpack_for_male(self):
        validate = get_gender_validator()
        assert validate("Laptop Backpack Black", "male") is True

    def test_allows_jeans_for_male(self):
        validate = get_gender_validator()
        assert validate("Slim Fit Blue Jeans", "male") is True

    def test_allows_jacket_for_male(self):
        validate = get_gender_validator()
        assert validate("Bomber Jacket Olive Green", "male") is True

    def test_allows_sunglasses_for_male(self):
        validate = get_gender_validator()
        assert validate("Aviator Sunglasses Black", "male") is True

    # ── Female blocklist ─────────────────────────────────────

    def test_rejects_boxer_for_female(self):
        validate = get_gender_validator()
        assert validate("Men's Boxer Shorts Cotton", "female") is False

    def test_rejects_briefs_for_female(self):
        validate = get_gender_validator()
        assert validate("Pack of 3 Briefs", "female") is False

    def test_rejects_lungi_for_female(self):
        validate = get_gender_validator()
        assert validate("Cotton Lungi White", "female") is False

    # ── Female allowed items ─────────────────────────────────

    def test_allows_dress_for_female(self):
        validate = get_gender_validator()
        assert validate("Floral Print Maxi Dress", "female") is True

    def test_allows_heels_for_female(self):
        validate = get_gender_validator()
        assert validate("Block Heels Beige", "female") is True

    def test_allows_lipstick_for_female(self):
        validate = get_gender_validator()
        assert validate("Matte Lipstick Nude", "female") is True

    def test_allows_handbag_for_female(self):
        validate = get_gender_validator()
        assert validate("Tote Handbag Brown", "female") is True

    # ── Case insensitivity ───────────────────────────────────

    def test_case_insensitive_blocking(self):
        validate = get_gender_validator()
        assert validate("LIPSTICK Matte Red", "male") is False
        assert validate("Heels Platform", "male") is False

    def test_partial_match_in_name(self):
        """Blocklist terms should match as substrings."""
        validate = get_gender_validator()
        assert validate("Beautiful Gold Necklace Set for Women", "male") is False
        assert validate("Stiletto Heels Black", "male") is False
