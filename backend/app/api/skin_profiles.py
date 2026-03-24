"""API — Seasonal skin adaptation tracking over time."""

import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models import AnalysisResult

logger = logging.getLogger("lumiqe.api.skin_profiles")
router = APIRouter(prefix="/api/skin-profiles", tags=["Skin Profiles"])


# ─── Response Schemas ────────────────────────────────────────


class MonthEntry(BaseModel):
    """A single month's analysis snapshot."""
    month: str
    season: str
    hex_color: str
    undertone: str
    confidence: float
    analysis_id: str


class SkinProfileTimeline(BaseModel):
    """Timeline of analyses grouped by month with shift detection."""
    timeline: list[MonthEntry]
    shift_detected: bool
    shifts: list[dict]
    total_analyses: int


# ─── Endpoints ───────────────────────────────────────────────


@router.get("", response_model=SkinProfileTimeline)
async def get_skin_profile_timeline(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Groups user's analysis history by month, detects tone shifts
    (season changes between consecutive analyses), and returns
    a timeline with shift_detected boolean.
    Auth required.
    """
    user_id = current_user["id"]

    result = await session.execute(
        select(AnalysisResult)
        .where(AnalysisResult.user_id == user_id)
        .order_by(AnalysisResult.created_at.asc())
    )
    analyses = result.scalars().all()

    if not analyses:
        return SkinProfileTimeline(
            timeline=[],
            shift_detected=False,
            shifts=[],
            total_analyses=0,
        )

    # Group by month, taking the latest analysis per month
    monthly: dict[str, AnalysisResult] = {}
    for analysis in analyses:
        month_key = analysis.created_at.strftime("%Y-%m")
        monthly[month_key] = analysis  # Last one wins per month

    # Build ordered timeline
    sorted_months = sorted(monthly.keys())
    timeline = []
    for month_key in sorted_months:
        a = monthly[month_key]
        timeline.append(
            MonthEntry(
                month=month_key,
                season=a.season,
                hex_color=a.hex_color,
                undertone=a.undertone,
                confidence=a.confidence,
                analysis_id=a.id,
            )
        )

    # Detect shifts: season changed between consecutive months
    shifts = []
    for i in range(1, len(timeline)):
        prev = timeline[i - 1]
        curr = timeline[i]
        if prev.season != curr.season:
            shifts.append({
                "from_month": prev.month,
                "to_month": curr.month,
                "from_season": prev.season,
                "to_season": curr.season,
            })

    shift_detected = len(shifts) > 0

    logger.info(
        f"Skin profile timeline: user_id={user_id} months={len(timeline)} "
        f"shifts={len(shifts)}"
    )

    return SkinProfileTimeline(
        timeline=timeline,
        shift_detected=shift_detected,
        shifts=shifts,
        total_analyses=len(analyses),
    )
