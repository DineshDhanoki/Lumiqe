"""API — Comprehensive admin dashboard with aggregated platform statistics."""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.models import User, AnalysisResult, Product, Event, WishlistItem

logger = logging.getLogger("lumiqe.api.admin_dashboard")
router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])


# ─── Response Schemas ────────────────────────────────────────


class UserStats(BaseModel):
    """User-related statistics."""
    total: int
    premium: int
    verified: int
    with_palette: int
    recent_7d: int


class CatalogStats(BaseModel):
    """Product catalog statistics."""
    total_products: int
    active_products: int


class EngagementStats(BaseModel):
    """User engagement metrics."""
    total_wishlisted: int
    total_outfits_generated: int
    affiliate_clicks: int


class FunnelStats(BaseModel):
    """Conversion funnel percentages."""
    signup_to_analysis: float
    analysis_to_wishlist: float
    wishlist_to_premium: float


class SeasonCount(BaseModel):
    """Season distribution entry."""
    season: str
    count: int


class DashboardResponse(BaseModel):
    """Comprehensive admin dashboard."""
    users: UserStats
    analyses: int
    catalog: CatalogStats
    engagement: EngagementStats
    funnel: FunnelStats
    top_seasons: list[SeasonCount]


# ─── Endpoint ────────────────────────────────────────────────


@router.get("/dashboard", response_model=DashboardResponse)
async def get_admin_dashboard(
    admin_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    """
    Returns comprehensive admin dashboard with:
    - User stats (total, premium, verified, with_palette, recent_7d)
    - Total analyses
    - Catalog stats
    - Engagement metrics (wishlist, outfits, affiliate clicks)
    - Funnel conversion percentages
    - Top 5 seasons by analysis count
    """
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    # ── User Stats ───────────────────────────────────────────
    total_users_result = await session.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0

    premium_result = await session.execute(
        select(func.count(User.id)).where(User.is_premium == True)  # noqa: E712
    )
    premium_users = premium_result.scalar() or 0

    # "Verified" = users who have a password_hash or have completed at least one analysis
    verified_result = await session.execute(
        select(func.count(User.id)).where(User.password_hash.isnot(None))
    )
    verified_users = verified_result.scalar() or 0

    with_palette_result = await session.execute(
        select(func.count(User.id)).where(User.palette.isnot(None))
    )
    with_palette = with_palette_result.scalar() or 0

    recent_result = await session.execute(
        select(func.count(User.id)).where(User.created_at >= seven_days_ago)
    )
    recent_7d = recent_result.scalar() or 0

    # ── Analyses ─────────────────────────────────────────────
    analyses_result = await session.execute(select(func.count(AnalysisResult.id)))
    total_analyses = analyses_result.scalar() or 0

    # ── Catalog ──────────────────────────────────────────────
    total_products_result = await session.execute(select(func.count(Product.id)))
    total_products = total_products_result.scalar() or 0

    active_products_result = await session.execute(
        select(func.count(Product.id)).where(Product.is_active == True)  # noqa: E712
    )
    active_products = active_products_result.scalar() or 0

    # ── Engagement ───────────────────────────────────────────
    wishlist_result = await session.execute(select(func.count(WishlistItem.id)))
    total_wishlisted = wishlist_result.scalar() or 0

    # Outfits generated = events with name 'outfit_generated'
    outfits_result = await session.execute(
        select(func.count(Event.id)).where(Event.event_name == "outfit_generated")
    )
    total_outfits = outfits_result.scalar() or 0

    affiliate_result = await session.execute(
        select(func.count(Event.id)).where(Event.event_name == "affiliate_click")
    )
    affiliate_clicks = affiliate_result.scalar() or 0

    # ── Funnel Percentages ───────────────────────────────────
    users_with_analysis_result = await session.execute(
        select(func.count(func.distinct(AnalysisResult.user_id)))
    )
    users_with_analysis = users_with_analysis_result.scalar() or 0

    users_with_wishlist_result = await session.execute(
        select(func.count(func.distinct(WishlistItem.user_id)))
    )
    users_with_wishlist = users_with_wishlist_result.scalar() or 0

    def _safe_pct(numerator: int, denominator: int) -> float:
        if denominator == 0:
            return 0.0
        return round(numerator / denominator * 100, 1)

    funnel = FunnelStats(
        signup_to_analysis=_safe_pct(users_with_analysis, total_users),
        analysis_to_wishlist=_safe_pct(users_with_wishlist, users_with_analysis),
        wishlist_to_premium=_safe_pct(premium_users, users_with_wishlist),
    )

    # ── Top 5 Seasons ───────────────────────────────────────
    seasons_result = await session.execute(
        select(AnalysisResult.season, func.count(AnalysisResult.id).label("cnt"))
        .group_by(AnalysisResult.season)
        .order_by(func.count(AnalysisResult.id).desc())
        .limit(5)
    )
    top_seasons = [
        SeasonCount(season=row[0], count=row[1])
        for row in seasons_result.all()
    ]

    logger.info(
        f"Admin dashboard served: users={total_users} analyses={total_analyses} "
        f"products={total_products}"
    )

    return DashboardResponse(
        users=UserStats(
            total=total_users,
            premium=premium_users,
            verified=verified_users,
            with_palette=with_palette,
            recent_7d=recent_7d,
        ),
        analyses=total_analyses,
        catalog=CatalogStats(
            total_products=total_products,
            active_products=active_products,
        ),
        engagement=EngagementStats(
            total_wishlisted=total_wishlisted,
            total_outfits_generated=total_outfits,
            affiliate_clicks=affiliate_clicks,
        ),
        funnel=funnel,
        top_seasons=top_seasons,
    )
