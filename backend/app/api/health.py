"""API — Health check and demo results endpoints."""

import json
import logging
from pathlib import Path

from fastapi import APIRouter

from app.schemas.analysis import HealthResponse
from app.core.config import settings

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


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Liveness check — confirms server is running and model status."""
    return HealthResponse(
        status="healthy",
        model_loaded=_cv_engine_loaded,
        version=settings.API_VERSION,
        database="postgresql+pgvector",
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
