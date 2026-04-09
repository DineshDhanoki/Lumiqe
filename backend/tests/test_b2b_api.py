"""Tests for B2B API helpers: key hashing, SSRF URL validation, and constants."""

import hashlib
import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-must-be-32-chars-minimum")

import pytest  # noqa: E402
from fastapi import HTTPException  # noqa: E402

from app.api.b2b_api import (  # noqa: E402
    _B2B_RATE_LIMIT,
    _hash_key,
    _validate_image_url,
)


class TestHashKey:
    """Verify SHA-256 key hashing."""

    def test_returns_sha256_hex(self):
        raw = "lmq_test_key_abc123"
        result = _hash_key(raw)
        expected = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        assert result == expected

    def test_different_keys_produce_different_hashes(self):
        assert _hash_key("key_a") != _hash_key("key_b")

    def test_hash_length_is_64(self):
        assert len(_hash_key("anything")) == 64

    def test_empty_string_hashes_deterministically(self):
        assert _hash_key("") == _hash_key("")


class TestRateLimitConstant:
    """Verify _B2B_RATE_LIMIT is a positive integer."""

    def test_is_positive_integer(self):
        assert isinstance(_B2B_RATE_LIMIT, int)
        assert _B2B_RATE_LIMIT > 0


class TestValidateImageUrl:
    """Verify SSRF protection in _validate_image_url."""

    def test_accepts_valid_https_url(self):
        # Should not raise
        _validate_image_url("https://example.com/photo.jpg")

    def test_rejects_http_url(self):
        with pytest.raises(HTTPException) as exc_info:
            _validate_image_url("http://example.com/photo.jpg")
        assert exc_info.value.status_code == 422
        assert exc_info.value.detail["error"] == "INVALID_URL"

    def test_rejects_ftp_url(self):
        with pytest.raises(HTTPException) as exc_info:
            _validate_image_url("ftp://example.com/photo.jpg")
        assert exc_info.value.status_code == 422

    def test_rejects_localhost(self):
        with pytest.raises(HTTPException) as exc_info:
            _validate_image_url("https://127.0.0.1/secret")
        assert exc_info.value.status_code == 422
        assert "private" in exc_info.value.detail["detail"].lower()

    def test_rejects_private_10_range(self):
        with pytest.raises(HTTPException) as exc_info:
            _validate_image_url("https://10.0.0.1/internal")
        assert exc_info.value.status_code == 422

    def test_rejects_private_192_168_range(self):
        with pytest.raises(HTTPException) as exc_info:
            _validate_image_url("https://192.168.1.100/photo.jpg")
        assert exc_info.value.status_code == 422

    def test_rejects_link_local_metadata(self):
        with pytest.raises(HTTPException) as exc_info:
            _validate_image_url("https://169.254.169.254/latest/meta-data/")
        assert exc_info.value.status_code == 422

    def test_accepts_public_ip(self):
        # 8.8.8.8 is a public IP — should be accepted
        _validate_image_url("https://8.8.8.8/photo.jpg")

    def test_accepts_https_with_path_and_query(self):
        _validate_image_url("https://cdn.example.com/images/photo.jpg?size=large")
