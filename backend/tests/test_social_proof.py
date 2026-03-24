"""Tests for the social proof service (signature and structure only)."""

import inspect

from app.services.social_proof import (
    _TRENDING_THRESHOLD,
    _TRENDING_WINDOW_DAYS,
    get_product_social_proof,
)


def test_function_exists_and_is_async():
    """get_product_social_proof must be an async function."""
    assert inspect.iscoroutinefunction(get_product_social_proof)


def test_function_has_correct_parameters():
    """The function should accept session, product_ids, and user_season."""
    sig = inspect.signature(get_product_social_proof)
    params = list(sig.parameters.keys())
    assert "session" in params
    assert "product_ids" in params
    assert "user_season" in params


def test_return_annotation_is_dict():
    """Return type annotation should be dict[str, dict]."""
    sig = inspect.signature(get_product_social_proof)
    annotation = sig.return_annotation
    # Check it includes 'dict' in its string repr
    assert "dict" in str(annotation).lower()


def test_trending_threshold_is_positive():
    """The trending threshold must be a positive integer."""
    assert isinstance(_TRENDING_THRESHOLD, int)
    assert _TRENDING_THRESHOLD > 0


def test_trending_window_days_is_positive():
    """The trending window must be a positive integer."""
    assert isinstance(_TRENDING_WINDOW_DAYS, int)
    assert _TRENDING_WINDOW_DAYS > 0
