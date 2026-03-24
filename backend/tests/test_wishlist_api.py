"""Tests for wishlist API Pydantic models and validation logic."""

import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-must-be-32-chars-minimum")

import pytest  # noqa: E402
from pydantic import ValidationError  # noqa: E402

from app.api.wishlist import WishlistAddRequest  # noqa: E402


class TestWishlistAddRequestValid:
    """Test WishlistAddRequest accepts valid data."""

    def test_valid_full_request(self):
        req = WishlistAddRequest(
            product_id="prod_123",
            product_name="Summer Dress",
            product_brand="Zara",
            product_price="₹2,499",
            product_image="https://example.com/img.jpg",
            product_url="https://example.com/product/123",
            match_score=85,
        )
        assert req.product_id == "prod_123"
        assert req.product_name == "Summer Dress"
        assert req.product_brand == "Zara"
        assert req.product_price == "₹2,499"
        assert req.product_image == "https://example.com/img.jpg"
        assert req.product_url == "https://example.com/product/123"
        assert req.match_score == 85

    def test_all_required_fields_accepted(self):
        """Model must accept all six required string fields."""
        data = {
            "product_id": "abc",
            "product_name": "Shirt",
            "product_brand": "H&M",
            "product_price": "999",
            "product_image": "https://img.example.com/a.png",
            "product_url": "https://example.com/a",
        }
        req = WishlistAddRequest(**data)
        for key, value in data.items():
            assert getattr(req, key) == value


class TestWishlistAddRequestDefaults:
    """Test default values on the model."""

    def test_match_score_defaults_to_zero(self):
        req = WishlistAddRequest(
            product_id="prod_1",
            product_name="Top",
            product_brand="Brand",
            product_price="500",
            product_image="https://img.example.com/1.jpg",
            product_url="https://example.com/1",
        )
        assert req.match_score == 0

    def test_match_score_explicit_override(self):
        req = WishlistAddRequest(
            product_id="prod_1",
            product_name="Top",
            product_brand="Brand",
            product_price="500",
            product_image="https://img.example.com/1.jpg",
            product_url="https://example.com/1",
            match_score=42,
        )
        assert req.match_score == 42


class TestWishlistAddRequestMissingFields:
    """Test that missing required fields raise ValidationError."""

    def test_missing_product_id(self):
        with pytest.raises(ValidationError) as exc_info:
            WishlistAddRequest(
                product_name="Dress",
                product_brand="Brand",
                product_price="100",
                product_image="https://img.example.com/1.jpg",
                product_url="https://example.com/1",
            )
        errors = exc_info.value.errors()
        field_names = [e["loc"][0] for e in errors]
        assert "product_id" in field_names

    def test_missing_product_name(self):
        with pytest.raises(ValidationError) as exc_info:
            WishlistAddRequest(
                product_id="p1",
                product_brand="Brand",
                product_price="100",
                product_image="https://img.example.com/1.jpg",
                product_url="https://example.com/1",
            )
        errors = exc_info.value.errors()
        field_names = [e["loc"][0] for e in errors]
        assert "product_name" in field_names

    def test_missing_multiple_fields(self):
        with pytest.raises(ValidationError) as exc_info:
            WishlistAddRequest(product_id="p1")
        errors = exc_info.value.errors()
        missing = {e["loc"][0] for e in errors}
        assert "product_name" in missing
        assert "product_brand" in missing
        assert "product_price" in missing

    def test_empty_body_raises(self):
        with pytest.raises(ValidationError):
            WishlistAddRequest()
