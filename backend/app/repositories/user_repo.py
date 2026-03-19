"""
Lumiqe — User Repository.

Pure database queries for user operations. No business logic, no password hashing.
"""

import logging
from typing import Optional

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User

logger = logging.getLogger("lumiqe.repo.user")


async def get_by_email(session: AsyncSession, email: str) -> Optional[dict]:
    """Retrieve a user by their email address."""
    result = await session.execute(
        select(User).where(User.email == email.lower())
    )
    user = result.scalar_one_or_none()
    return user.to_dict() if user else None


async def get_by_id(session: AsyncSession, user_id: int) -> Optional[dict]:
    """Retrieve a user by their ID."""
    result = await session.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    return user.to_dict() if user else None


async def create(
    session: AsyncSession,
    name: str,
    email: str,
    password_hash: str | None = None,
) -> dict:
    """Insert a new user. Password must already be hashed."""
    user = User(
        name=name,
        email=email.lower(),
        password_hash=password_hash,
    )
    session.add(user)
    await session.flush()
    logger.info(f"Created user: {email} (id={user.id})")
    return user.to_dict()


async def update_palette(
    session: AsyncSession,
    email: str,
    season: str,
    palette: list[str],
) -> bool:
    """Persist the user's color season and palette hex array."""
    result = await session.execute(
        update(User)
        .where(User.email == email.lower())
        .values(season=season, palette=palette)
    )
    if result.rowcount > 0:
        logger.info(f"Saved palette for {email}: {season}")
    return result.rowcount > 0


async def get_palette(session: AsyncSession, email: str) -> Optional[dict]:
    """Retrieve the user's stored season and palette."""
    result = await session.execute(
        select(User.season, User.palette).where(User.email == email.lower())
    )
    row = result.one_or_none()
    if row and row.season and row.palette:
        return {"season": row.season, "palette": row.palette}
    return None


async def decrement_scan(session: AsyncSession, user_id: int) -> bool:
    """Decrement the user's free_scans_left by 1."""
    result = await session.execute(
        select(User.free_scans_left).where(User.id == user_id)
    )
    scans_left = result.scalar_one_or_none()
    if scans_left is None or scans_left <= 0:
        return False

    await session.execute(
        update(User)
        .where(User.id == user_id)
        .values(free_scans_left=User.free_scans_left - 1)
    )
    return True


async def delete_by_email(session: AsyncSession, email: str) -> bool:
    """GDPR — permanently delete all user data."""
    result = await session.execute(
        delete(User).where(User.email == email.lower())
    )
    if result.rowcount > 0:
        logger.info(f"Deleted all data for user: {email}")
    return result.rowcount > 0


async def upgrade_to_premium(
    session: AsyncSession,
    user_id: int,
    stripe_customer_id: str,
    stripe_subscription_id: str,
) -> None:
    """Upgrade user to premium after successful Stripe payment."""
    await session.execute(
        update(User)
        .where(User.id == user_id)
        .values(
            is_premium=True,
            stripe_customer_id=stripe_customer_id,
            stripe_subscription_id=stripe_subscription_id,
        )
    )
    logger.info(f"User {user_id} upgraded to premium")


async def downgrade_from_premium(session: AsyncSession, stripe_customer_id: str) -> None:
    """Downgrade user when subscription is cancelled/expired."""
    await session.execute(
        update(User)
        .where(User.stripe_customer_id == stripe_customer_id)
        .values(is_premium=False, stripe_subscription_id=None)
    )
    logger.info(f"Customer {stripe_customer_id} downgraded from premium")


async def get_by_stripe_customer_id(session: AsyncSession, stripe_customer_id: str) -> dict | None:
    """Look up user by Stripe customer ID."""
    result = await session.execute(
        select(User).where(User.stripe_customer_id == stripe_customer_id)
    )
    user = result.scalar_one_or_none()
    return user.to_dict() if user else None


async def set_stripe_customer_id(session: AsyncSession, user_id: int, stripe_customer_id: str) -> None:
    """Save Stripe customer ID to user record."""
    await session.execute(
        update(User)
        .where(User.id == user_id)
        .values(stripe_customer_id=stripe_customer_id)
    )

