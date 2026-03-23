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


# ─── Scheduler Loop ────────────────────────────────────────


async def _scheduler_loop() -> None:
    """
    Background loop that checks every 60 seconds whether the weekly
    digest should be sent. Fires on Monday at 10:00 UTC.
    """
    last_fired_date: str | None = None

    logger.info("Scheduler loop started")

    while True:
        try:
            await asyncio.sleep(_CHECK_INTERVAL_SECONDS)

            now = datetime.now(timezone.utc)
            today_str = now.strftime("%Y-%m-%d")

            is_target_day = now.weekday() == _DIGEST_WEEKDAY
            is_target_hour = now.hour == _DIGEST_HOUR
            already_fired_today = last_fired_date == today_str

            if is_target_day and is_target_hour and not already_fired_today:
                logger.info(
                    f"Triggering weekly digest at {now.isoformat()}"
                )
                try:
                    from app.services.weekly_digest import send_all_digests
                    await send_all_digests()
                    last_fired_date = today_str
                    logger.info("Weekly digest completed successfully")
                except Exception as exc:
                    logger.error(
                        f"Weekly digest failed: {exc}", exc_info=True
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
