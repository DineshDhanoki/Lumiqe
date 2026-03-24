"""API — Basic color overlay silhouette for virtual try-on."""

import logging
from io import BytesIO

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from app.core.rate_limiter import check_rate_limit, get_rate_limit_key
from app.services import image_cache

logger = logging.getLogger("lumiqe.api.virtual_tryon")
router = APIRouter(prefix="/api/try-on", tags=["Virtual Try-On"])


def _hex_to_bgr(hex_color: str) -> tuple[int, int, int]:
    """Convert a hex color string (e.g., '#A52A2A') to BGR tuple for OpenCV."""
    hex_color = hex_color.lstrip("#")
    if len(hex_color) != 6:
        raise ValueError(f"Invalid hex color: {hex_color}")
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    return (b, g, r)


def _generate_silhouette(hex_color: str, size: int) -> bytes:
    """
    Generate a simple silhouette image with the specified color.

    Draws head (circle), neck (rectangle), and torso (rectangle)
    on a white background. Returns PNG bytes.
    """
    canvas = np.ones((size, size, 3), dtype=np.uint8) * 255
    bgr = _hex_to_bgr(hex_color)

    center_x = size // 2

    # Head: circle at top-center
    head_radius = size // 8
    head_center_y = size // 5
    cv2.circle(canvas, (center_x, head_center_y), head_radius, (200, 200, 200), -1)
    cv2.circle(canvas, (center_x, head_center_y), head_radius, (150, 150, 150), 2)

    # Neck: narrow rectangle connecting head to torso
    neck_width = size // 12
    neck_top = head_center_y + head_radius
    neck_bottom = neck_top + size // 12
    cv2.rectangle(
        canvas,
        (center_x - neck_width // 2, neck_top),
        (center_x + neck_width // 2, neck_bottom),
        (200, 200, 200),
        -1,
    )

    # Torso: wide rectangle with the specified color
    torso_width = size // 3
    torso_top = neck_bottom
    torso_bottom = int(size * 0.85)
    cv2.rectangle(
        canvas,
        (center_x - torso_width // 2, torso_top),
        (center_x + torso_width // 2, torso_bottom),
        bgr,
        -1,
    )

    # Torso outline
    cv2.rectangle(
        canvas,
        (center_x - torso_width // 2, torso_top),
        (center_x + torso_width // 2, torso_bottom),
        (100, 100, 100),
        2,
    )

    # Encode to PNG
    success, png_data = cv2.imencode(".png", canvas)
    if not success:
        raise RuntimeError("Failed to encode silhouette image to PNG")

    return png_data.tobytes()


@router.get("")
async def get_tryon_silhouette(
    request: Request,
    hex_color: str = Query(..., description="Hex color code (e.g., '#A52A2A' or 'A52A2A')"),
    size: int = Query(default=400, ge=100, le=1200, description="Image size in pixels"),
):
    """
    Generate a simple silhouette image with the specified color applied to the torso.
    Returns a PNG image via StreamingResponse.
    Uses in-memory cache for repeated requests.
    """
    rate_key = get_rate_limit_key(request, None, "tryon")
    await check_rate_limit(rate_key, max_requests=20, window_seconds=3600)

    # Normalize hex color
    clean_hex = hex_color.lstrip("#")
    if len(clean_hex) != 6:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_HEX_COLOR",
                "detail": "Hex color must be 6 characters (e.g., 'A52A2A').",
                "code": 400,
            },
        )

    # Validate hex characters
    try:
        int(clean_hex, 16)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_HEX_COLOR",
                "detail": "Hex color contains invalid characters.",
                "code": 400,
            },
        )

    cache_key = ["tryon", clean_hex, str(size)]

    try:
        png_bytes = image_cache.get_or_generate(
            cache_key,
            lambda: _generate_silhouette(clean_hex, size),
        )
    except Exception as exc:
        logger.error(f"Silhouette generation failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "GENERATION_FAILED",
                "detail": "Failed to generate silhouette image.",
                "code": 500,
            },
        )

    return StreamingResponse(
        BytesIO(png_bytes),
        media_type="image/png",
        headers={
            "Content-Disposition": f'inline; filename="tryon-{clean_hex}.png"',
            "Cache-Control": "public, max-age=86400",
        },
    )
