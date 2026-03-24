"""API — Daily outfit suggestion endpoint.

Returns a daily outfit suggestion based on the user's wardrobe items,
using the deterministic daily_outfit service for consistent results.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models import WardrobeItem
from app.services.daily_outfit import get_daily_outfit

logger = logging.getLogger("lumiqe.api.daily_outfit")
router = APIRouter(prefix="/api/daily-outfit", tags=["Daily Outfit"])


@router.get("")
async def daily_outfit(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get today's outfit suggestion for the authenticated user.

    Queries the user's wardrobe items and passes them to the
    daily outfit service, which uses a date-seeded RNG for
    consistent daily results.
    """
    user_id = current_user["id"]

    result = await session.execute(
        select(WardrobeItem)
        .where(WardrobeItem.user_id == user_id)
        .order_by(WardrobeItem.created_at.desc())
    )
    items = result.scalars().all()

    if not items:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "NO_WARDROBE_ITEMS",
                "detail": "Add items to your wardrobe to get daily outfit suggestions.",
                "code": 404,
            },
        )

    wardrobe_dicts = [
        {
            "id": item.id,
            "dominant_color": item.dominant_color,
            "match_score": item.match_score,
            "image_filename": item.image_filename,
            "category": item.category,
            "name": getattr(item, "name", item.image_filename),
            "tags": getattr(item, "tags", ""),
            "created_at": (
                item.created_at.isoformat() if item.created_at else None
            ),
        }
        for item in items
    ]

    outfit = get_daily_outfit(user_id, wardrobe_dicts)

    logger.info(
        "Daily outfit served for user %d: %d/%d slots filled",
        user_id,
        outfit["filled_count"],
        outfit["total_slots"],
    )

    return outfit
