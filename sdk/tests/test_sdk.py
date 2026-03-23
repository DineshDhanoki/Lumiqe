"""Tests for Lumiqe SDK — models, client validation, and error handling."""

import pytest

from lumiqe_sdk.models import AnalysisResult, UsageInfo
from lumiqe_sdk.client import LumiqeClient, LumiqeAPIError


# -- AnalysisResult.from_dict -------------------------------------------------


def test_analysis_result_from_dict():
    """from_dict should populate all fields from a typical API response."""
    data = {
        "season": "Deep Autumn",
        "hex_color": "#C8956C",
        "undertone": "warm",
        "confidence": 0.85,
        "palette": ["#8B4513", "#DAA520"],
        "avoid_colors": ["#FF00FF"],
        "metal": "gold",
        "contrast_level": "high",
    }
    result = AnalysisResult.from_dict(data)
    assert result.season == "Deep Autumn"
    assert result.hex_color == "#C8956C"
    assert result.undertone == "warm"
    assert result.confidence == 0.85
    assert result.palette == ["#8B4513", "#DAA520"]
    assert result.avoid_colors == ["#FF00FF"]
    assert result.metal == "gold"
    assert result.contrast_level == "high"


# -- is_warm / is_cool --------------------------------------------------------


def test_is_warm_with_warm_undertone():
    result = AnalysisResult(
        season="Deep Autumn",
        hex_color="#C8956C",
        undertone="warm",
        confidence=0.9,
    )
    assert result.is_warm is True


def test_is_warm_with_spring_season():
    """Spring season should be detected as warm even with neutral undertone."""
    result = AnalysisResult(
        season="Light Spring",
        hex_color="#FFDAB9",
        undertone="neutral",
        confidence=0.8,
    )
    assert result.is_warm is True


def test_is_cool_with_cool_undertone():
    result = AnalysisResult(
        season="True Summer",
        hex_color="#B0C4DE",
        undertone="cool",
        confidence=0.85,
    )
    assert result.is_cool is True


def test_is_cool_with_winter_season():
    """Winter season should be detected as cool."""
    result = AnalysisResult(
        season="Deep Winter",
        hex_color="#191970",
        undertone="neutral",
        confidence=0.75,
    )
    assert result.is_cool is True


# -- is_high_confidence -------------------------------------------------------


def test_is_high_confidence_above_threshold():
    result = AnalysisResult(
        season="Autumn", hex_color="#A0522D", undertone="warm", confidence=0.85
    )
    assert result.is_high_confidence is True


def test_is_high_confidence_at_threshold():
    """Exactly 0.7 should count as high confidence."""
    result = AnalysisResult(
        season="Autumn", hex_color="#A0522D", undertone="warm", confidence=0.7
    )
    assert result.is_high_confidence is True


def test_is_high_confidence_below_threshold():
    result = AnalysisResult(
        season="Autumn", hex_color="#A0522D", undertone="warm", confidence=0.69
    )
    assert result.is_high_confidence is False


# -- UsageInfo.from_dict ------------------------------------------------------


def test_usage_info_from_dict():
    data = {
        "total_calls": 1500,
        "calls_this_month": 42,
        "rate_limit": 5000,
    }
    usage = UsageInfo.from_dict(data)
    assert usage.total_calls == 1500
    assert usage.calls_this_month == 42
    assert usage.rate_limit == 5000


# -- LumiqeClient validation --------------------------------------------------


def test_client_rejects_empty_api_key():
    with pytest.raises(ValueError, match="non-empty"):
        LumiqeClient(api_key="")


def test_client_sets_correct_base_url():
    client = LumiqeClient(api_key="test-key-123", base_url="https://custom.api.com/")
    assert client._base_url == "https://custom.api.com"


# -- LumiqeAPIError format ----------------------------------------------------


def test_api_error_format():
    """LumiqeAPIError should carry status_code, error, and detail."""
    err = LumiqeAPIError(status_code=429, error="RATE_LIMIT_EXCEEDED", detail="Too many requests")
    assert err.status_code == 429
    assert err.error == "RATE_LIMIT_EXCEEDED"
    assert err.detail == "Too many requests"
    assert "429" in str(err)
    assert "RATE_LIMIT_EXCEEDED" in str(err)
