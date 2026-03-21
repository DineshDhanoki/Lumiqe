"""
Lumiqe — Complete Professional Color Profile Endpoint.

Returns the full professional analysis for a given season including:
style archetype, signature color, value/chroma, occasion guides,
capsule wardrobe, hair colors, patterns, and color harmonies.
"""

import logging

from fastapi import APIRouter, HTTPException, Query

from app.cv.loader import get_seasons_data

logger = logging.getLogger("lumiqe.api.complete_profile")
router = APIRouter(prefix="/api", tags=["Complete Profile"])


@router.get("/complete-profile")
async def get_complete_profile(
    season: str = Query(..., description="Color season name e.g. 'Deep Autumn'"),
):
    """
    Return the full professional color profile for a season.
    Includes archetype, occasions, capsule wardrobe, hair colors, patterns, harmonies.
    No authentication required — used on results page.
    """
    seasons_data = get_seasons_data()

    # Strip the Neutral Flow suffix if present
    base_season = season.replace(" (Neutral Flow)", "").strip()

    profile = seasons_data.get(base_season)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "SEASON_NOT_FOUND",
                "detail": f"Season '{base_season}' not found in knowledge base.",
                "code": 404,
            },
        )

    return {
        "season": base_season,
        "style_archetype": profile.get("style_archetype", ""),
        "signature_color": profile.get("signature_color", {}),
        "value": profile.get("value", ""),
        "chroma": profile.get("chroma", ""),
        "foundation_undertone": profile.get("foundation_undertone", ""),
        "jewelry_guide": profile.get("jewelry_guide", ""),
        "wardrobe_formula": profile.get("wardrobe_formula", ""),
        "occasions": profile.get("occasions", {}),
        "capsule_wardrobe": profile.get("capsule_wardrobe", []),
        "hair_colors": profile.get("hair_colors", {}),
        "patterns": profile.get("patterns", {}),
        "color_harmonies": profile.get("color_harmonies", {}),
        "makeup_extended": profile.get("makeup_extended", {}),
    }
