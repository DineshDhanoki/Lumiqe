"""API — Palette card generation endpoint."""

import logging
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas.product import PaletteCardRequest
from app.core.dependencies import get_current_user

logger = logging.getLogger("lumiqe.api.palette_card")
router = APIRouter(prefix="/api", tags=["Palette Card"])


@router.post("/palette-card")
async def generate_palette_card(
    request: PaletteCardRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate a shareable palette card image (PNG).
    Returns a 1080x1920 PNG suitable for Instagram stories.
    Requires authentication.
    """
    try:
        from app.services.palette_card import generate_card
        png_bytes = generate_card(
            season=request.season,
            palette=request.palette,
            hex_color=request.hex_color,
            undertone=request.undertone,
            metal=request.metal,
            confidence=request.confidence,
        )
        return StreamingResponse(
            BytesIO(png_bytes),
            media_type="image/png",
            headers={
                "Content-Disposition": f'attachment; filename="lumiqe-{request.season.lower().replace(" ", "-")}.png"'
            },
        )
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "SERVICE_UNAVAILABLE",
                "detail": "Palette card generation service not available.",
                "code": 500,
            },
        )
    except Exception as exc:
        logger.error(f"Palette card generation failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "GENERATION_FAILED", "detail": "Failed to generate palette card.", "code": 500},
        )


@router.post("/palette-card/square")
async def generate_square_palette_card(
    request: PaletteCardRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate a 1080x1080 Instagram-friendly palette card (PNG).
    Includes Lumiqe branding and CTA.
    """
    try:
        from app.services.palette_card import generate_square_card
        png_bytes = generate_square_card(
            season=request.season,
            palette=request.palette,
            hex_color=request.hex_color,
            undertone=request.undertone,
            metal=request.metal,
            confidence=request.confidence,
        )
        return StreamingResponse(
            BytesIO(png_bytes),
            media_type="image/png",
            headers={
                "Content-Disposition": f'attachment; filename="lumiqe-{request.season.lower().replace(" ", "-")}-square.png"'
            },
        )
    except Exception as exc:
        logger.error(f"Square palette card generation failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "GENERATION_FAILED", "detail": "Failed to generate palette card.", "code": 500},
        )
