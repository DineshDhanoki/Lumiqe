"""Tests for app.api.celebrity — Pydantic models."""

import pytest
from pydantic import ValidationError

from app.api.celebrity import CelebrityMatchResponse, CelebrityOut


# ── CelebrityOut model ────────────────────────────────────────


def test_celebrity_out_has_required_fields():
    """CelebrityOut must have name, image_hint, note."""
    expected = {"name", "image_hint", "note"}
    assert expected == set(CelebrityOut.model_fields.keys())


def test_celebrity_out_valid_construction():
    """CelebrityOut accepts valid data."""
    celeb = CelebrityOut(
        name="Lupita Nyong'o",
        image_hint="lupita.jpg",
        note="Deep Winter palette match",
    )
    assert celeb.name == "Lupita Nyong'o"


def test_celebrity_out_rejects_missing_name():
    """name is required."""
    with pytest.raises(ValidationError):
        CelebrityOut(image_hint="img.jpg", note="note")


# ── CelebrityMatchResponse model ─────────────────────────────


def test_celebrity_match_response_has_season():
    """CelebrityMatchResponse must include a 'season' field."""
    assert "season" in CelebrityMatchResponse.model_fields


def test_celebrity_match_response_valid():
    """CelebrityMatchResponse builds correctly with nested celebrities."""
    resp = CelebrityMatchResponse(
        season="Deep Winter",
        celebrities=[
            CelebrityOut(name="A", image_hint="a.jpg", note="note a"),
        ],
    )
    assert resp.season == "Deep Winter"
    assert len(resp.celebrities) == 1
