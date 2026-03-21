"""API — Analysis result retrieval endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel, Field

from app.schemas.analysis import AnalysisDetailResponse, AnalysisHistoryItem
from app.repositories import analysis_repo
from app.core.dependencies import get_db, get_current_user

logger = logging.getLogger("lumiqe.api.analysis")
router = APIRouter(prefix="/api/analysis", tags=["Analysis Results"])


class TrendPoint(BaseModel):
    """A single point in the color journey timeline."""
    id: str
    season: str
    hex_color: str
    undertone: str
    confidence: float
    created_at: str | None = None


class TrendsResponse(BaseModel):
    """Seasonal variation trends for the user."""
    points: list[TrendPoint] = Field(default_factory=list)
    total_analyses: int = 0
    season_changed: bool = False
    days_since_last: int | None = None
    nudge: str | None = None


@router.get("/trends", response_model=TrendsResponse)
async def get_trends(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get the user's color journey — timestamped history with change detection."""
    results = await analysis_repo.get_history(session, current_user["id"], limit=50)
    total = await analysis_repo.count_by_user(session, current_user["id"])

    points = [
        TrendPoint(
            id=r["id"],
            season=r["season"],
            hex_color=r["hex_color"],
            undertone=r["undertone"],
            confidence=r["confidence"],
            created_at=r["created_at"],
        )
        for r in results
    ]

    # Detect season changes
    seasons = [p.season for p in points]
    season_changed = len(set(seasons)) > 1 if seasons else False

    # Calculate days since last analysis for re-scan nudge
    days_since_last = None
    nudge = None
    if points and points[0].created_at:
        from datetime import datetime, timezone
        last_date = datetime.fromisoformat(points[0].created_at)
        days_since_last = (datetime.now(timezone.utc) - last_date).days
        if days_since_last >= 90:
            nudge = f"It's been {days_since_last} days since your last scan — your colors may have shifted with the season!"
        elif days_since_last >= 30:
            nudge = "Consider a fresh scan to track how your colors change over time."

    return TrendsResponse(
        points=points,
        total_analyses=total,
        season_changed=season_changed,
        days_since_last=days_since_last,
        nudge=nudge,
    )


@router.get("/{analysis_id}", response_model=AnalysisDetailResponse)
async def get_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Retrieve a single analysis result by ID. User must own the result."""
    result = await analysis_repo.get_by_id(session, analysis_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail={"error": "NOT_FOUND", "detail": "Analysis result not found.", "code": 404},
        )
    if result["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=403,
            detail={"error": "FORBIDDEN", "detail": "You do not own this analysis.", "code": 403},
        )
    return AnalysisDetailResponse(**result)


@router.get("/", response_model=list[AnalysisHistoryItem])
async def get_history(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
):
    """Retrieve the current user's analysis history, newest first."""
    results = await analysis_repo.get_history(
        session, current_user["id"], limit=limit, offset=offset
    )
    return [AnalysisHistoryItem(**r) for r in results]
