"""API -- Celebrity season match endpoint."""

import logging

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services.celebrity_match import get_celebrity_matches

logger = logging.getLogger("lumiqe.api.celebrity")
router = APIRouter(prefix="/api/celebrity", tags=["Celebrity Match"])


class CelebrityOut(BaseModel):
    """Single celebrity match."""

    name: str
    image_hint: str
    note: str


class CelebrityMatchResponse(BaseModel):
    """Response for the celebrity match endpoint."""

    season: str
    celebrities: list[CelebrityOut]


@router.get("/match", response_model=CelebrityMatchResponse)
async def match_celebrities(
    season: str = Query(..., description="Color season name, e.g. 'Deep Winter'"),
) -> CelebrityMatchResponse:
    """Return celebrity color-twins for the given season."""
    matches = get_celebrity_matches(season)
    if not matches:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "NO_MATCHES",
                "detail": f"No celebrity matches found for season '{season}'.",
                "code": 404,
            },
        )
    return CelebrityMatchResponse(
        season=season,
        celebrities=[CelebrityOut(**m) for m in matches],
    )
