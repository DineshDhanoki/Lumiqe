"""
Lumiqe — Celery Application Configuration.

Provides a shared Celery app instance for background task processing.
Falls back to synchronous execution if Celery/Redis is not available.

IMPORTANT: Celery app is created LAZILY on first task dispatch,
not at import time. This prevents broker connection hangs during tests.

Workers are started with:
    celery -A app.core.celery_app:create_celery_app worker --loglevel=info --concurrency=4
"""

import logging

logger = logging.getLogger("lumiqe.celery")

_celery_app = None
_celery_available: bool | None = None  # None = not yet checked


def get_celery_app():
    """Lazy-initialize and return the Celery app. Returns None if unavailable."""
    global _celery_app, _celery_available

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
            broker_connection_retry_on_startup=False,  # Don't block on startup
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
    """Check if Celery is configured (does NOT trigger broker connection)."""
    if _celery_available is not None:
        return _celery_available

    # Check prerequisites without creating the Celery app
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
