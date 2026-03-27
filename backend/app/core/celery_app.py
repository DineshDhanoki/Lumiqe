"""
Lumiqe — Celery Application Configuration.

Provides a shared Celery app instance for background task processing.
Falls back to synchronous execution if Celery/Redis is not available.

Workers are started with:
    celery -A app.core.celery_app worker --loglevel=info --concurrency=4
"""

import logging

from app.core.config import settings

logger = logging.getLogger("lumiqe.celery")

_celery_app = None
_celery_available = False


def get_celery_app():
    """Lazy-initialize and return the Celery app. Returns None if unavailable."""
    global _celery_app, _celery_available

    if _celery_app is not None:
        return _celery_app if _celery_available else None

    redis_url = settings.REDIS_URL
    if not redis_url:
        logger.info("REDIS_URL not set — Celery disabled, using ThreadPool fallback")
        _celery_available = False
        return None

    try:
        from celery import Celery

        _celery_app = Celery(
            "lumiqe",
            broker=redis_url,
            backend=redis_url,
        )
        _celery_app.conf.update(
            task_serializer="json",
            result_serializer="json",
            accept_content=["json"],
            task_track_started=True,
            task_time_limit=60,  # Hard kill after 60s
            task_soft_time_limit=45,  # Graceful timeout at 45s
            worker_max_tasks_per_child=50,  # Restart worker after 50 tasks (prevent memory leaks)
            worker_prefetch_multiplier=1,  # Don't prefetch (CV is CPU-heavy)
            result_expires=300,  # Results expire after 5 minutes
        )
        _celery_available = True
        logger.info("Celery initialized with Redis broker")
        return _celery_app

    except ImportError:
        logger.info("celery package not installed — using ThreadPool fallback")
        _celery_available = False
        _celery_app = object()  # Sentinel to prevent re-init
        return None
    except Exception as exc:
        logger.warning(f"Celery initialization failed: {exc} — using ThreadPool fallback")
        _celery_available = False
        _celery_app = object()
        return None


def is_celery_available() -> bool:
    """Check if Celery is available for task dispatch."""
    get_celery_app()  # Ensure lazy init has run
    return _celery_available
