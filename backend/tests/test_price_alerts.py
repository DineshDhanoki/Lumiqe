"""Tests for app.api.price_alerts — Pydantic model validation."""

import os
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-characters")

import pytest
from pydantic import ValidationError

from app.api.price_alerts import CreatePriceAlertRequest


# ── Default target_drop_percent ───────────────────────────────


def test_target_drop_percent_defaults_to_15():
    """target_drop_percent defaults to 15 when omitted."""
    req = CreatePriceAlertRequest(
        product_id="prod_001",
        product_name="MAC Lipstick",
        product_url="https://example.com/lipstick",
        original_price_cents=2500,
    )
    assert req.target_drop_percent == 15


# ── original_price_cents must be positive ─────────────────────


def test_original_price_cents_must_be_positive():
    """original_price_cents must be > 0 (gt=0 constraint)."""
    with pytest.raises(ValidationError):
        CreatePriceAlertRequest(
            product_id="prod_001",
            product_name="MAC Lipstick",
            product_url="https://example.com/lipstick",
            original_price_cents=0,
        )


def test_original_price_cents_rejects_negative():
    """Negative values are invalid."""
    with pytest.raises(ValidationError):
        CreatePriceAlertRequest(
            product_id="prod_001",
            product_name="MAC Lipstick",
            product_url="https://example.com/lipstick",
            original_price_cents=-100,
        )


# ── Required fields ──────────────────────────────────────────


def test_product_id_required():
    """product_id is required."""
    with pytest.raises(ValidationError):
        CreatePriceAlertRequest(
            product_name="Lipstick",
            product_url="https://example.com",
            original_price_cents=1000,
        )


def test_product_name_required():
    """product_name is required."""
    with pytest.raises(ValidationError):
        CreatePriceAlertRequest(
            product_id="prod_001",
            product_url="https://example.com",
            original_price_cents=1000,
        )
