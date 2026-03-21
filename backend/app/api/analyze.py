"""API — Image analysis endpoint."""

import asyncio
import logging
import threading
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from app.schemas.analysis import AnalyzeResponse
from app.repositories import user_repo, analysis_repo
from app.core.dependencies import get_optional_user
from app.services.email import send_analysis_complete_email
from app.core.config import settings
from app.core.security import validate_image_bytes
from app.core.rate_limiter import check_rate_limit, get_rate_limit_key

logger = logging.getLogger("lumiqe.api.analyze")
router = APIRouter(prefix="/api", tags=["Analysis"])

# Minimum confidence for a scan to count against the user's quota
_MIN_CONFIDENCE_TO_DEDUCT = 0.5

# Bounded thread pool for CV pipeline — prevents OOM under load
_cv_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="cv-pipeline")

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

    # Enforce scan quota for logged-in non-premium users
    if current_user and not current_user.get("is_premium"):
        # Check active trial
        has_trial = False
        trial_ends = current_user.get("trial_ends_at")
        if trial_ends:
            from datetime import datetime, timezone
            try:
                trial_dt = datetime.fromisoformat(trial_ends) if isinstance(trial_ends, str) else trial_ends
                has_trial = trial_dt > datetime.now(timezone.utc)
            except (ValueError, TypeError):
                pass

        if not has_trial and current_user["free_scans_left"] <= 0 and current_user.get("credits", 0) <= 0:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "TRIAL_EXPIRED",
                    "detail": "No free scans or credits remaining. Please upgrade or buy credits to continue.",
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
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(_cv_executor, engine.analyze_bytes, image_bytes)

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

    # Post-success: persist result, decrement scan quota, update user palette
    confidence = result.get("confidence", 0.0)
    season_name = result.get("season", "")
    palette_list = result.get("palette", [])
    analysis_id = None

    if current_user:
        try:
            from app.core.dependencies import async_session_factory
            async with async_session_factory() as session:
                if confidence >= _MIN_CONFIDENCE_TO_DEDUCT:
                    # Deduct from free scans first, then credits
                    if current_user["free_scans_left"] > 0:
                        await user_repo.decrement_scan(session, current_user["id"])
                    elif current_user.get("credits", 0) > 0:
                        await user_repo.deduct_credit(session, current_user["id"])
                if season_name and palette_list:
                    await user_repo.update_palette(session, current_user["email"], season_name, palette_list)
                # Persist the full analysis result
                saved = await analysis_repo.save_result(
                    session,
                    user_id=current_user["id"],
                    season=season_name,
                    hex_color=result.get("hex_color", ""),
                    undertone=result.get("undertone", ""),
                    confidence=confidence,
                    contrast_level=result.get("contrast_level", ""),
                    palette=palette_list,
                    avoid_colors=result.get("avoid_colors", []),
                    metal=result.get("metal", ""),
                    full_result=result,
                )
                analysis_id = saved["id"]
                logger.info(f"Saved analysis {analysis_id} for {current_user['email']}: {season_name}")
                await session.commit()
                # Fire-and-forget analysis complete email
                send_analysis_complete_email(
                    to=current_user["email"],
                    name=current_user.get("name", ""),
                    season=season_name,
                    hex_color=result.get("hex_color", ""),
                    palette=palette_list,
                    analysis_id=analysis_id,
                )
        except Exception as e:
            logger.warning(f"Could not save analysis result: {e}")

    return AnalyzeResponse(analysis_id=analysis_id, **result)
