"""API — Affiliate click tracking and redirect endpoint."""

import logging
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_optional_user, require_admin
from app.models import Event
from app.services.affiliate import affiliatize_url

logger = logging.getLogger("lumiqe.api.affiliate_tracking")
router = APIRouter(prefix="/api/affiliate", tags=["Affiliate Tracking"])


# ─── Response Schemas ────────────────────────────────────────


class DomainClickStat(BaseModel):
    """Click count per domain."""
    domain: str
    clicks: int


class AffiliateStatsResponse(BaseModel):
    """Admin affiliate tracking statistics."""
    total_clicks: int
    clicks_by_domain: list[DomainClickStat]
    last_7_days: int


# ─── Endpoints ───────────────────────────────────────────────


@router.get("/click")
async def track_affiliate_click(
    url: str = Query(..., description="Target product URL to redirect to"),
    product_id: str | None = Query(default=None, description="Optional product ID for analytics"),
    current_user: dict | None = Depends(get_optional_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Log an affiliate click event and 302 redirect to the affiliatized URL.
    Auth is optional (anonymous clicks are tracked too).
    """
    if not url:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "MISSING_URL",
                "detail": "The 'url' query parameter is required.",
                "code": 400,
            },
        )

    # Extract domain for analytics
    try:
        domain = urlparse(url).netloc.lower().removeprefix("www.")
    except Exception as exc:
        logger.warning(f"URL parsing failed for affiliate click: {exc}", exc_info=True)
        domain = "unknown"

    # Log the click event
    event = Event(
        user_id=current_user["id"] if current_user else None,
        event_name="affiliate_click",
        properties={
            "url": url,
            "domain": domain,
            "product_id": product_id,
        },
    )
    session.add(event)
    await session.flush()

    logger.info(
        f"Affiliate click: domain={domain} product_id={product_id} "
        f"user_id={current_user['id'] if current_user else 'anonymous'}"
    )

    # Affiliatize and redirect
    target_url = affiliatize_url(url)
    return RedirectResponse(url=target_url, status_code=302)


@router.get("/stats", response_model=AffiliateStatsResponse)
async def get_affiliate_stats(
    admin_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    """Admin-only: total clicks, clicks by domain, last 7 days stats."""
    # Total clicks
    total_result = await session.execute(
        select(func.count(Event.id)).where(
            Event.event_name == "affiliate_click"
        )
    )
    total_clicks = total_result.scalar() or 0

    # Last 7 days
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_result = await session.execute(
        select(func.count(Event.id)).where(
            Event.event_name == "affiliate_click",
            Event.created_at >= seven_days_ago,
        )
    )
    last_7_days = recent_result.scalar() or 0

    # Clicks by domain — extract from JSON properties
    all_clicks_result = await session.execute(
        select(Event.properties).where(
            Event.event_name == "affiliate_click"
        )
    )
    all_clicks = all_clicks_result.scalars().all()

    domain_counts: dict[str, int] = {}
    for props in all_clicks:
        if props and isinstance(props, dict):
            domain = props.get("domain", "unknown")
            domain_counts[domain] = domain_counts.get(domain, 0) + 1

    clicks_by_domain = sorted(
        [DomainClickStat(domain=d, clicks=c) for d, c in domain_counts.items()],
        key=lambda x: x.clicks,
        reverse=True,
    )

    return AffiliateStatsResponse(
        total_clicks=total_clicks,
        clicks_by_domain=clicks_by_domain,
        last_7_days=last_7_days,
    )
