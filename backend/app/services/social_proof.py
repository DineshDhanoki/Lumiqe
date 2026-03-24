"""Social proof data for product recommendations."""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import WishlistItem, User

logger = logging.getLogger("lumiqe.services.social_proof")

_TRENDING_THRESHOLD = 3
_TRENDING_WINDOW_DAYS = 7


async def get_product_social_proof(
    session: AsyncSession,
    product_ids: list[str],
    user_season: str | None = None,
) -> dict[str, dict]:
    """Get social proof stats for a list of product IDs.

    Returns dict mapping product_id -> {
        "wishlisted_count": int,
        "season_match_percent": int,  # "87% of Deep Autumn users saved this"
        "trending": bool,  # wishlisted 3+ times in last 7 days
    }
    """
    if not product_ids:
        return {}

    result: dict[str, dict] = {
        pid: {"wishlisted_count": 0, "season_match_percent": 0, "trending": False}
        for pid in product_ids
    }

    # 1. Total wishlist counts per product
    count_query = (
        select(
            WishlistItem.product_id,
            func.count(WishlistItem.id).label("total"),
        )
        .where(WishlistItem.product_id.in_(product_ids))
        .group_by(WishlistItem.product_id)
    )
    count_rows = await session.execute(count_query)
    for row in count_rows:
        result[row.product_id]["wishlisted_count"] = row.total

    # 2. Trending: wishlisted >= 3 times in last 7 days
    cutoff = datetime.now(timezone.utc) - timedelta(days=_TRENDING_WINDOW_DAYS)
    trending_query = (
        select(
            WishlistItem.product_id,
            func.count(WishlistItem.id).label("recent_count"),
        )
        .where(
            WishlistItem.product_id.in_(product_ids),
            WishlistItem.created_at >= cutoff,
        )
        .group_by(WishlistItem.product_id)
    )
    trending_rows = await session.execute(trending_query)
    for row in trending_rows:
        if row.recent_count >= _TRENDING_THRESHOLD:
            result[row.product_id]["trending"] = True

    # 3. Season match percent (what % of users with this season wishlisted it)
    if user_season:
        season_total_query = (
            select(
                WishlistItem.product_id,
                func.count(func.distinct(WishlistItem.user_id)).label("season_users"),
            )
            .join(User, User.id == WishlistItem.user_id)
            .where(
                WishlistItem.product_id.in_(product_ids),
                User.season == user_season,
            )
            .group_by(WishlistItem.product_id)
        )
        season_rows = await session.execute(season_total_query)

        all_total_query = (
            select(
                WishlistItem.product_id,
                func.count(func.distinct(WishlistItem.user_id)).label("all_users"),
            )
            .where(WishlistItem.product_id.in_(product_ids))
            .group_by(WishlistItem.product_id)
        )
        all_rows = await session.execute(all_total_query)
        all_counts = {row.product_id: row.all_users for row in all_rows}

        for row in season_rows:
            total = all_counts.get(row.product_id, 0)
            if total > 0:
                percent = round((row.season_users / total) * 100)
                result[row.product_id]["season_match_percent"] = percent

    logger.info(
        "Social proof fetched for %d products (season=%s)",
        len(product_ids),
        user_season,
    )

    return result
