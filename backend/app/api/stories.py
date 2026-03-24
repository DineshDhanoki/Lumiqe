"""API — Instagram Stories template card generation."""

import logging
from io import BytesIO

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from app.core.rate_limiter import check_rate_limit, get_rate_limit_key
from app.services import image_cache

logger = logging.getLogger("lumiqe.api.stories")
router = APIRouter(prefix="/api/stories-card", tags=["Stories"])


def _hex_to_bgr(hex_color: str) -> tuple[int, int, int]:
    """Convert hex color string to BGR tuple for OpenCV."""
    hex_color = hex_color.lstrip("#")
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    return (b, g, r)


def _generate_stories_card(
    season: str,
    hex_color: str,
    palette: list[str],
    undertone: str,
) -> bytes:
    """
    Generate a 1080x1920 Instagram Stories-format PNG card.

    Layout:
    - Top: season name + undertone
    - Middle: dominant color swatch
    - Bottom: palette swatches row
    - Footer: Lumiqe branding
    """
    width = 1080
    height = 1920
    canvas = np.ones((height, width, 3), dtype=np.uint8) * 245

    font = cv2.FONT_HERSHEY_SIMPLEX
    font_bold = cv2.FONT_HERSHEY_DUPLEX

    # Background gradient effect (subtle)
    main_bgr = _hex_to_bgr(hex_color)
    for y in range(200):
        alpha = y / 200
        row_color = tuple(int(245 * (1 - alpha) + c * alpha * 0.3) for c in main_bgr)
        cv2.line(canvas, (0, y), (width, y), row_color, 1)

    # Title: "Your Color Season"
    cv2.putText(
        canvas, "Your Color Season", (width // 2 - 280, 300),
        font_bold, 1.5, (40, 40, 40), 3,
    )

    # Season name (large)
    season_text = season.upper()
    text_size = cv2.getTextSize(season_text, font_bold, 2.0, 4)[0]
    cv2.putText(
        canvas, season_text,
        (width // 2 - text_size[0] // 2, 420),
        font_bold, 2.0, (30, 30, 30), 4,
    )

    # Undertone
    undertone_text = f"Undertone: {undertone}"
    ut_size = cv2.getTextSize(undertone_text, font, 1.0, 2)[0]
    cv2.putText(
        canvas, undertone_text,
        (width // 2 - ut_size[0] // 2, 500),
        font, 1.0, (100, 100, 100), 2,
    )

    # Main color swatch (large circle)
    swatch_center = (width // 2, 750)
    swatch_radius = 150
    cv2.circle(canvas, swatch_center, swatch_radius, main_bgr, -1)
    cv2.circle(canvas, swatch_center, swatch_radius, (180, 180, 180), 3)

    # Hex label under swatch
    hex_label = f"#{hex_color.upper()}"
    hl_size = cv2.getTextSize(hex_label, font, 1.0, 2)[0]
    cv2.putText(
        canvas, hex_label,
        (width // 2 - hl_size[0] // 2, 950),
        font, 1.0, (60, 60, 60), 2,
    )

    # Palette section title
    cv2.putText(
        canvas, "Your Palette", (width // 2 - 140, 1080),
        font_bold, 1.2, (40, 40, 40), 2,
    )

    # Palette swatches in a row
    palette_colors = palette[:8]  # Max 8 swatches
    if palette_colors:
        swatch_size = 90
        gap = 20
        total_width = len(palette_colors) * swatch_size + (len(palette_colors) - 1) * gap
        start_x = (width - total_width) // 2
        swatch_y = 1130

        for i, color_hex in enumerate(palette_colors):
            try:
                color_bgr = _hex_to_bgr(color_hex)
            except (ValueError, IndexError):
                color_bgr = (200, 200, 200)

            x = start_x + i * (swatch_size + gap)
            cv2.rectangle(
                canvas, (x, swatch_y), (x + swatch_size, swatch_y + swatch_size),
                color_bgr, -1,
            )
            cv2.rectangle(
                canvas, (x, swatch_y), (x + swatch_size, swatch_y + swatch_size),
                (180, 180, 180), 2,
            )

    # Branding footer
    cv2.putText(
        canvas, "Lumiqe", (width // 2 - 80, 1700),
        font_bold, 1.5, (100, 100, 100), 3,
    )
    cv2.putText(
        canvas, "Find your colors at lumiqe.com", (width // 2 - 260, 1760),
        font, 0.9, (150, 150, 150), 2,
    )

    success, png_data = cv2.imencode(".png", canvas)
    if not success:
        raise RuntimeError("Failed to encode stories card to PNG")

    return png_data.tobytes()


@router.get("")
async def get_stories_card(
    request: Request,
    season: str = Query(..., description="Color season (e.g., 'Deep Autumn')"),
    hex_color: str = Query(..., description="Dominant skin hex color"),
    palette: str = Query(..., description="Comma-separated palette hex colors"),
    undertone: str = Query(default="neutral", description="Skin undertone"),
):
    """
    Generate an Instagram Stories template card as PNG.
    Returns a 1080x1920 image with season, color swatch, palette, and branding.
    """
    rate_key = get_rate_limit_key(request, None, "stories_card")
    await check_rate_limit(rate_key, max_requests=20, window_seconds=3600)

    # Parse and validate hex color
    clean_hex = hex_color.lstrip("#")
    if len(clean_hex) != 6:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_HEX_COLOR",
                "detail": "hex_color must be a 6-character hex code.",
                "code": 400,
            },
        )

    # Parse palette
    palette_list = [c.strip().lstrip("#") for c in palette.split(",") if c.strip()]
    if not palette_list:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_PALETTE",
                "detail": "palette must contain at least one comma-separated hex color.",
                "code": 400,
            },
        )

    cache_key = ["stories", season, clean_hex, ",".join(palette_list), undertone]

    try:
        png_bytes = image_cache.get_or_generate(
            cache_key,
            lambda: _generate_stories_card(season, clean_hex, palette_list, undertone),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Stories card generation failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "GENERATION_FAILED",
                "detail": "Failed to generate stories card.",
                "code": 500,
            },
        )

    return StreamingResponse(
        BytesIO(png_bytes),
        media_type="image/png",
        headers={
            "Content-Disposition": f'attachment; filename="lumiqe-stories-{season.lower().replace(" ", "-")}.png"',
            "Cache-Control": "public, max-age=3600",
        },
    )
