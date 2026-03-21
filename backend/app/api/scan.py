"""API — Buy or Pass clothing scanner endpoint."""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.scan import ScanItemResponse
from app.repositories import user_repo
from app.core.dependencies import get_db, get_current_user
from app.core.config import settings
from app.core.security import validate_image_bytes
from app.core.rate_limiter import check_rate_limit, get_rate_limit_key

logger = logging.getLogger("lumiqe.api.scan")
router = APIRouter(prefix="/api", tags=["Scanner"])


@router.post("/scan-item", response_model=ScanItemResponse)
async def scan_clothing_item(
    request: Request,
    image: UploadFile = File(..., description="Photo of the clothing item"),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Buy or Pass scanner: upload a clothing photo and get a match score
    against the user's personal color palette.
    Requires authentication — user email extracted from JWT.
    """
    email = current_user["email"]

    # Rate limiting: 10/hour
    rate_key = get_rate_limit_key(request, current_user, "scan")
    await check_rate_limit(rate_key, 10)

    # Step 1: Look up user's stored palette
    user_palette = await user_repo.get_palette(session, email)
    if not user_palette:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "NO_PALETTE_FOUND",
                "detail": "Please complete a face analysis first to build your palette.",
                "code": 404,
            },
        )

    # Step 2: Read and validate image
    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=422,
            detail={"error": "EMPTY_FILE", "detail": "Uploaded file is empty", "code": 422},
        )
    if len(image_bytes) > settings.MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail={
                "error": "FILE_TOO_LARGE",
                "detail": f"Image exceeds {settings.MAX_UPLOAD_BYTES // (1024*1024)}MB limit",
                "code": 413,
            },
        )

    # Validate actual file signature (magic bytes)
    detected_format = validate_image_bytes(image_bytes)
    if detected_format is None:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "INVALID_FILE_TYPE",
                "detail": "File is not a valid JPEG, PNG, or WebP image.",
                "code": 422,
            },
        )

    # Step 3: Extract dominant color and score match
    try:
        from app.services.color_matcher import extract_dominant_color, score_match

        dominant_hex = extract_dominant_color(image_bytes)
        result = score_match(dominant_hex, user_palette["palette"])

        logger.info(
            f"Scan for {email}: item={dominant_hex} "
            f"score={result['match_score']} verdict={result['verdict']}"
        )

        return ScanItemResponse(**result)

    except Exception as exc:
        logger.error(f"Scan-item failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "SCAN_FAILED", "detail": "An error occurred during scanning.", "code": 500},
        )
