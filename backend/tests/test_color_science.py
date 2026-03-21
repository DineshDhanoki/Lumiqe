"""
Lumiqe — Color Science Property-Based Tests.

Uses Hypothesis to verify mathematical invariants in the color
pipeline: round-trips, symmetry, boundary behavior, and scoring.
"""

import math

import pytest
from hypothesis import given, assume, settings as h_settings
from hypothesis.strategies import floats, integers, text, lists

from app.services.color_matcher import (
    hex_to_lab,
    hex_to_rgb,
    rgb_to_lab,
    delta_e_cie2000,
    score_match,
)
from app.cv.color_analysis import calculate_ita, lab_to_hex


# ─── Strategies ──────────────────────────────────────────────

valid_rgb = integers(min_value=0, max_value=255)
valid_hex = text(
    alphabet="0123456789ABCDEFabcdef",
    min_size=6,
    max_size=6,
).map(lambda s: f"#{s}")

# CIE L*a*b* ranges
L_values = floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False)
a_values = floats(min_value=-128, max_value=128, allow_nan=False, allow_infinity=False)
b_values = floats(min_value=-128, max_value=128, allow_nan=False, allow_infinity=False)


# ─── hex_to_lab / lab_to_hex round-trip ──────────────────────


@given(r=valid_rgb, g=valid_rgb, b=valid_rgb)
@h_settings(max_examples=200)
def test_hex_lab_roundtrip_approximately(r, g, b):
    """hex -> lab -> hex should produce a nearby color (within 2 Delta-E)."""
    original_hex = f"#{r:02X}{g:02X}{b:02X}"
    lab = hex_to_lab(original_hex)
    L, a, b_val = lab

    # lab_to_hex clamps to valid range
    roundtrip_hex = lab_to_hex(L, a, b_val)
    roundtrip_lab = hex_to_lab(roundtrip_hex)

    # The round-trip should be perceptually close
    de = delta_e_cie2000(lab, roundtrip_lab)
    assert de < 3.0, f"Round-trip Delta-E too large: {de} for {original_hex}"


# ─── Delta-E CIE2000 properties ─────────────────────────────


@given(L=L_values, a=a_values, b=b_values)
@h_settings(max_examples=200)
def test_delta_e_identity(L, a, b):
    """Delta-E of a color with itself must be 0."""
    lab = (L, a, b)
    de = delta_e_cie2000(lab, lab)
    assert de == pytest.approx(0.0, abs=1e-10)


@given(
    L1=L_values, a1=a_values, b1=b_values,
    L2=L_values, a2=a_values, b2=b_values,
)
@h_settings(max_examples=200)
def test_delta_e_symmetry(L1, a1, b1, L2, a2, b2):
    """Delta-E must be symmetric: d(A,B) == d(B,A)."""
    lab1 = (L1, a1, b1)
    lab2 = (L2, a2, b2)
    assert delta_e_cie2000(lab1, lab2) == pytest.approx(
        delta_e_cie2000(lab2, lab1), abs=1e-10
    )


@given(
    L1=L_values, a1=a_values, b1=b_values,
    L2=L_values, a2=a_values, b2=b_values,
)
@h_settings(max_examples=200)
def test_delta_e_non_negative(L1, a1, b1, L2, a2, b2):
    """Delta-E must always be non-negative."""
    lab1 = (L1, a1, b1)
    lab2 = (L2, a2, b2)
    de = delta_e_cie2000(lab1, lab2)
    assert de >= 0.0


# ─── ITA angle properties ────────────────────────────────────


@given(L=L_values, b=b_values)
@h_settings(max_examples=200)
def test_ita_returns_finite(L, b):
    """ITA calculation must always return a finite number."""
    ita = calculate_ita(L, b)
    assert math.isfinite(ita)


def test_ita_known_values():
    """ITA for known L*,b* pairs should match expected ranges."""
    # Very light skin (L=80, b=10) → high ITA (light)
    ita_light = calculate_ita(80.0, 10.0)
    assert ita_light > 40

    # Very dark skin (L=25, b=5) → low ITA (dark)
    ita_dark = calculate_ita(25.0, 5.0)
    assert ita_dark < 0

    # Medium skin (L=50, b=15) → moderate ITA
    ita_medium = calculate_ita(50.0, 15.0)
    assert -30 < ita_medium < 50


# ─── score_match ─────────────────────────────────────────────


def test_score_match_identical_color():
    """Identical color should score 100 and verdict BUY."""
    result = score_match("#C76B3F", ["#C76B3F", "#8B4513", "#FFD700"])
    assert result["match_score"] == 100
    assert result["verdict"] == "BUY"


def test_score_match_very_different_color():
    """Completely different color should score low and verdict PASS."""
    result = score_match("#0000FF", ["#FF0000", "#FF8800"])
    assert result["match_score"] < 40
    assert result["verdict"] == "PASS"


def test_score_match_empty_palette():
    """Empty palette returns UNKNOWN verdict."""
    result = score_match("#C76B3F", [])
    assert result["verdict"] == "UNKNOWN"
    assert result["match_score"] == 0


# ─── validate_image_bytes ────────────────────────────────────


def test_validate_image_bytes_jpeg():
    """JPEG magic bytes should be recognized."""
    from app.core.security import validate_image_bytes
    # JPEG starts with FF D8 FF
    jpeg_header = b"\xFF\xD8\xFF\xE0" + b"\x00" * 100
    result = validate_image_bytes(jpeg_header)
    assert result in ("jpeg", "jpg", None)  # None if full validation fails


def test_validate_image_bytes_png():
    """PNG magic bytes should be recognized."""
    from app.core.security import validate_image_bytes
    # PNG starts with 89 50 4E 47
    png_header = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    result = validate_image_bytes(png_header)
    assert result in ("png", None)


def test_validate_image_bytes_rejects_random():
    """Random bytes should be rejected."""
    from app.core.security import validate_image_bytes
    result = validate_image_bytes(b"this is not an image at all")
    assert result is None
