"""API — Influencer/creator dashboard with tracking links and earnings."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_admin
from app.models import CreatorProfile

logger = logging.getLogger("lumiqe.api.creators")
router = APIRouter(prefix="/api/creators", tags=["Creators"])


# ─── Request / Response Schemas ──────────────────────────────


class RegisterCreatorRequest(BaseModel):
    """Request to register as a creator."""
    display_name: str = Field(..., min_length=1, max_length=255)


class CreatorDashboardResponse(BaseModel):
    """Creator dashboard statistics."""
    tracking_code: str
    tracking_url: str
    display_name: str
    clicks: int
    signups: int
    conversions: int
    earnings_cents: int
    created_at: str | None


class CreatorListItem(BaseModel):
    """Admin view of a creator."""
    id: int
    user_id: int
    display_name: str
    tracking_code: str
    clicks: int
    signups: int
    conversions: int
    earnings_cents: int
    created_at: str | None


# ─── Helpers ─────────────────────────────────────────────────


def _generate_tracking_code() -> str:
    """Generate a short, URL-safe tracking code."""
    return uuid.uuid4().hex[:8]


# ─── Endpoints ───────────────────────────────────────────────


@router.post("/register", response_model=CreatorDashboardResponse)
async def register_creator(
    body: RegisterCreatorRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Register as a creator with a custom tracking link. Auth required."""
    user_id = current_user["id"]

    # Check if already registered
    result = await session.execute(
        select(CreatorProfile).where(CreatorProfile.user_id == user_id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "ALREADY_REGISTERED",
                "detail": "You are already registered as a creator.",
                "code": 409,
            },
        )

    tracking_code = _generate_tracking_code()
    creator = CreatorProfile(
        user_id=user_id,
        tracking_code=tracking_code,
        display_name=body.display_name,
    )
    session.add(creator)
    await session.flush()

    logger.info(
        f"Creator registered: user_id={user_id} code={tracking_code} "
        f"name={body.display_name}"
    )

    return CreatorDashboardResponse(
        tracking_code=tracking_code,
        tracking_url=f"/api/creators/track/{tracking_code}",
        display_name=creator.display_name,
        clicks=0,
        signups=0,
        conversions=0,
        earnings_cents=0,
        created_at=creator.created_at.isoformat() if creator.created_at else None,
    )


@router.get("/dashboard", response_model=CreatorDashboardResponse)
async def creator_dashboard(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get creator stats: clicks, signups, conversions, earnings. Auth required."""
    result = await session.execute(
        select(CreatorProfile).where(
            CreatorProfile.user_id == current_user["id"]
        )
    )
    creator = result.scalar_one_or_none()

    if not creator:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "NOT_A_CREATOR",
                "detail": "You are not registered as a creator. Register first.",
                "code": 404,
            },
        )

    return CreatorDashboardResponse(
        tracking_code=creator.tracking_code,
        tracking_url=f"/api/creators/track/{creator.tracking_code}",
        display_name=creator.display_name,
        clicks=creator.clicks,
        signups=creator.signups,
        conversions=creator.conversions,
        earnings_cents=creator.earnings_cents,
        created_at=creator.created_at.isoformat() if creator.created_at else None,
    )


@router.get("/track/{code}")
async def track_click(
    code: str,
    session: AsyncSession = Depends(get_db),
):
    """Public endpoint. 302 redirect to frontend + increments click stats."""
    result = await session.execute(
        select(CreatorProfile).where(CreatorProfile.tracking_code == code)
    )
    creator = result.scalar_one_or_none()

    if not creator:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "INVALID_CODE",
                "detail": "Tracking code not found.",
                "code": 404,
            },
        )

    creator.clicks += 1
    logger.info(f"Creator click tracked: code={code} total_clicks={creator.clicks}")

    return RedirectResponse(
        url=f"/?ref=creator&code={code}",
        status_code=302,
    )


@router.get("/all", response_model=list[CreatorListItem])
async def list_all_creators(
    admin_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    """Admin-only: list all creators with stats."""
    result = await session.execute(
        select(CreatorProfile).order_by(CreatorProfile.clicks.desc())
    )
    creators = result.scalars().all()

    return [
        CreatorListItem(
            id=c.id,
            user_id=c.user_id,
            display_name=c.display_name,
            tracking_code=c.tracking_code,
            clicks=c.clicks,
            signups=c.signups,
            conversions=c.conversions,
            earnings_cents=c.earnings_cents,
            created_at=c.created_at.isoformat() if c.created_at else None,
        )
        for c in creators
    ]
