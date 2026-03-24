"""
Lumiqe -- OG Image Generator.

Generates 1200x630 Open Graph images for social sharing.
Delegates to the share_card service for the actual image generation.
"""

from app.services.share_card import generate_share_card


def generate_og_image(
    season: str,
    hex_color: str,
    palette: list[str],
    undertone: str = "",
) -> bytes:
    """Generate a 1200x630 OG image with palette swatches and branding."""
    return generate_share_card(
        season=season,
        hex_color=hex_color,
        palette=palette,
        undertone=undertone,
    )
