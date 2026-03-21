"""API — Public share endpoints (no auth required)."""

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.repositories import analysis_repo
from app.services.og_image import generate_og_image

logger = logging.getLogger("lumiqe.api.share")
router = APIRouter(prefix="/api/share", tags=["Sharing"])


class ShareResponse(BaseModel):
    """Share token for an analysis result."""
    share_token: str
    share_url: str


class PublicAnalysis(BaseModel):
    """Public-safe analysis data (no user_id or full_result)."""
    season: str
    hex_color: str
    undertone: str
    confidence: float
    contrast_level: str = ""
    palette: list[str] = Field(default_factory=list)
    metal: str = ""
    created_at: str | None = None


@router.get("/{analysis_id}/token", response_model=ShareResponse)
async def get_share_token(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get the share token for an analysis result. Must own the result."""
    result = await analysis_repo.get_by_id(session, analysis_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail={"error": "NOT_FOUND", "detail": "Analysis not found.", "code": 404},
        )
    if result["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=403,
            detail={"error": "FORBIDDEN", "detail": "You do not own this analysis.", "code": 403},
        )

    from app.core.config import settings
    share_url = f"{settings.FRONTEND_URL}/share/{result['share_token']}"
    return ShareResponse(share_token=result["share_token"], share_url=share_url)


@router.get("/{token}", response_model=PublicAnalysis)
async def get_public_analysis(
    token: str,
    session: AsyncSession = Depends(get_db),
):
    """Public endpoint — retrieve analysis by share token (no auth)."""
    result = await analysis_repo.get_by_share_token(session, token)
    if not result:
        raise HTTPException(
            status_code=404,
            detail={"error": "NOT_FOUND", "detail": "Shared analysis not found.", "code": 404},
        )
    return PublicAnalysis(
        season=result["season"],
        hex_color=result["hex_color"],
        undertone=result["undertone"],
        confidence=result["confidence"],
        contrast_level=result.get("contrast_level", ""),
        palette=result.get("palette", []),
        metal=result.get("metal", ""),
        created_at=result.get("created_at"),
    )


@router.get("/{token}/og-image")
async def get_og_image(
    token: str,
    session: AsyncSession = Depends(get_db),
):
    """Generate an OG image (1200x630 PNG) for a shared analysis."""
    result = await analysis_repo.get_by_share_token(session, token)
    if not result:
        raise HTTPException(
            status_code=404,
            detail={"error": "NOT_FOUND", "detail": "Shared analysis not found.", "code": 404},
        )

    png_bytes = await asyncio.to_thread(
        generate_og_image,
        season=result["season"],
        hex_color=result["hex_color"],
        palette=result.get("palette", []),
        undertone=result.get("undertone", ""),
    )
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"},
    )
