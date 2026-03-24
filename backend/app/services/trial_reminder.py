"""
Lumiqe — Trial Expiry Reminder.

Sends reminder emails to users whose 3-day trial ends within 24 hours.
Called daily by the scheduler at 08:00 UTC.
"""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.config import settings
from app.core.dependencies import async_session_factory
from app.models import User
from app.services.email import send_trial_reminder_email

logger = logging.getLogger("lumiqe.trial_reminder")


async def send_trial_reminders() -> int:
    """Find users whose trial ends within 24 hours and send reminder.

    Returns the number of reminder emails sent.
    """
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(hours=24)

    sent_count = 0

    async with async_session_factory() as session:
        stmt = (
            select(User)
            .where(
                User.trial_ends_at >= now,
                User.trial_ends_at <= window_end,
                User.is_premium == False,  # noqa: E712
            )
        )
        result = await session.execute(stmt)
        users = result.scalars().all()

        logger.info("Found %d users with trials ending within 24h", len(users))

        for user in users:
            upgrade_url = f"{settings.FRONTEND_URL}/pricing"
            success = send_trial_reminder_email(
                to=user.email,
                name=user.name,
                season=user.season or "your color season",
                upgrade_url=upgrade_url,
            )
            if success:
                sent_count += 1

    logger.info("Trial reminder emails sent: %d", sent_count)
    return sent_count
