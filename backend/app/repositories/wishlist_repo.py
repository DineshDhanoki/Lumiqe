"""
Lumiqe — Wishlist Repository.

Database queries for user wishlist operations. Returns plain dicts
for API serialization, following the same pattern as user_repo.
"""

import logging

from sqlalchemy import select, delete, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import WishlistItem

logger = logging.getLogger("lumiqe.repo.wishlist")


async def get_by_user(session: AsyncSession, user_id: int) -> list[dict]:
    """Get all wishlist items for a user, ordered by most recent first."""
    result = await session.execute(
        select(WishlistItem)
        .where(WishlistItem.user_id == user_id)
        .order_by(WishlistItem.created_at.desc())
    )
    items = result.scalars().all()
    return [item.to_dict() for item in items]


# Alias used by the existing wishlist API router
get_user_wishlist = get_by_user


async def add(
    session: AsyncSession,
    user_id: int,
    **kwargs,
) -> dict:
    """
    Add an item to the user's wishlist.

    Accepts product fields as keyword arguments:
        product_id, product_name, product_brand, product_price,
        product_image, product_url, match_score.

    Returns the created item as a dict.
    """
    item = WishlistItem(
        user_id=user_id,
        product_id=kwargs.get("product_id", ""),
        product_name=kwargs.get("product_name", ""),
        product_brand=kwargs.get("product_brand", ""),
        product_price=kwargs.get("product_price", ""),
        product_image=kwargs.get("product_image", ""),
        product_url=kwargs.get("product_url", ""),
        match_score=kwargs.get("match_score", 0),
    )
    session.add(item)
    await session.flush()
    logger.info(f"User {user_id} wishlisted product {item.product_id}")
    return item.to_dict()


async def add_item(
    session: AsyncSession,
    user_id: int,
    **kwargs,
) -> dict:
    """Alias for add() — matches the existing API contract."""
    return await add(session, user_id, **kwargs)


async def remove(
    session: AsyncSession,
    user_id: int,
    product_id: str,
) -> bool:
    """Remove a product from the user's wishlist. Returns True if deleted."""
    result = await session.execute(
        delete(WishlistItem).where(
            and_(
                WishlistItem.user_id == user_id,
                WishlistItem.product_id == product_id,
            )
        )
    )
    if result.rowcount > 0:
        logger.info(f"User {user_id} removed product {product_id} from wishlist")
    return result.rowcount > 0


# Alias used by the existing wishlist API router
remove_item = remove


async def is_wishlisted(
    session: AsyncSession,
    user_id: int,
    product_id: str,
) -> bool:
    """Check if a product is in the user's wishlist."""
    result = await session.execute(
        select(func.count(WishlistItem.id)).where(
            and_(
                WishlistItem.user_id == user_id,
                WishlistItem.product_id == product_id,
            )
        )
    )
    count_val = result.scalar() or 0
    return count_val > 0


async def count(session: AsyncSession, user_id: int) -> int:
    """Count the total wishlist items for a user."""
    result = await session.execute(
        select(func.count(WishlistItem.id)).where(
            WishlistItem.user_id == user_id
        )
    )
    return result.scalar() or 0
