"""
Lumiqe — Background Scheduler.

Asyncio-based scheduler for recurring tasks such as the weekly digest.
The loop checks every 60 seconds and fires the digest on Monday at 10:00 UTC.
"""

import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger("lumiqe.scheduler")

# ─── State ──────────────────────────────────────────────────

_running: bool = False
_task: asyncio.Task | None = None

_CHECK_INTERVAL_SECONDS = 60
_DIGEST_WEEKDAY = 0  # Monday (datetime.weekday())
_DIGEST_HOUR = 10    # 10:00 UTC
_PRICE_CHECK_HOUR = 9  # 09:00 UTC daily
_DAILY_OUTFIT_HOUR = 7  # 07:00 UTC daily
_RESCAN_WEEKDAY = 2    # Wednesday (datetime.weekday())
_RESCAN_HOUR = 10      # 10:00 UTC
_TRIAL_REMINDER_HOUR = 8  # 08:00 UTC daily


# ─── Scheduler Loop ────────────────────────────────────────


async def _scheduler_loop() -> None:
    """
    Background loop that checks every 60 seconds whether the weekly
    digest should be sent. Fires on Monday at 10:00 UTC.
    """
    last_digest_date: str | None = None
    last_price_check_date: str | None = None
    last_daily_outfit_date: str | None = None
    last_rescan_check_date: str | None = None
    last_trial_check_date: str | None = None

    logger.info("Scheduler loop started")

    while True:
        try:
            await asyncio.sleep(_CHECK_INTERVAL_SECONDS)

            now = datetime.now(timezone.utc)
            today_str = now.strftime("%Y-%m-%d")

            # ── Weekly digest: Monday at 10:00 UTC ───────────
            is_target_day = now.weekday() == _DIGEST_WEEKDAY
            is_target_hour = now.hour == _DIGEST_HOUR
            already_fired_digest = last_digest_date == today_str

            if is_target_day and is_target_hour and not already_fired_digest:
                logger.info(
                    f"Triggering weekly digest at {now.isoformat()}"
                )
                try:
                    from app.services.weekly_digest import send_all_digests
                    await send_all_digests()
                    last_digest_date = today_str
                    logger.info("Weekly digest completed successfully")
                except Exception as exc:
                    logger.error(
                        f"Weekly digest failed: {exc}", exc_info=True
                    )

            # ── Daily price alert check: every day at 09:00 UTC ──
            is_price_check_hour = now.hour == _PRICE_CHECK_HOUR
            already_checked_prices = last_price_check_date == today_str

            if is_price_check_hour and not already_checked_prices:
                logger.info(
                    f"Triggering price alert check at {now.isoformat()}"
                )
                try:
                    from app.services.price_checker import check_price_alerts
                    triggered = await check_price_alerts()
                    last_price_check_date = today_str
                    logger.info(
                        "Price alert check completed: %d alerts triggered",
                        triggered,
                    )
                except Exception as exc:
                    logger.error(
                        f"Price alert check failed: {exc}", exc_info=True
                    )

            # ── Daily outfit notification: every day at 07:00 UTC ──
            is_outfit_hour = now.hour == _DAILY_OUTFIT_HOUR
            already_sent_outfit = last_daily_outfit_date == today_str

            if is_outfit_hour and not already_sent_outfit:
                logger.info(
                    f"Triggering daily outfit notifications at {now.isoformat()}"
                )
                try:
                    from app.services.daily_outfit_notifier import (
                        send_daily_outfit_notifications,
                    )
                    sent = await send_daily_outfit_notifications()
                    last_daily_outfit_date = today_str
                    logger.info(
                        "Daily outfit notifications completed: %d users notified",
                        sent,
                    )
                except Exception as exc:
                    logger.error(
                        f"Daily outfit notifications failed: {exc}",
                        exc_info=True,
                    )

            # ── Weekly seasonal rescan: Wednesday at 10:00 UTC ──
            is_rescan_day = now.weekday() == _RESCAN_WEEKDAY
            is_rescan_hour = now.hour == _RESCAN_HOUR
            already_checked_rescan = last_rescan_check_date == today_str

            if is_rescan_day and is_rescan_hour and not already_checked_rescan:
                logger.info(
                    f"Triggering seasonal rescan check at {now.isoformat()}"
                )
                try:
                    from app.services.seasonal_rescan import (
                        send_seasonal_rescan_reminders,
                    )
                    sent = await send_seasonal_rescan_reminders()
                    last_rescan_check_date = today_str
                    logger.info(
                        "Seasonal rescan check completed: %d emails sent",
                        sent,
                    )
                except Exception as exc:
                    logger.error(
                        f"Seasonal rescan check failed: {exc}",
                        exc_info=True,
                    )

            # ── Daily trial reminder: every day at 08:00 UTC ──
            is_trial_hour = now.hour == _TRIAL_REMINDER_HOUR
            already_checked_trials = last_trial_check_date == today_str

            if is_trial_hour and not already_checked_trials:
                logger.info(
                    f"Triggering trial reminder check at {now.isoformat()}"
                )
                try:
                    from app.services.trial_reminder import (
                        send_trial_reminders,
                    )
                    sent = await send_trial_reminders()
                    last_trial_check_date = today_str
                    logger.info(
                        "Trial reminder check completed: %d emails sent",
                        sent,
                    )
                except Exception as exc:
                    logger.error(
                        f"Trial reminder check failed: {exc}",
                        exc_info=True,
                    )

        except asyncio.CancelledError:
            logger.info("Scheduler loop cancelled")
            break
        except Exception as exc:
            logger.error(
                f"Unexpected error in scheduler loop: {exc}",
                exc_info=True,
            )
            # Continue running — don't let a single error kill the scheduler
            await asyncio.sleep(_CHECK_INTERVAL_SECONDS)


# ─── Public API ─────────────────────────────────────────────


def start_scheduler() -> None:
    """Start the background scheduler loop."""
    global _running, _task

    if _running and _task is not None and not _task.done():
        logger.warning("Scheduler is already running")
        return

    _task = asyncio.get_event_loop().create_task(_scheduler_loop())
    _running = True
    logger.info("Scheduler started")


def stop_scheduler() -> None:
    """Cancel the background scheduler task."""
    global _running, _task

    if _task is not None and not _task.done():
        _task.cancel()
        logger.info("Scheduler stop requested")

    _running = False
    _task = None
