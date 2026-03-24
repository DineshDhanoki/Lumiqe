"""Tests for the share card generator."""

from app.services.share_card import generate_share_card

PNG_MAGIC = b"\x89PNG"


def test_generate_share_card_returns_bytes():
    result = generate_share_card(
        season="Deep Winter",
        hex_color="#8B6538",
        palette=["#C0392B", "#1A5276", "#196F3D"],
        undertone="warm",
    )
    assert isinstance(result, bytes)


def test_output_starts_with_png_magic_bytes():
    result = generate_share_card(
        season="Cool Summer",
        hex_color="#D2B48C",
        palette=["#A06858"],
        undertone="cool",
    )
    assert result[:4] == PNG_MAGIC


def test_output_size_is_positive():
    result = generate_share_card(
        season="Warm Autumn",
        hex_color="#A07848",
        palette=["#F0A080", "#C07080"],
        undertone="neutral",
    )
    assert len(result) > 0


def test_works_with_empty_palette():
    result = generate_share_card(
        season="Light Spring",
        hex_color="#EBCFAD",
        palette=[],
        undertone="warm",
    )
    assert result[:4] == PNG_MAGIC
    assert len(result) > 0


def test_works_with_full_six_palette():
    palette = ["#C0392B", "#1A5276", "#196F3D", "#F0A080", "#802040", "#D4A87C"]
    result = generate_share_card(
        season="Clear Winter",
        hex_color="#F5E6D3",
        palette=palette,
        undertone="cool",
    )
    assert isinstance(result, bytes)
    assert len(result) > 1000  # a real PNG with content should be >1KB
