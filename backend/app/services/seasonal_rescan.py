"""Seasonal re-scan reminder — emails users when their skin tone may have shifted."""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func as sa_func

from app.core.config import settings
from app.core.dependencies import async_session_factory
from app.models import AnalysisResult, Event, User
from app.services.email import send_seasonal_rescan_email
from app.services.seasonal_guide import MONTH_TO_SEASON

logger = logging.getLogger("lumiqe.seasonal_rescan")

RESCAN_THRESHOLD_DAYS = 60


def _get_current_climate_season() -> str:
    """Return the current Indian climate season based on today's month."""
    month = datetime.now(timezone.utc).month
    return MONTH_TO_SEASON.get(month, "Spring")


def _month_name_from_datetime(dt: datetime) -> str:
    """Return the full month name for a datetime."""
    return dt.strftime("%B")


async def send_seasonal_rescan_reminders() -> int:
    """Find eligible users and send seasonal re-scan reminder emails.

    Eligible users:
    - Have a season assigned (User.season is not None).
    - Last analysis was 60+ days ago.
    - Have not received a seasonal_rescan_sent event in the last 60 days.

    Returns:
        Number of reminder emails sent.
    """
    now = datetime.now(timezone.utc)
    threshold = now - timedelta(days=RESCAN_THRESHOLD_DAYS)
    sent_count = 0

    async with async_session_factory() as session:
        # Subquery: latest analysis per user
        latest_analysis_sq = (
            select(
                AnalysisResult.user_id,
                sa_func.max(AnalysisResult.created_at).label("last_analysis_at"),
            )
            .group_by(AnalysisResult.user_id)
            .subquery()
        )

        # Subquery: latest rescan email event per user
        latest_rescan_event_sq = (
            select(
                Event.user_id,
                sa_func.max(Event.created_at).label("last_rescan_email_at"),
            )
            .where(Event.event_name == "seasonal_rescan_sent")
            .group_by(Event.user_id)
            .subquery()
        )

        # Main query: users with a season, whose last analysis is old enough,
        # and who haven't been emailed recently.
        query = (
            select(
                User,
                latest_analysis_sq.c.last_analysis_at,
            )
            .join(
                latest_analysis_sq,
                User.id == latest_analysis_sq.c.user_id,
            )
            .outerjoin(
                latest_rescan_event_sq,
                User.id == latest_rescan_event_sq.c.user_id,
            )
            .where(
                User.season.isnot(None),
                latest_analysis_sq.c.last_analysis_at < threshold,
                (
                    latest_rescan_event_sq.c.last_rescan_email_at.is_(None)
                    | (latest_rescan_event_sq.c.last_rescan_email_at < threshold)
                ),
            )
        )

        result = await session.execute(query)
        rows = result.all()

        logger.info(
            "Seasonal rescan: found %d eligible users",
            len(rows),
        )

        current_climate = _get_current_climate_season()

        for user, last_analysis_at in rows:
            scan_month = _month_name_from_datetime(last_analysis_at)
            palette = user.palette or []
            rescan_url = f"{settings.FRONTEND_URL}/analyze"

            success = send_seasonal_rescan_email(
                to=user.email,
                name=user.name,
                old_season=user.season,
                current_climate=current_climate,
                rescan_url=rescan_url,
                palette=palette,
                scan_month=scan_month,
            )

            if success:
                event = Event(
                    user_id=user.id,
                    event_name="seasonal_rescan_sent",
                    properties={
                        "old_season": user.season,
                        "current_climate": current_climate,
                        "scan_month": scan_month,
                    },
                )
                session.add(event)
                sent_count += 1
                logger.info(
                    "Rescan reminder sent to user %d (%s)",
                    user.id,
                    user.email,
                )
            else:
                logger.warning(
                    "Rescan reminder failed for user %d (%s)",
                    user.id,
                    user.email,
                )

        await session.commit()

    logger.info("Seasonal rescan complete: %d emails sent", sent_count)
    return sent_count
