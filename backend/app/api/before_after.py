"""API — Side-by-side before/after comparison image generation."""

import logging
from io import BytesIO

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from app.core.rate_limiter import check_rate_limit, get_rate_limit_key
from app.services import image_cache

logger = logging.getLogger("lumiqe.api.before_after")
router = APIRouter(prefix="/api/before-after", tags=["Before/After"])


def _hex_to_bgr(hex_color: str) -> tuple[int, int, int]:
    """Convert hex color string to BGR tuple for OpenCV."""
    hex_color = hex_color.lstrip("#")
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    return (b, g, r)


def _draw_silhouette(
    canvas: np.ndarray,
    offset_x: int,
    width: int,
    height: int,
    torso_bgr: tuple[int, int, int],
    label: str,
) -> None:
    """Draw a labeled silhouette (head + neck + torso) on the canvas."""
    center_x = offset_x + width // 2

    # Head
    head_radius = width // 8
    head_center_y = height // 5
    cv2.circle(canvas, (center_x, head_center_y), head_radius, (200, 200, 200), -1)
    cv2.circle(canvas, (center_x, head_center_y), head_radius, (150, 150, 150), 2)

    # Neck
    neck_width = width // 12
    neck_top = head_center_y + head_radius
    neck_bottom = neck_top + height // 12
    cv2.rectangle(
        canvas,
        (center_x - neck_width // 2, neck_top),
        (center_x + neck_width // 2, neck_bottom),
        (200, 200, 200),
        -1,
    )

    # Torso with the specified color
    torso_width = width // 3
    torso_top = neck_bottom
    torso_bottom = int(height * 0.75)
    cv2.rectangle(
        canvas,
        (center_x - torso_width // 2, torso_top),
        (center_x + torso_width // 2, torso_bottom),
        torso_bgr,
        -1,
    )
    cv2.rectangle(
        canvas,
        (center_x - torso_width // 2, torso_top),
        (center_x + torso_width // 2, torso_bottom),
        (100, 100, 100),
        2,
    )

    # Label text at bottom
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = max(0.4, width / 800)
    thickness = max(1, int(width / 400))
    text_size = cv2.getTextSize(label, font, font_scale, thickness)[0]
    text_x = center_x - text_size[0] // 2
    text_y = int(height * 0.88)
    cv2.putText(canvas, label, (text_x, text_y), font, font_scale, (60, 60, 60), thickness)


def _validate_hex(hex_str: str, param_name: str) -> str:
    """Validate and normalize a hex color. Returns clean 6-char hex."""
    clean = hex_str.lstrip("#")
    if len(clean) != 6:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_HEX_COLOR",
                "detail": f"{param_name} must be a 6-character hex color.",
                "code": 400,
            },
        )
    try:
        int(clean, 16)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_HEX_COLOR",
                "detail": f"{param_name} contains invalid hex characters.",
                "code": 400,
            },
        )
    return clean


def _generate_comparison(good_hex: str, bad_hex: str) -> bytes:
    """
    Generate a side-by-side PNG comparison image.
    Left side: clashing color (bad_hex), Right side: matching color (good_hex).
    """
    width = 800
    height = 500
    half_width = width // 2
    canvas = np.ones((height, width, 3), dtype=np.uint8) * 255

    # Divider line
    cv2.line(canvas, (half_width, 0), (half_width, height), (180, 180, 180), 2)

    # Left: clashing color
    bad_bgr = _hex_to_bgr(bad_hex)
    _draw_silhouette(canvas, 0, half_width, height, bad_bgr, "Clashing")

    # Right: matching color
    good_bgr = _hex_to_bgr(good_hex)
    _draw_silhouette(canvas, half_width, half_width, height, good_bgr, "Matching")

    # Title
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(canvas, "Before", (half_width // 2 - 40, 30), font, 0.7, (80, 80, 80), 2)
    cv2.putText(canvas, "After", (half_width + half_width // 2 - 30, 30), font, 0.7, (80, 80, 80), 2)

    success, png_data = cv2.imencode(".png", canvas)
    if not success:
        raise RuntimeError("Failed to encode comparison image to PNG")

    return png_data.tobytes()


@router.get("")
async def get_before_after(
    request: Request,
    good_hex: str = Query(..., description="Matching/good hex color"),
    bad_hex: str = Query(..., description="Clashing/bad hex color"),
):
    """
    Generate a side-by-side comparison PNG with a neutral silhouette
    shown twice: one with a clashing color, one with a matching color.
    Returns StreamingResponse with image/png.
    """
    rate_key = get_rate_limit_key(request, None, "before_after")
    await check_rate_limit(rate_key, max_requests=20, window_seconds=3600)

    clean_good = _validate_hex(good_hex, "good_hex")
    clean_bad = _validate_hex(bad_hex, "bad_hex")

    cache_key = ["before_after", clean_good, clean_bad]

    try:
        png_bytes = image_cache.get_or_generate(
            cache_key,
            lambda: _generate_comparison(clean_good, clean_bad),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Before/after generation failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "GENERATION_FAILED",
                "detail": "Failed to generate comparison image.",
                "code": 500,
            },
        )

    return StreamingResponse(
        BytesIO(png_bytes),
        media_type="image/png",
        headers={
            "Content-Disposition": f'inline; filename="before-after-{clean_good}-{clean_bad}.png"',
            "Cache-Control": "public, max-age=86400",
        },
    )
