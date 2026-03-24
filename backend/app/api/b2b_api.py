"""API — B2B partner API with key management and metered analysis."""

import hashlib
import logging
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.models import APIKey

logger = logging.getLogger("lumiqe.api.b2b")
router = APIRouter(prefix="/api/b2b", tags=["B2B API"])

# ─── In-memory rate limit tracking (per key_hash) ───────────
_rate_window: dict[str, list[float]] = {}
_B2B_RATE_LIMIT = 100  # requests per hour


# ─── Request / Response Schemas ──────────────────────────────


class CreateKeyRequest(BaseModel):
    """Request body to create a new B2B API key."""
    name: str = Field(..., min_length=1, max_length=255, description="Human-readable key name")


class CreateKeyResponse(BaseModel):
    """Response containing the raw key (shown only once)."""
    id: int
    name: str
    raw_key: str
    message: str = "Store this key securely — it will not be shown again."


class APIKeyResponse(BaseModel):
    """Public representation of an API key (no raw key)."""
    id: int
    name: str
    key_hash_preview: str
    is_active: bool
    total_calls: int
    created_at: str | None


class B2BAnalyzeRequest(BaseModel):
    """Metered analysis request from a B2B partner."""
    image_url: str = Field(..., description="URL of image to analyze")


class UsageResponse(BaseModel):
    """Usage statistics for a B2B API key."""
    key_name: str
    total_calls: int
    is_active: bool
    calls_this_hour: int
    rate_limit: int


# ─── Helpers ─────────────────────────────────────────────────


def _hash_key(raw_key: str) -> str:
    """Compute SHA-256 hash of a raw API key."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def _check_b2b_rate_limit(key_hash: str) -> int:
    """
    Check and enforce per-key rate limiting.
    Returns the number of calls in the current window.
    Raises HTTPException if limit exceeded.
    """
    now = datetime.now(timezone.utc).timestamp()
    window_start = now - 3600  # 1 hour window

    if key_hash not in _rate_window:
        _rate_window[key_hash] = []

    # Prune old entries
    _rate_window[key_hash] = [
        ts for ts in _rate_window[key_hash] if ts > window_start
    ]

    if len(_rate_window[key_hash]) >= _B2B_RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "RATE_LIMIT_EXCEEDED",
                "detail": f"API key rate limit of {_B2B_RATE_LIMIT}/hour exceeded.",
                "code": 429,
            },
        )

    _rate_window[key_hash].append(now)
    return len(_rate_window[key_hash])


async def _validate_api_key(
    session: AsyncSession,
    x_api_key: str,
) -> APIKey:
    """Validate a B2B API key from the X-API-Key header."""
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "MISSING_API_KEY",
                "detail": "X-API-Key header is required.",
                "code": 401,
            },
        )

    key_hash = _hash_key(x_api_key)
    result = await session.execute(
        select(APIKey).where(APIKey.key_hash == key_hash)
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "INVALID_API_KEY",
                "detail": "The provided API key is not valid.",
                "code": 401,
            },
        )

    if not api_key.is_active:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "KEY_DEACTIVATED",
                "detail": "This API key has been deactivated.",
                "code": 403,
            },
        )

    return api_key


# ─── Endpoints ───────────────────────────────────────────────


@router.post("/keys", response_model=CreateKeyResponse)
async def create_api_key(
    body: CreateKeyRequest,
    admin_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    """Create a new B2B API key. Admin only. Raw key is shown once."""
    raw_key = secrets.token_urlsafe(32)
    key_hash = _hash_key(raw_key)

    api_key = APIKey(
        name=body.name,
        key_hash=key_hash,
        created_by=admin_user["id"],
    )
    session.add(api_key)
    await session.flush()

    logger.info(
        f"B2B API key created: name={body.name} id={api_key.id} "
        f"by admin_id={admin_user['id']}"
    )

    return CreateKeyResponse(
        id=api_key.id,
        name=api_key.name,
        raw_key=raw_key,
    )


@router.get("/keys", response_model=list[APIKeyResponse])
async def list_api_keys(
    admin_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    """List all B2B API keys. Admin only."""
    result = await session.execute(
        select(APIKey).order_by(APIKey.created_at.desc())
    )
    keys = result.scalars().all()

    return [
        APIKeyResponse(
            id=k.id,
            name=k.name,
            key_hash_preview=k.key_hash[:12] + "...",
            is_active=k.is_active,
            total_calls=k.total_calls,
            created_at=k.created_at.isoformat() if k.created_at else None,
        )
        for k in keys
    ]


@router.delete("/keys/{key_id}")
async def deactivate_api_key(
    key_id: int,
    admin_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    """Deactivate a B2B API key. Admin only."""
    result = await session.execute(
        select(APIKey).where(APIKey.id == key_id)
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "KEY_NOT_FOUND",
                "detail": f"API key with id {key_id} not found.",
                "code": 404,
            },
        )

    api_key.is_active = False
    logger.info(
        f"B2B API key deactivated: id={key_id} by admin_id={admin_user['id']}"
    )

    return {"message": f"API key '{api_key.name}' has been deactivated."}


@router.post("/analyze")
async def b2b_analyze(
    body: B2BAnalyzeRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
    session: AsyncSession = Depends(get_db),
):
    """
    Metered analysis endpoint for B2B partners.
    Validates API key, enforces rate limits, and increments usage counter.
    """
    api_key = await _validate_api_key(session, x_api_key)

    # Enforce per-key rate limit
    calls_this_hour = _check_b2b_rate_limit(api_key.key_hash)

    # Increment total calls
    api_key.total_calls += 1

    logger.info(
        f"B2B analysis: key_id={api_key.id} key_name={api_key.name} "
        f"calls_this_hour={calls_this_hour} total_calls={api_key.total_calls}"
    )

    # Delegate to the existing analysis pipeline
    try:
        from app.services.color_matcher import analyze_from_url
        result = await analyze_from_url(body.image_url)
    except ImportError:
        # Fallback: return a placeholder if the service isn't available
        result = {
            "status": "analysis_queued",
            "image_url": body.image_url,
            "message": "Analysis service is being initialized.",
        }
    except Exception as exc:
        logger.error(f"B2B analysis failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "ANALYSIS_FAILED",
                "detail": "Image analysis failed. Please try again.",
                "code": 500,
            },
        )

    return {
        "result": result,
        "usage": {
            "calls_this_hour": calls_this_hour,
            "rate_limit": _B2B_RATE_LIMIT,
            "total_calls": api_key.total_calls,
        },
    }


@router.get("/usage", response_model=UsageResponse)
async def get_usage(
    x_api_key: str = Header(..., alias="X-API-Key"),
    session: AsyncSession = Depends(get_db),
):
    """Get usage statistics for the provided API key."""
    api_key = await _validate_api_key(session, x_api_key)

    # Count calls in current hour window
    now = datetime.now(timezone.utc).timestamp()
    window_start = now - 3600
    calls_this_hour = len([
        ts for ts in _rate_window.get(api_key.key_hash, [])
        if ts > window_start
    ])

    return UsageResponse(
        key_name=api_key.name,
        total_calls=api_key.total_calls,
        is_active=api_key.is_active,
        calls_this_hour=calls_this_hour,
        rate_limit=_B2B_RATE_LIMIT,
    )
