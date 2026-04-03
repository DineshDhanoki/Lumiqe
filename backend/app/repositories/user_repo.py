"""
Lumiqe — User Repository.

Pure database queries for user operations. No business logic, no password hashing.
"""

import logging
import secrets
import string
from typing import Optional

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User

logger = logging.getLogger("lumiqe.repo.user")


async def get_by_email(session: AsyncSession, email: str) -> Optional[dict]:
    """Retrieve a user by their email address (safe — no password_hash)."""
    result = await session.execute(
        select(User).where(User.email == email.lower())
    )
    user = result.scalar_one_or_none()
    return user.to_dict() if user else None


async def get_by_email_for_auth(session: AsyncSession, email: str) -> Optional[dict]:
    """Retrieve a user including password_hash — only for the login flow."""
    result = await session.execute(
        select(User).where(User.email == email.lower())
    )
    user = result.scalar_one_or_none()
    return user.to_auth_dict() if user else None


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
    phone: str | None = None,
) -> dict:
    """Insert a new user with a 3-day premium trial. Password must already be hashed."""
    from datetime import datetime, timezone, timedelta
    user = User(
        name=name,
        email=email.lower(),
        password_hash=password_hash,
        phone=phone,
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=3),
    )
    session.add(user)
    await session.flush()
    logger.info(f"Created user: {email} (id={user.id}) trial_ends_at={user.trial_ends_at}")
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
    """Atomically decrement free_scans_left by 1. Returns False if already at 0."""
    result = await session.execute(
        update(User)
        .where(User.id == user_id, User.free_scans_left > 0)
        .values(free_scans_left=User.free_scans_left - 1)
    )
    return result.rowcount > 0


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


async def add_credits(session: AsyncSession, user_id: int, amount: int) -> bool:
    """Add credits to a user's balance."""
    result = await session.execute(
        update(User)
        .where(User.id == user_id)
        .values(credits=User.credits + amount)
    )
    if result.rowcount > 0:
        logger.info(f"Added {amount} credits to user {user_id}")
    return result.rowcount > 0


async def deduct_credit(session: AsyncSession, user_id: int) -> bool:
    """Atomically deduct 1 credit. Returns False if no credits available."""
    result = await session.execute(
        update(User)
        .where(User.id == user_id, User.credits > 0)
        .values(credits=User.credits - 1)
    )
    if result.rowcount > 0:
        logger.info(f"Deducted 1 credit from user {user_id}")
    return result.rowcount > 0


async def update_quiz(
    session: AsyncSession,
    user_id: int,
    body_shape: str | None = None,
    style_personality: str | None = None,
    age: int | None = None,
    sex: str | None = None,
) -> bool:
    """Update the user's quiz results and profile data."""
    from datetime import datetime, timezone
    values: dict = {"quiz_completed_at": datetime.now(timezone.utc)}
    if body_shape is not None:
        values["body_shape"] = body_shape
    if style_personality is not None:
        values["style_personality"] = style_personality
    if age is not None:
        values["age"] = age
    if sex is not None:
        values["gender"] = sex
    result = await session.execute(
        update(User).where(User.id == user_id).values(**values)
    )
    return result.rowcount > 0


async def get_quiz(session: AsyncSession, user_id: int) -> Optional[dict]:
    """Retrieve the user's quiz data."""
    result = await session.execute(
        select(User.body_shape, User.style_personality, User.age, User.gender, User.quiz_completed_at)
        .where(User.id == user_id)
    )
    row = result.one_or_none()
    if not row:
        return None
    return {
        "body_shape": row.body_shape,
        "style_personality": row.style_personality,
        "age": row.age,
        "sex": row.gender,
        "quiz_completed_at": row.quiz_completed_at.isoformat() if row.quiz_completed_at else None,
    }


async def generate_referral_code(session: AsyncSession, user_id: int) -> str:
    """Generate and assign a unique 8-char referral code."""
    for _ in range(10):
        code = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        existing = await session.execute(select(User).where(User.referral_code == code))
        if not existing.scalar_one_or_none():
            await session.execute(
                update(User).where(User.id == user_id).values(referral_code=code)
            )
            return code
    raise ValueError("Failed to generate unique referral code")


async def get_by_referral_code(session: AsyncSession, code: str) -> Optional[dict]:
    """Look up user by referral code."""
    result = await session.execute(select(User).where(User.referral_code == code))
    user = result.scalar_one_or_none()
    return user.to_dict() if user else None


async def apply_referral(session: AsyncSession, new_user_id: int, referrer_id: int) -> bool:
    """Award referred user a 7-day premium trial + 1 free scan, and referrer +1 free scan."""
    from datetime import datetime, timezone, timedelta

    # Fetch the new user to check/extend trial
    result = await session.execute(select(User).where(User.id == new_user_id))
    new_user = result.scalar_one_or_none()
    if not new_user:
        return False

    # Calculate trial end: extend existing trial or start fresh 7-day trial
    now = datetime.now(timezone.utc)
    current_trial_end = new_user.trial_ends_at
    if current_trial_end and current_trial_end > now:
        new_trial_end = current_trial_end + timedelta(days=7)
    else:
        new_trial_end = now + timedelta(days=7)

    await session.execute(
        update(User).where(User.id == new_user_id).values(
            referred_by=referrer_id,
            free_scans_left=User.free_scans_left + 1,
            trial_ends_at=new_trial_end,
        )
    )
    await session.execute(
        update(User).where(User.id == referrer_id).values(
            free_scans_left=User.free_scans_left + 1,
            referral_count=User.referral_count + 1,
        )
    )
    logger.info(f"Referral applied: user {new_user_id} gets 7-day trial (until {new_trial_end.isoformat()}) + 1 scan, referrer {referrer_id} gets +1 scan")
    return True


async def update_password(session: AsyncSession, user_id: int, new_password_hash: str) -> bool:
    """Update a user's password hash."""
    result = await session.execute(
        update(User)
        .where(User.id == user_id)
        .values(password_hash=new_password_hash)
    )
    if result.rowcount > 0:
        logger.info(f"Password updated for user {user_id}")
    return result.rowcount > 0


async def verify_email(session: AsyncSession, user_id: int) -> bool:
    """Set email_verified=True for a user."""
    result = await session.execute(
        update(User)
        .where(User.id == user_id)
        .values(email_verified=True)
    )
    if result.rowcount > 0:
        logger.info(f"Email verified for user {user_id}")
    return result.rowcount > 0

