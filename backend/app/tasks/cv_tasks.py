"""
Lumiqe — CV Pipeline Celery Tasks.

Offloads image analysis to Celery workers for horizontal scaling.
Each worker runs in its own process with its own BiSeNet model loaded.
"""

import logging

from app.core.celery_app import get_celery_app

logger = logging.getLogger("lumiqe.tasks.cv")

celery_app = get_celery_app()

if celery_app is not None:
    @celery_app.task(name="lumiqe.analyze_image", bind=True, max_retries=1)
    def analyze_image_task(self, image_bytes_hex: str) -> dict:
        """Run the CV analysis pipeline on image bytes.

        Args:
            image_bytes_hex: Hex-encoded image bytes (JSON-safe transport).

        Returns:
            Analysis result dictionary.
        """
        image_bytes = bytes.fromhex(image_bytes_hex)

        from app.cv import pipeline as cv_pipeline
        try:
            result = cv_pipeline.analyze_bytes(image_bytes)
            logger.info(f"CV task completed: season={result.get('season', '?')}")
            return result
        except Exception as exc:
            logger.error(f"CV task failed: {exc}")
            raise self.retry(exc=exc, countdown=2)
