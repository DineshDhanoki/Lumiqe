"""Tests for validate_image_dimensions from app.core.security."""

import io
import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-must-be-32-chars-minimum")

from PIL import Image  # noqa: E402

from app.core.security import validate_image_dimensions  # noqa: E402


def _make_jpeg(width: int, height: int) -> bytes:
    """Create a minimal valid JPEG image of the given dimensions."""
    buf = io.BytesIO()
    img = Image.new("RGB", (width, height), color=(128, 64, 32))
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _make_png(width: int, height: int) -> bytes:
    """Create a minimal valid PNG image of the given dimensions."""
    buf = io.BytesIO()
    img = Image.new("RGBA", (width, height), color=(0, 0, 0, 255))
    img.save(buf, format="PNG")
    return buf.getvalue()


class TestValidSmallImages:
    """Valid images within dimension limits should pass."""

    def test_small_jpeg_passes(self):
        data = _make_jpeg(640, 480)
        assert validate_image_dimensions(data) is True

    def test_tiny_1x1_png_passes(self):
        data = _make_png(1, 1)
        assert validate_image_dimensions(data) is True


class TestEmptyAndInvalidBytes:
    """Empty or non-image data should return False."""

    def test_empty_bytes_returns_false(self):
        assert validate_image_dimensions(b"") is False

    def test_non_image_bytes_returns_false(self):
        assert validate_image_dimensions(b"this is not an image at all") is False


class TestMaxDimensionParameter:
    """Verify that the max_dimension parameter is enforced."""

    def test_image_exceeding_custom_max_fails(self):
        data = _make_jpeg(200, 200)
        assert validate_image_dimensions(data, max_dimension=100) is False

    def test_image_within_custom_max_passes(self):
        data = _make_jpeg(50, 50)
        assert validate_image_dimensions(data, max_dimension=100) is True
