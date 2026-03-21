"""
Lumiqe — Analysis Result Repository.

Pure database queries for persisted analysis results.
"""

import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AnalysisResult

logger = logging.getLogger("lumiqe.repo.analysis")


async def save_result(
    session: AsyncSession,
    user_id: int,
    season: str,
    hex_color: str,
    undertone: str,
    confidence: float,
    contrast_level: str,
    palette: list[str],
    avoid_colors: list[str],
    metal: str,
    full_result: dict,
) -> dict:
    """Persist a new analysis result and return its dict representation."""
    result = AnalysisResult(
        user_id=user_id,
        season=season,
        hex_color=hex_color,
        undertone=undertone,
        confidence=confidence,
        contrast_level=contrast_level,
        palette=palette,
        avoid_colors=avoid_colors,
        metal=metal,
        full_result=full_result,
    )
    session.add(result)
    await session.flush()
    logger.info(f"Saved analysis {result.id} for user {user_id}: {season}")
    return result.to_dict()


async def get_by_id(session: AsyncSession, analysis_id: str) -> Optional[dict]:
    """Retrieve a single analysis result by its UUID."""
    result = await session.execute(
        select(AnalysisResult).where(AnalysisResult.id == analysis_id)
    )
    row = result.scalar_one_or_none()
    return row.to_dict() if row else None


async def get_history(
    session: AsyncSession,
    user_id: int,
    limit: int = 20,
    offset: int = 0,
) -> list[dict]:
    """Retrieve a user's analysis history, newest first."""
    result = await session.execute(
        select(AnalysisResult)
        .where(AnalysisResult.user_id == user_id)
        .order_by(AnalysisResult.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return [row.to_dict() for row in result.scalars().all()]


async def get_by_share_token(session: AsyncSession, token: str) -> Optional[dict]:
    """Retrieve an analysis result by its public share token."""
    result = await session.execute(
        select(AnalysisResult).where(AnalysisResult.share_token == token)
    )
    row = result.scalar_one_or_none()
    return row.to_dict() if row else None


async def count_by_user(session: AsyncSession, user_id: int) -> int:
    """Count total analyses for a user."""
    from sqlalchemy import func
    result = await session.execute(
        select(func.count()).select_from(AnalysisResult).where(
            AnalysisResult.user_id == user_id
        )
    )
    return result.scalar_one()
