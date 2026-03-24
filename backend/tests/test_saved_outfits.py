"""Tests for app.api.saved_outfits — Pydantic models, constants."""

import os
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-characters")

import pytest
from pydantic import ValidationError

from app.api.saved_outfits import SaveOutfitRequest, _MAX_SAVED_OUTFITS


# ── SaveOutfitRequest requires look_name and outfit_data ──────


def test_save_outfit_request_requires_look_name():
    """look_name is required."""
    with pytest.raises(ValidationError):
        SaveOutfitRequest(outfit_data={"items": []})


def test_save_outfit_request_requires_outfit_data():
    """outfit_data is required."""
    with pytest.raises(ValidationError):
        SaveOutfitRequest(look_name="Summer Casual")


def test_save_outfit_request_valid():
    """Valid construction with both fields."""
    req = SaveOutfitRequest(
        look_name="Date Night",
        outfit_data={"top": "blouse", "bottom": "skirt"},
    )
    assert req.look_name == "Date Night"
    assert isinstance(req.outfit_data, dict)


# ── outfit_data must be a dict ────────────────────────────────


def test_outfit_data_rejects_non_dict():
    """outfit_data typed as dict should reject plain strings."""
    with pytest.raises(ValidationError):
        SaveOutfitRequest(look_name="Look", outfit_data="not a dict")


# ── MAX limit constant ────────────────────────────────────────


def test_max_saved_outfits_is_20():
    """The per-user outfit cap must be 20."""
    assert _MAX_SAVED_OUTFITS == 20
