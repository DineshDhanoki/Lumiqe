"""API — Admin analytics dashboard with funnel, retention, and affiliate metrics."""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.models import User, AnalysisResult, Event, WishlistItem

logger = logging.getLogger("lumiqe.api.analytics_dashboard")
router = APIRouter(prefix="/api/admin/analytics", tags=["Analytics"])


# ─── Response Schemas ────────────────────────────────────────


class FunnelStep(BaseModel):
    """A single step in the conversion funnel."""
    step: str
    count: int
    percentage: float


class FunnelResponse(BaseModel):
    """Full conversion funnel from signup to premium."""
    steps: list[FunnelStep]
    total_users: int


class CohortWeek(BaseModel):
    """Retention data for a single signup cohort."""
    cohort_week: str
    cohort_size: int
    retained: list[int]


class RetentionResponse(BaseModel):
    """8-week cohort retention table."""
    cohorts: list[CohortWeek]
    weeks_tracked: int


class AffiliatePerformanceResponse(BaseModel):
    """Affiliate click performance summary."""
    total_clicks: int
    last_7_days: int
    last_30_days: int


# ─── Endpoints ───────────────────────────────────────────────


@router.get("/funnel", response_model=FunnelResponse)
async def get_funnel(
    admin_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    """
    Signup -> analysis -> wishlist -> wardrobe -> premium conversion funnel.
    Queries User model counts at each stage.
    """
    # Total users (signup)
    total_result = await session.execute(select(func.count(User.id)))
    total_users = total_result.scalar() or 0

    # Users with at least one analysis
    analysis_result = await session.execute(
        select(func.count(func.distinct(AnalysisResult.user_id)))
    )
    users_with_analysis = analysis_result.scalar() or 0

    # Users with at least one wishlist item
    wishlist_result = await session.execute(
        select(func.count(func.distinct(WishlistItem.user_id)))
    )
    users_with_wishlist = wishlist_result.scalar() or 0

    # Users with palette set (wardrobe stage)
    wardrobe_result = await session.execute(
        select(func.count(User.id)).where(User.palette.isnot(None))
    )
    users_with_wardrobe = wardrobe_result.scalar() or 0

    # Premium users
    premium_result = await session.execute(
        select(func.count(User.id)).where(User.is_premium == True)  # noqa: E712
    )
    premium_users = premium_result.scalar() or 0

    def _pct(count: int) -> float:
        if total_users == 0:
            return 0.0
        return round(count / total_users * 100, 1)

    steps = [
        FunnelStep(step="signup", count=total_users, percentage=100.0),
        FunnelStep(step="analysis", count=users_with_analysis, percentage=_pct(users_with_analysis)),
        FunnelStep(step="wishlist", count=users_with_wishlist, percentage=_pct(users_with_wishlist)),
        FunnelStep(step="wardrobe", count=users_with_wardrobe, percentage=_pct(users_with_wardrobe)),
        FunnelStep(step="premium", count=premium_users, percentage=_pct(premium_users)),
    ]

    return FunnelResponse(steps=steps, total_users=total_users)


@router.get("/retention", response_model=RetentionResponse)
async def get_retention(
    admin_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
    weeks: int = Query(default=8, ge=1, le=52),
):
    """
    8-week cohort retention table.
    Users are grouped by signup week and considered retained if they have
    an analysis result in subsequent weeks.
    """
    now = datetime.now(timezone.utc)
    cohorts = []

    for w in range(weeks):
        cohort_start = now - timedelta(weeks=weeks - w)
        cohort_end = cohort_start + timedelta(weeks=1)
        cohort_week_label = cohort_start.strftime("%Y-W%W")

        # Get users who signed up in this week
        users_result = await session.execute(
            select(User.id).where(
                User.created_at >= cohort_start,
                User.created_at < cohort_end,
            )
        )
        user_ids = [row[0] for row in users_result.all()]
        cohort_size = len(user_ids)

        if cohort_size == 0:
            cohorts.append(CohortWeek(
                cohort_week=cohort_week_label,
                cohort_size=0,
                retained=[],
            ))
            continue

        # Check retention for each subsequent week
        retained_counts = []
        remaining_weeks = weeks - w
        for rw in range(1, remaining_weeks + 1):
            ret_start = cohort_start + timedelta(weeks=rw)
            ret_end = ret_start + timedelta(weeks=1)

            if ret_start > now:
                break

            retained_result = await session.execute(
                select(func.count(func.distinct(AnalysisResult.user_id))).where(
                    AnalysisResult.user_id.in_(user_ids),
                    AnalysisResult.created_at >= ret_start,
                    AnalysisResult.created_at < ret_end,
                )
            )
            retained = retained_result.scalar() or 0
            retained_counts.append(retained)

        cohorts.append(CohortWeek(
            cohort_week=cohort_week_label,
            cohort_size=cohort_size,
            retained=retained_counts,
        ))

    return RetentionResponse(cohorts=cohorts, weeks_tracked=weeks)


@router.get("/affiliate-performance", response_model=AffiliatePerformanceResponse)
async def get_affiliate_performance(
    admin_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    """Affiliate click statistics summary."""
    now = datetime.now(timezone.utc)

    # Total clicks
    total_result = await session.execute(
        select(func.count(Event.id)).where(
            Event.event_name == "affiliate_click"
        )
    )
    total_clicks = total_result.scalar() or 0

    # Last 7 days
    seven_days_ago = now - timedelta(days=7)
    last_7_result = await session.execute(
        select(func.count(Event.id)).where(
            Event.event_name == "affiliate_click",
            Event.created_at >= seven_days_ago,
        )
    )
    last_7_days = last_7_result.scalar() or 0

    # Last 30 days
    thirty_days_ago = now - timedelta(days=30)
    last_30_result = await session.execute(
        select(func.count(Event.id)).where(
            Event.event_name == "affiliate_click",
            Event.created_at >= thirty_days_ago,
        )
    )
    last_30_days = last_30_result.scalar() or 0

    return AffiliatePerformanceResponse(
        total_clicks=total_clicks,
        last_7_days=last_7_days,
        last_30_days=last_30_days,
    )
