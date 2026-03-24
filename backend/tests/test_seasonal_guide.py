"""Tests for app.services.seasonal_guide — climate-based wardrobe guide."""


from app.services.seasonal_guide import (
    get_guide_for_month,
    get_current_guide,
    TRANSITION_GUIDES,
)


# ── Season Mapping ───────────────────────────────────────────


def test_winter_month_returns_winter():
    for month in (12, 1, 2):
        guide = get_guide_for_month(month)
        assert guide["current_season"] == "Winter", f"Month {month} should be Winter"


def test_summer_month_returns_summer():
    for month in (5, 6):
        guide = get_guide_for_month(month)
        assert guide["current_season"] == "Summer", f"Month {month} should be Summer"


def test_monsoon_month():
    for month in (7, 8, 9):
        guide = get_guide_for_month(month)
        assert guide["current_season"] == "Monsoon", f"Month {month} should be Monsoon"


# ── Transition Guide Structure ───────────────────────────────


def test_transition_has_swap_fields():
    guide = get_guide_for_month(1)
    assert "swap_out" in guide
    assert "swap_in" in guide
    assert isinstance(guide["swap_out"], list)
    assert isinstance(guide["swap_in"], list)
    assert len(guide["swap_out"]) > 0
    assert len(guide["swap_in"]) > 0


def test_transition_has_recommended_colors():
    guide = get_guide_for_month(3)
    assert "recommended_colors" in guide
    colors = guide["recommended_colors"]
    assert "warm" in colors
    assert "cool" in colors


# ── Color Palettes ───────────────────────────────────────────


def test_warm_colors_returned():
    guide = get_guide_for_month(1)
    warm_colors = guide["recommended_colors"]["warm"]
    assert isinstance(warm_colors, list)
    assert len(warm_colors) > 0
    for color in warm_colors:
        assert color.startswith("#")


def test_cool_colors_returned():
    guide = get_guide_for_month(1)
    cool_colors = guide["recommended_colors"]["cool"]
    assert isinstance(cool_colors, list)
    assert len(cool_colors) > 0
    for color in cool_colors:
        assert color.startswith("#")


# ── Full Coverage ────────────────────────────────────────────


def test_all_months_have_guide():
    for month in range(1, 13):
        guide = get_guide_for_month(month)
        assert "current_season" in guide
        assert "next_season" in guide
        assert guide["current_season"] in TRANSITION_GUIDES


def test_current_guide_returns_dict():
    guide = get_current_guide()
    assert isinstance(guide, dict)
    assert "current_season" in guide
    assert "next_season" in guide
    assert "swap_out" in guide
    assert "swap_in" in guide
    assert "recommended_colors" in guide
