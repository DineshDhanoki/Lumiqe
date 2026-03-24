"""Tests for the celebrity match service."""

from app.services.celebrity_match import (
    CELEBRITY_SEASONS,
    get_celebrity_matches,
)

ALL_12_SEASONS = [
    "Deep Winter",
    "Cool Winter",
    "Clear Winter",
    "Light Spring",
    "Warm Spring",
    "Clear Spring",
    "Light Summer",
    "Cool Summer",
    "Soft Summer",
    "Soft Autumn",
    "Warm Autumn",
    "Deep Autumn",
]


def test_returns_list_for_each_of_12_seasons():
    """Every canonical season should return a non-empty list."""
    for season in ALL_12_SEASONS:
        result = get_celebrity_matches(season)
        assert isinstance(result, list), f"Expected list for {season}"
        assert len(result) > 0, f"Expected non-empty list for {season}"


def test_each_celebrity_has_required_fields():
    """Every celebrity dict must contain name, image_hint, and note."""
    required_keys = {"name", "image_hint", "note"}
    for season, celebs in CELEBRITY_SEASONS.items():
        for celeb in celebs:
            missing = required_keys - celeb.keys()
            assert not missing, (
                f"Celebrity in {season} missing keys: {missing}"
            )


def test_unknown_season_returns_empty_list():
    """A completely unrecognised season should return an empty list."""
    result = get_celebrity_matches("Tropical Neon")
    assert result == []


def test_case_insensitive_matching():
    """Season lookup should be case-insensitive."""
    lower = get_celebrity_matches("deep winter")
    upper = get_celebrity_matches("Deep Winter")
    assert lower == upper


def test_case_insensitive_with_extra_whitespace():
    """Leading/trailing whitespace should be stripped."""
    result = get_celebrity_matches("  deep winter  ")
    assert len(result) > 0


def test_at_least_two_celebrities_per_season():
    """Each season should have at least 2 celebrity entries."""
    for season in ALL_12_SEASONS:
        result = get_celebrity_matches(season)
        assert len(result) >= 2, (
            f"{season} has only {len(result)} celebrities"
        )


def test_indian_celebrities_present():
    """Key Indian celebrities must appear in the database."""
    all_names = {
        celeb["name"]
        for celebs in CELEBRITY_SEASONS.values()
        for celeb in celebs
    }
    expected_indian = {"Deepika Padukone", "Alia Bhatt", "Katrina Kaif"}
    missing = expected_indian - all_names
    assert not missing, f"Missing Indian celebrities: {missing}"


def test_family_fallback_for_unknown_sub_season():
    """An unknown sub-season like 'True Winter' should fall back to
    the first Winter sub-season."""
    result = get_celebrity_matches("True Winter")
    deep_winter = get_celebrity_matches("Deep Winter")
    assert result == deep_winter
