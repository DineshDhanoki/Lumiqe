"""API — Event tracking for analytics and conversion funnels."""

import logging
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_optional_user, require_admin
from app.models import Event

logger = logging.getLogger("lumiqe.api.events")
router = APIRouter(prefix="/api/events", tags=["Analytics"])

# Canonical set of valid event names — prevents arbitrary event pollution
_ALLOWED_EVENTS = Literal[
    "analysis_started",
    "analysis_completed",
    "product_clicked",
    "checkout_started",
    "checkout_completed",
    "share_created",
    "wardrobe_item_added",
    "wishlist_item_added",
    "price_alert_set",
    "quiz_completed",
    "onboarding_completed",
    "page_viewed",
    "scan_started",
    "scan_completed",
]


class TrackRequest(BaseModel):
    """Fire-and-forget event tracking payload."""
    event_name: _ALLOWED_EVENTS
    properties: dict | None = None


class FunnelStep(BaseModel):
    """A single step in the conversion funnel."""
    event_name: str
    count: int


@router.post("/track", status_code=202)
async def track_event(
    body: TrackRequest,
    current_user: dict | None = Depends(get_optional_user),
    session: AsyncSession = Depends(get_db),
):
    """Record an analytics event. Auth optional (anonymous events ok)."""
    event = Event(
        user_id=current_user["id"] if current_user else None,
        event_name=body.event_name,
        properties=body.properties,
    )
    session.add(event)
    await session.flush()
    return {"status": "accepted"}


@router.get("/funnel", response_model=list[FunnelStep])
async def get_funnel(
    current_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
    days: int = Query(default=30, ge=1, le=365),
):
    """Admin-only conversion funnel metrics for the last N days."""
    cutoff = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0
    )
    from datetime import timedelta
    cutoff = cutoff - timedelta(days=days)

    funnel_events = [
        "analysis_started",
        "analysis_completed",
        "product_clicked",
        "checkout_started",
        "checkout_completed",
        "share_created",
    ]

    result = await session.execute(
        select(Event.event_name, func.count(Event.id))
        .where(Event.event_name.in_(funnel_events), Event.created_at >= cutoff)
        .group_by(Event.event_name)
    )

    counts = {name: count for name, count in result.all()}
    return [
        FunnelStep(event_name=e, count=counts.get(e, 0))
        for e in funnel_events
    ]
