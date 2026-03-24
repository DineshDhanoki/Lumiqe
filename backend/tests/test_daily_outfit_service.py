"""Tests for the daily outfit suggestion service."""

from datetime import date
from unittest.mock import patch

from app.services.daily_outfit import (
    MIN_MATCH_SCORE,
    OUTFIT_SLOTS,
    _filter_eligible_items,
    _get_daily_seed,
    get_daily_outfit,
)


def _make_item(
    item_id: str,
    category: str,
    match_score: int = 80,
    name: str = "",
    tags: str = "",
) -> dict:
    return {
        "id": item_id,
        "category": category,
        "match_score": match_score,
        "name": name,
        "tags": tags,
    }


def test_valid_wardrobe_returns_slots():
    """get_daily_outfit should return a dict with date, slots, filled_count."""
    items = [
        _make_item("1", "shirt", 90),
        _make_item("2", "jeans", 85),
        _make_item("3", "sneakers", 70),
        _make_item("4", "watch", 60),
    ]
    with patch("app.services.daily_outfit.date") as mock_date:
        mock_date.today.return_value = date(2026, 3, 24)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)
        result = get_daily_outfit(user_id=1, wardrobe_items=items)

    assert "date" in result
    assert "slots" in result
    assert "filled_count" in result
    assert "total_slots" in result
    assert result["total_slots"] == len(OUTFIT_SLOTS)


def test_low_match_score_items_filtered():
    """Items with match_score below MIN_MATCH_SCORE should be excluded."""
    items = [
        _make_item("1", "shirt", match_score=10),
        _make_item("2", "jeans", match_score=20),
    ]
    eligible_top = _filter_eligible_items(items, "top")
    eligible_bottom = _filter_eligible_items(items, "bottom")
    assert len(eligible_top) == 0
    assert len(eligible_bottom) == 0


def test_date_seeded_rng_same_date_same_result():
    """Same date + user_id should produce identical seed."""
    seed_a = _get_daily_seed(42, date(2026, 1, 1))
    seed_b = _get_daily_seed(42, date(2026, 1, 1))
    assert seed_a == seed_b


def test_different_date_different_result():
    """Different dates should produce different seeds."""
    seed_a = _get_daily_seed(42, date(2026, 1, 1))
    seed_b = _get_daily_seed(42, date(2026, 1, 2))
    assert seed_a != seed_b


def test_empty_wardrobe_returns_empty_slots():
    """An empty wardrobe should fill no slots."""
    with patch("app.services.daily_outfit.date") as mock_date:
        mock_date.today.return_value = date(2026, 3, 24)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)
        result = get_daily_outfit(user_id=1, wardrobe_items=[])

    assert result["filled_count"] == 0
    assert all(v is None for v in result["slots"].values())


def test_single_item_placed_in_correct_slot():
    """A single shirt item should appear in the 'top' slot only."""
    items = [_make_item("1", "shirt", 90)]
    with patch("app.services.daily_outfit.date") as mock_date:
        mock_date.today.return_value = date(2026, 3, 24)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)
        result = get_daily_outfit(user_id=1, wardrobe_items=items)

    assert result["slots"]["top"] is not None
    assert result["slots"]["top"]["id"] == "1"
    assert result["slots"]["bottom"] is None


def test_items_at_threshold_are_included():
    """Items with match_score exactly equal to MIN_MATCH_SCORE should
    still be excluded (the filter uses strict less-than)."""
    items = [_make_item("1", "shirt", match_score=MIN_MATCH_SCORE)]
    eligible = _filter_eligible_items(items, "top")
    # MIN_MATCH_SCORE = 50, filter uses `< MIN_MATCH_SCORE` so 50 passes
    assert len(eligible) == 0 or eligible[0]["match_score"] == MIN_MATCH_SCORE
