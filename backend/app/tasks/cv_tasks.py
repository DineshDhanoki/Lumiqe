"""
Lumiqe — CV Pipeline Celery Tasks.

Offloads image analysis to Celery workers for horizontal scaling.
Each worker runs in its own process with its own BiSeNet model loaded.

Task registration is LAZY — the Celery app and task are only created
when actually dispatched, not at module import time. This prevents
test hangs and import-time broker connections.
"""

import logging

logger = logging.getLogger("lumiqe.tasks.cv")

# Lazy-cached task reference
_task = None


def get_analyze_task():
    """Return the Celery task, creating it on first call."""
    global _task
    if _task is not None:
        return _task

    from app.core.celery_app import get_celery_app
    celery_app = get_celery_app()
    if celery_app is None:
        return None

    @celery_app.task(name="lumiqe.analyze_image", bind=True, max_retries=1)
    def analyze_image_task(self, image_bytes_hex: str) -> dict:
        """Run the CV analysis pipeline on image bytes."""
        image_bytes = bytes.fromhex(image_bytes_hex)
        from app.cv import pipeline as cv_pipeline
        try:
            result = cv_pipeline.analyze_bytes(image_bytes)
            logger.info(f"CV task completed: season={result.get('season', '?')}")
            return result
        except Exception as exc:
            logger.error(f"CV task failed: {exc}")
            raise self.retry(exc=exc, countdown=2)

    _task = analyze_image_task
    return _task
