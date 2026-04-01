"""
Lumiqe — Celery Application Configuration.

Provides a shared Celery app instance for background task processing.
Falls back to synchronous execution if Celery/Redis is not available.

In test/CI mode (CELERY_ALWAYS_EAGER=true), Celery is completely disabled.
No broker connection is attempted. All CV work falls back to ThreadPoolExecutor.

Workers are started with:
    celery -A app.core.celery_app:create_celery_app worker --loglevel=info --concurrency=4
"""

import logging
import os

logger = logging.getLogger("lumiqe.celery")

_celery_app = None
_celery_available: bool | None = None  # None = not yet checked


def _is_test_mode() -> bool:
    """Check if we're in test/CI mode where Celery should be disabled."""
    # Check os.environ first (available before Settings is loaded)
    eager_env = os.environ.get("CELERY_ALWAYS_EAGER", "").lower()
    if eager_env in ("true", "1"):
        return True
    try:
        from app.core.config import settings
        return settings.CELERY_ALWAYS_EAGER
    except Exception:
        return False


def get_celery_app():
    """Lazy-initialize and return the Celery app. Returns None if unavailable."""
    global _celery_app, _celery_available

    # Test mode — never create Celery app
    if _is_test_mode():
        _celery_available = False
        return None

    # Already initialized
    if _celery_available is not None:
        return _celery_app if _celery_available else None

    from app.core.config import settings
    redis_url = settings.REDIS_URL
    if not redis_url:
        logger.info("REDIS_URL not set — Celery disabled, using ThreadPool fallback")
        _celery_available = False
        return None

    try:
        from celery import Celery

        app = Celery(
            "lumiqe",
            broker=redis_url,
            backend=redis_url,
        )
        app.conf.update(
            task_serializer="json",
            result_serializer="json",
            accept_content=["json"],
            task_track_started=True,
            task_time_limit=60,
            task_soft_time_limit=45,
            worker_max_tasks_per_child=50,
            worker_prefetch_multiplier=1,
            result_expires=300,
            broker_connection_retry_on_startup=False,
        )
        _celery_app = app
        _celery_available = True
        logger.info("Celery app created (broker connection deferred to first task)")
        return _celery_app

    except ImportError:
        logger.info("celery package not installed — using ThreadPool fallback")
        _celery_available = False
        return None
    except Exception as exc:
        logger.warning(f"Celery init failed: {exc} — using ThreadPool fallback")
        _celery_available = False
        return None


def is_celery_available() -> bool:
    """Check if Celery is available. Returns False immediately in test mode."""
    if _is_test_mode():
        return False
    if _celery_available is not None:
        return _celery_available
    # Don't trigger full init — just check prerequisites
    from app.core.config import settings
    if not settings.REDIS_URL:
        return False
    try:
        import celery  # noqa: F401
        return True
    except ImportError:
        return False


def create_celery_app():
    """Entry point for celery CLI: celery -A app.core.celery_app:create_celery_app"""
    return get_celery_app()
