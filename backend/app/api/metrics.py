"""API — Prometheus-compatible metrics endpoint."""

import logging

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from app.core.metrics import format_prometheus

logger = logging.getLogger("lumiqe.api.metrics")
router = APIRouter(prefix="/api", tags=["Metrics"])


@router.get("/metrics", response_class=PlainTextResponse)
async def get_metrics():
    """Return all metrics in Prometheus text exposition format."""
    body = format_prometheus()
    return PlainTextResponse(content=body, media_type="text/plain; charset=utf-8")
