"""Lumiqe — Daily Outfit Notification Service.

Queries all premium users who have wardrobe items, generates a daily
outfit for each, and creates an in-app notification.
"""

import logging

from sqlalchemy import select, func

from app.core.dependencies import async_session_factory, db_available
from app.models import User, WardrobeItem
from app.services.daily_outfit import get_daily_outfit
from app.api.notifications import create_notification

logger = logging.getLogger("lumiqe.services.daily_outfit_notifier")


async def send_daily_outfit_notifications() -> int:
    """Generate daily outfits and notify premium users with wardrobe items.

    Returns:
        Number of users notified.
    """
    if not db_available:
        logger.warning("Database unavailable — skipping daily outfit notifications")
        return 0

    notified_count = 0

    async with async_session_factory() as session:
        # Find premium users who have at least one wardrobe item
        subquery = (
            select(WardrobeItem.user_id)
            .group_by(WardrobeItem.user_id)
            .having(func.count(WardrobeItem.id) > 0)
            .subquery()
        )

        result = await session.execute(
            select(User)
            .where(User.is_premium.is_(True))
            .where(User.id.in_(select(subquery.c.user_id)))
        )
        premium_users = result.scalars().all()

        for user in premium_users:
            try:
                # Fetch wardrobe items for this user
                items_result = await session.execute(
                    select(WardrobeItem)
                    .where(WardrobeItem.user_id == user.id)
                    .order_by(WardrobeItem.created_at.desc())
                )
                items = items_result.scalars().all()

                wardrobe_dicts = [
                    {
                        "id": item.id,
                        "dominant_color": item.dominant_color,
                        "match_score": item.match_score,
                        "image_filename": item.image_filename,
                        "category": item.category,
                        "name": getattr(item, "name", item.image_filename),
                        "tags": getattr(item, "tags", ""),
                    }
                    for item in items
                ]

                outfit = get_daily_outfit(user.id, wardrobe_dicts)

                if outfit["filled_count"] > 0:
                    await create_notification(
                        user_id=user.id,
                        title="Your outfit of the day is ready!",
                        message=(
                            f"We picked {outfit['filled_count']} items from "
                            f"your wardrobe for today. Check your dashboard!"
                        ),
                        notification_type="info",
                    )
                    notified_count += 1

            except Exception as exc:
                logger.error(
                    "Failed to generate daily outfit for user %d: %s",
                    user.id,
                    exc,
                    exc_info=True,
                )

        await session.commit()

    logger.info("Daily outfit notifications sent to %d users", notified_count)
    return notified_count
