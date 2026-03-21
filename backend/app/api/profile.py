"""API — User profile and quiz data endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.repositories import user_repo

logger = logging.getLogger("lumiqe.api.profile")
router = APIRouter(prefix="/api/profile", tags=["Profile"])


class QuizSubmission(BaseModel):
    """Quiz result submission — at least one field required."""
    body_shape: str | None = None
    style_personality: str | None = None


class QuizResponse(BaseModel):
    """Current quiz state for the user."""
    body_shape: str | None = None
    style_personality: str | None = None
    quiz_completed_at: str | None = None


@router.post("/quiz", response_model=QuizResponse)
async def save_quiz(
    body: QuizSubmission,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Save or update quiz results for the current user."""
    if body.body_shape is None and body.style_personality is None:
        raise HTTPException(
            status_code=422,
            detail={"error": "EMPTY_QUIZ", "detail": "At least one quiz field is required.", "code": 422},
        )
    await user_repo.update_quiz(
        session,
        current_user["id"],
        body_shape=body.body_shape,
        style_personality=body.style_personality,
    )
    quiz = await user_repo.get_quiz(session, current_user["id"])
    return QuizResponse(**(quiz or {}))


@router.get("/quiz", response_model=QuizResponse)
async def get_quiz(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Retrieve the current user's quiz results."""
    quiz = await user_repo.get_quiz(session, current_user["id"])
    return QuizResponse(**(quiz or {}))
