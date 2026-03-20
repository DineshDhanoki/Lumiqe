"""API — Image analysis endpoint."""

import asyncio
import logging
import threading

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.analysis import AnalyzeResponse
from app.repositories import user_repo
from app.core.dependencies import get_optional_user
from app.core.config import settings
from app.core.security import validate_image_bytes
from app.core.rate_limiter import check_rate_limit, get_rate_limit_key

logger = logging.getLogger("lumiqe.api.analyze")
router = APIRouter(prefix="/api", tags=["Analysis"])

# Minimum confidence for a scan to count against the user's quota
_MIN_CONFIDENCE_TO_DEDUCT = 0.5

# ─── Lazy-load CV engine (thread-safe) ───────────────────────
_engine = None
_engine_lock = threading.Lock()


def _get_engine():
    """Lazy-import the CV pipeline — double-checked locking for thread safety."""
    global _engine
    if _engine is None:
        with _engine_lock:
            if _engine is None:
                logger.info("Loading Lumiqe CV engine (first request)...")
                from app.cv import pipeline as cv_pipeline
                _engine = cv_pipeline
                logger.info("CV engine loaded successfully")
    return _engine


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_image(
    request: Request,
    image: UploadFile = File(..., description="Selfie image (JPEG, PNG, WebP)"),
    current_user: dict | None = Depends(get_optional_user),
):
    """
    Upload a selfie → receive full color analysis.

    Accepts JPEG, PNG, or WebP images up to 10MB.
    Returns season, palette, avoid colors, metal, celebrities, and more.
    Authentication optional — logged-in users get scan quota tracking.
    """
    # Rate limiting
    rate_key = get_rate_limit_key(request, current_user or {}, "analyze")
    max_requests = 50 if (current_user or {}).get("is_premium") else 5
    await check_rate_limit(rate_key, max_requests)

    # Enforce free scan quota only for logged-in users
    if current_user and current_user["free_scans_left"] <= 0 and not current_user.get("is_premium"):
        raise HTTPException(
            status_code=403,
            detail={
                "error": "TRIAL_EXPIRED",
                "detail": "No free scans remaining. Please upgrade to continue.",
                "code": 403,
            },
        )

    # Read and validate file
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

    # Validate actual file signature (magic bytes) — not spoofable
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

    # Run the analysis pipeline in a thread pool to avoid blocking the event loop
    try:
        engine = _get_engine()
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, engine.analyze_bytes, image_bytes)

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "MODEL_NOT_FOUND", "detail": str(exc), "code": 500},
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": "IMAGE_PROCESSING_ERROR", "detail": str(exc), "code": 422},
        )
    except RuntimeError as exc:
        error_msg = str(exc)
        if "No face detected" in error_msg:
            error_code = "NO_FACE_DETECTED"
        elif "Skin mask too small" in error_msg:
            error_code = "INSUFFICIENT_SKIN"
        else:
            error_code = "PIPELINE_ERROR"
        raise HTTPException(
            status_code=422,
            detail={"error": error_code, "detail": error_msg, "code": 422},
        )

    # Post-success: only decrement scan quota if logged in and confidence meets threshold
    confidence = result.get("confidence", 0.0)
    season_name = result.get("season", "")
    palette_list = result.get("palette", [])

    if current_user:
        try:
            from app.core.dependencies import async_session_factory
            async with async_session_factory() as session:
                if confidence >= _MIN_CONFIDENCE_TO_DEDUCT:
                    await user_repo.decrement_scan(session, current_user["id"])
                if season_name and palette_list:
                    await user_repo.update_palette(session, current_user["email"], season_name, palette_list)
                    logger.info(f"Saved palette for {current_user['email']}: {season_name}")
        except Exception as e:
            logger.warning(f"Could not update user record: {e}")

    return AnalyzeResponse(**result)
