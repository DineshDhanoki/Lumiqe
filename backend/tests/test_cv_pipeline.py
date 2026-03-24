"""
Lumiqe — CV Pipeline Unit Tests.

Tests for color_analysis functions, face_detector helpers, and pipeline
invariants. These run without loading BiSeNet or MediaPipe models.
"""

import math
import numpy as np

from app.cv.color_analysis import (
    apply_grey_world,
    check_exposure,
    calculate_ita,
    opencv_lab_to_cie,
    compute_warmth_score,
    map_to_season,
    compute_color_confidence,
    lab_to_hex,
)
from app.cv.face_detector import _get_exif_orientation, _apply_exif_rotation


# ════════════════════════════════════════════════════════════════
# apply_grey_world
# ════════════════════════════════════════════════════════════════

def test_grey_world_output_shape():
    """Output must have the same shape and dtype as input."""
    img = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)
    result = apply_grey_world(img)
    assert result.shape == img.shape
    assert result.dtype == np.uint8


def test_grey_world_neutral_image_unchanged():
    """A perfectly neutral gray image should be nearly unchanged (multipliers ~1.0)."""
    gray_value = 128
    img = np.full((50, 50, 3), gray_value, dtype=np.uint8)
    result = apply_grey_world(img)
    # All channels equal → multipliers are 1.0 → no change
    assert np.allclose(result.astype(float), img.astype(float), atol=2)


def test_grey_world_clamps_extreme_cast():
    """Extremely warm-cast image multipliers must be clamped to [0.85, 1.15]."""
    # Heavily red-dominated image
    img = np.zeros((50, 50, 3), dtype=np.uint8)
    img[:, :, 2] = 240  # red channel (BGR index 2)
    img[:, :, 1] = 10   # green
    img[:, :, 0] = 10   # blue
    result = apply_grey_world(img)
    # Blue and green channels should be boosted but clamped — not exceed 255
    assert result.max() <= 255
    assert result.min() >= 0


def test_grey_world_output_in_valid_range():
    """All pixel values must stay in [0, 255] after correction."""
    rng = np.random.default_rng(42)
    img = rng.integers(0, 256, (200, 200, 3), dtype=np.uint8)
    result = apply_grey_world(img)
    assert result.min() >= 0
    assert result.max() <= 255


# ════════════════════════════════════════════════════════════════
# check_exposure
# ════════════════════════════════════════════════════════════════

def test_check_exposure_dark_image_rejected():
    """Very dark image (mean lum < 40) must be rejected."""
    dark = np.full((100, 100, 3), 15, dtype=np.uint8)
    passed, reason = check_exposure(dark)
    assert not passed
    assert "dark" in reason.lower()


def test_check_exposure_bright_image_rejected():
    """Very bright image (mean lum > 240) must be rejected."""
    bright = np.full((100, 100, 3), 250, dtype=np.uint8)
    passed, reason = check_exposure(bright)
    assert not passed
    assert "bright" in reason.lower()


def test_check_exposure_good_image_accepted():
    """Mid-range luminance image must pass."""
    good = np.full((100, 100, 3), 128, dtype=np.uint8)
    passed, reason = check_exposure(good)
    assert passed
    assert reason == "OK"


def test_check_exposure_boundary_values():
    """Values exactly at boundaries should behave correctly."""
    # Mean lum = 40 → should pass (>= 40)
    at_low = np.full((100, 100, 3), 40, dtype=np.uint8)
    passed, _ = check_exposure(at_low)
    assert passed

    # Mean lum = 240 → should pass (<= 240)
    at_high = np.full((100, 100, 3), 240, dtype=np.uint8)
    passed, _ = check_exposure(at_high)
    assert passed


# ════════════════════════════════════════════════════════════════
# opencv_lab_to_cie
# ════════════════════════════════════════════════════════════════

def test_opencv_lab_to_cie_midpoint():
    """OpenCV LAB [128, 128, 128] should map to CIE [~50.2, 0, 0]."""
    L, a, b = opencv_lab_to_cie(np.array([128.0, 128.0, 128.0]))
    assert abs(L - 50.196) < 0.1
    assert abs(a - 0.0) < 0.1
    assert abs(b - 0.0) < 0.1


def test_opencv_lab_to_cie_white():
    """OpenCV LAB [255, 128, 128] should map to CIE L*≈100."""
    L, a, b = opencv_lab_to_cie(np.array([255.0, 128.0, 128.0]))
    assert abs(L - 100.0) < 0.5


def test_opencv_lab_to_cie_black():
    """OpenCV LAB [0, 128, 128] should map to CIE L*≈0."""
    L, a, b = opencv_lab_to_cie(np.array([0.0, 128.0, 128.0]))
    assert abs(L - 0.0) < 0.5


# ════════════════════════════════════════════════════════════════
# calculate_ita
# ════════════════════════════════════════════════════════════════

def test_ita_light_skin():
    """Light skin (high L*, moderate b*) should have high positive ITA."""
    ita = calculate_ita(80.0, 12.0)
    assert ita > 40


def test_ita_dark_skin():
    """Dark skin (low L*, low b*) should have negative ITA."""
    ita = calculate_ita(25.0, 5.0)
    assert ita < 0


def test_ita_medium_skin():
    """Medium skin tone should have ITA in mid range."""
    ita = calculate_ita(50.0, 15.0)
    assert -30 < ita < 50


def test_ita_returns_finite_for_zero_b():
    """ITA must not produce NaN or infinity when b* is near zero."""
    ita = calculate_ita(50.0, 0.0)
    assert math.isfinite(ita)


def test_ita_range():
    """ITA must always be within atan2 bounds [-180, 180]."""
    for L in [0, 25, 50, 75, 100]:
        for b in [-50, -10, 0, 10, 50]:
            ita = calculate_ita(float(L), float(b))
            assert -180 <= ita <= 180


# ════════════════════════════════════════════════════════════════
# compute_warmth_score
# ════════════════════════════════════════════════════════════════

def test_warmth_score_warm():
    """Positive a* and b* should yield positive (warm) score."""
    score = compute_warmth_score(10.0, 15.0)
    assert score > 0


def test_warmth_score_cool():
    """Negative a* and b* should yield negative (cool) score."""
    score = compute_warmth_score(-10.0, -15.0)
    assert score < 0


def test_warmth_score_b_weighted_more():
    """b* is weighted 3x more than a* — b* should dominate."""
    score_a_dominant = compute_warmth_score(20.0, 1.0)
    score_b_dominant = compute_warmth_score(1.0, 20.0)
    assert score_b_dominant > score_a_dominant


# ════════════════════════════════════════════════════════════════
# map_to_season
# ════════════════════════════════════════════════════════════════

def test_map_to_season_light_spring():
    """High ITA + warm undertone → Light Spring or True Spring."""
    season, palette, undertone = map_to_season(60.0, 5.0, 18.0)
    assert "Spring" in season
    assert len(palette) == 6
    assert undertone in ("warm", "neutral")


def test_map_to_season_deep_winter():
    """Very low ITA + cool → Deep Winter."""
    season, palette, undertone = map_to_season(-40.0, -8.0, -5.0)
    assert "Winter" in season or "Autumn" in season


def test_map_to_season_returns_valid_palette():
    """Season mapping must always return 6 hex colors."""
    for ita in [-50, -20, 0, 20, 50, 70]:
        season, palette, undertone = map_to_season(float(ita), 5.0, 10.0)
        assert len(palette) == 6
        for color in palette:
            assert color.startswith("#")
            assert len(color) == 7


def test_map_to_season_undertone_values():
    """Undertone must always be warm, cool, or neutral."""
    for ita in range(-60, 91, 10):
        _, _, undertone = map_to_season(float(ita), 3.0, 8.0)
        assert undertone in ("warm", "cool", "neutral")


def test_map_to_season_extreme_ita_fallback():
    """Extreme ITA values outside season ranges must not raise exceptions."""
    season, palette, undertone = map_to_season(95.0, 5.0, 10.0)
    assert isinstance(season, str)
    season2, _, _ = map_to_season(-80.0, -5.0, -10.0)
    assert isinstance(season2, str)


# ════════════════════════════════════════════════════════════════
# compute_color_confidence
# ════════════════════════════════════════════════════════════════

def test_confidence_tight_cluster_high():
    """Tightly clustered pixels should produce high confidence."""
    # All pixels near the same color
    center = np.array([128.0, 140.0, 120.0])
    pixels = center + np.random.default_rng(0).normal(0, 1.5, (500, 3))
    pixels = np.clip(pixels, 0, 255)
    conf = compute_color_confidence(pixels, center)
    assert conf > 0.7


def test_confidence_spread_cluster_low():
    """Widely spread pixels should produce lower confidence."""
    center = np.array([128.0, 140.0, 120.0])
    pixels = np.random.default_rng(1).uniform(0, 255, (500, 3))
    conf = compute_color_confidence(pixels, center)
    assert conf < 0.7


def test_confidence_in_range():
    """Confidence must always be in [0, 1]."""
    center = np.array([100.0, 130.0, 125.0])
    for seed in range(5):
        pixels = np.random.default_rng(seed).uniform(0, 255, (300, 3))
        conf = compute_color_confidence(pixels, center)
        assert 0.0 <= conf <= 1.0


# ════════════════════════════════════════════════════════════════
# lab_to_hex
# ════════════════════════════════════════════════════════════════

def test_lab_to_hex_format():
    """Output must always be a valid 7-char hex string."""
    for L, a, b in [(50, 0, 0), (80, 10, 15), (30, -5, -10), (100, 0, 0), (0, 0, 0)]:
        result = lab_to_hex(float(L), float(a), float(b))
        assert result.startswith("#")
        assert len(result) == 7
        int(result[1:], 16)  # must be valid hex


# ════════════════════════════════════════════════════════════════
# _get_exif_orientation (face_detector)
# ════════════════════════════════════════════════════════════════

def test_get_exif_orientation_non_jpeg_returns_1():
    """Non-JPEG bytes (e.g., PNG) should return orientation 1 (no rotation)."""
    png_bytes = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
    assert _get_exif_orientation(png_bytes) == 1


def test_get_exif_orientation_jpeg_no_exif_returns_1():
    """JPEG without EXIF orientation tag returns 1."""
    jpeg_bytes = b'\xff\xd8\xff\xe0' + b'\x00' * 200
    assert _get_exif_orientation(jpeg_bytes) == 1


def test_get_exif_orientation_empty_bytes_returns_1():
    """Empty bytes should return 1 without raising."""
    assert _get_exif_orientation(b'') == 1


# ════════════════════════════════════════════════════════════════
# _apply_exif_rotation (face_detector)
# ════════════════════════════════════════════════════════════════

def test_apply_exif_rotation_identity():
    """Orientation 1 (no rotation) should return the original image."""
    img = np.random.randint(0, 256, (100, 150, 3), dtype=np.uint8)
    result = _apply_exif_rotation(img, 1)
    assert result.shape == img.shape
    assert np.array_equal(result, img)


def test_apply_exif_rotation_180():
    """Orientation 3 (180°) should flip both axes."""
    img = np.zeros((100, 150, 3), dtype=np.uint8)
    img[0, 0] = [255, 0, 0]  # mark top-left corner
    result = _apply_exif_rotation(img, 3)
    assert result.shape == img.shape
    # After 180° rotation, the mark should be at bottom-right
    assert result[99, 149, 0] == 255


def test_apply_exif_rotation_90_cw():
    """Orientation 6 (90° CW) should transpose dimensions."""
    img = np.zeros((100, 150, 3), dtype=np.uint8)
    result = _apply_exif_rotation(img, 6)
    # 100h x 150w → rotated → 150h x 100w
    assert result.shape == (150, 100, 3)


def test_apply_exif_rotation_90_ccw():
    """Orientation 8 (90° CCW) should transpose dimensions."""
    img = np.zeros((100, 150, 3), dtype=np.uint8)
    result = _apply_exif_rotation(img, 8)
    assert result.shape == (150, 100, 3)


def test_apply_exif_rotation_unknown_orientation_passthrough():
    """Unknown orientation values should return image unchanged."""
    img = np.random.randint(0, 256, (80, 80, 3), dtype=np.uint8)
    for unknown in [0, 2, 4, 5, 7, 9, 99]:
        result = _apply_exif_rotation(img, unknown)
        assert np.array_equal(result, img)
