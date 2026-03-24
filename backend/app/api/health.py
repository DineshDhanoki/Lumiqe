"""API — Health check and demo results endpoints."""

import json
import logging
import time
from pathlib import Path

from fastapi import APIRouter
from sqlalchemy import text

from app.schemas.analysis import DependencyStatus, HealthResponse
from app.core.config import settings
from app.core.metrics import get_uptime_seconds

logger = logging.getLogger("lumiqe.api.health")
router = APIRouter(prefix="/api", tags=["Health"])

# ─── Load demo data ──────────────────────────────────────────
_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
_DEMO_JSON = _DATA_DIR / "demo_results.json"


def _load_demo_data() -> list:
    if not _DEMO_JSON.exists():
        logger.warning(f"Demo data not found: {_DEMO_JSON}")
        return []
    with open(_DEMO_JSON, "r", encoding="utf-8") as f:
        return json.load(f)


DEMO_DATA = _load_demo_data()

# ─── CV engine state (for health check) ─────────────────────
_cv_engine_loaded = False


def mark_cv_loaded():
    """Called by the pipeline on first use."""
    global _cv_engine_loaded
    _cv_engine_loaded = True


async def _check_database() -> DependencyStatus:
    """Probe PostgreSQL with SELECT 1 and measure latency."""
    from app.core.dependencies import db_available, async_session_factory

    if not db_available:
        return DependencyStatus(status="disconnected")

    start = time.perf_counter()
    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - start) * 1000, 1)
        return DependencyStatus(status="connected", latency_ms=latency_ms)
    except Exception as exc:
        logger.warning(f"Database health check failed: {exc}")
        return DependencyStatus(status="error")


async def _check_redis() -> DependencyStatus:
    """Probe Redis with PING and measure latency."""
    try:
        from app.core.rate_limiter import _redis_client, _redis_available
    except ImportError as exc:
        logger.warning(f"Redis module import failed: {exc}", exc_info=True)
        return DependencyStatus(status="unavailable")

    if not _redis_available or _redis_client is None:
        return DependencyStatus(status="disconnected")

    start = time.perf_counter()
    try:
        await _redis_client.ping()
        latency_ms = round((time.perf_counter() - start) * 1000, 1)
        return DependencyStatus(status="connected", latency_ms=latency_ms)
    except Exception as exc:
        logger.warning(f"Redis health check failed: {exc}")
        return DependencyStatus(status="error")


def _check_cv_engine() -> DependencyStatus:
    """Report whether the BiSeNet CV model is loaded."""
    if _cv_engine_loaded:
        return DependencyStatus(status="loaded", model="BiSeNet")
    return DependencyStatus(status="not_loaded", model="BiSeNet")


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Liveness check with dependency status for DB, Redis, and CV engine."""
    db_status = await _check_database()
    redis_status = await _check_redis()
    cv_status = _check_cv_engine()

    dependencies = {
        "database": db_status,
        "redis": redis_status,
        "cv_engine": cv_status,
    }

    all_ok = all(
        dep.status in ("connected", "loaded")
        for dep in dependencies.values()
    )
    overall_status = "healthy" if all_ok else "degraded"

    return HealthResponse(
        status=overall_status,
        version=settings.API_VERSION,
        dependencies=dependencies,
        uptime_seconds=round(get_uptime_seconds(), 1),
    )


@router.get("/demo-results")
async def get_demo_results():
    """Return pre-computed demo results for the landing page interactive preview."""
    from fastapi import HTTPException
    if not DEMO_DATA:
        raise HTTPException(
            status_code=404,
            detail={"error": "NO_DEMO_DATA", "detail": "Demo results data not found", "code": 404},
        )
    return DEMO_DATA
