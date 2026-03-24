"""Tests for community post Pydantic models and validation."""

import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-must-be-32-chars-minimum")

import pytest  # noqa: E402
from pydantic import ValidationError  # noqa: E402

from app.api.community import CreatePostRequest, FeedResponse  # noqa: E402


class TestCreatePostRequest:
    """Validate CreatePostRequest model constraints."""

    def test_valid_post(self):
        post = CreatePostRequest(
            image_url="https://example.com/look.jpg",
            caption="My spring outfit",
            season_tag="spring",
        )
        assert post.image_url == "https://example.com/look.jpg"
        assert post.caption == "My spring outfit"
        assert post.season_tag == "spring"

    def test_missing_caption_raises(self):
        with pytest.raises(ValidationError):
            CreatePostRequest(
                image_url="https://example.com/look.jpg",
                season_tag="winter",
            )

    def test_empty_caption_rejected(self):
        with pytest.raises(ValidationError):
            CreatePostRequest(
                image_url="https://example.com/look.jpg",
                caption="",
                season_tag="summer",
            )

    def test_season_filter_accepts_valid_seasons(self):
        """season_tag is a free string; verify common values pass."""
        for season in ("spring", "summer", "autumn", "winter", "deep_winter"):
            post = CreatePostRequest(
                image_url="https://example.com/img.jpg",
                caption="Look",
                season_tag=season,
            )
            assert post.season_tag == season


class TestFeedResponseDefaults:
    """Verify FeedResponse serialization with pagination defaults."""

    def test_feed_response_with_defaults(self):
        feed = FeedResponse(posts=[], page=1, limit=20, total=0)
        assert feed.page == 1
        assert feed.limit == 20
        assert feed.total == 0
        assert feed.posts == []
