"""
Lumiqe — Makeup Shade Matching API.

Provides two endpoints:
    GET /api/makeup/shades          — Match a skin hex color to makeup shades
    GET /api/makeup/recommendations — Season-based makeup recommendations

Uses CIE Delta-E 2000 perceptual color distance for shade matching,
imported from the existing color_matcher service.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services.color_matcher import delta_e_cie2000, hex_to_lab
from app.services.makeup_database import ALL_SHADES, SEASON_RECOMMENDATIONS

logger = logging.getLogger("lumiqe.api.makeup")
router = APIRouter(prefix="/api/makeup", tags=["Makeup Matching"])

VALID_CATEGORIES = {"foundation", "concealer", "lipstick", "blush"}
VALID_SEASONS = {"spring", "summer", "autumn", "winter"}
VALID_UNDERTONES = {"warm", "cool", "neutral"}


# ─── Response Models ──────────────────────────────────────────


class ShadeMatch(BaseModel):
    """A single shade match result."""

    shade_name: str
    brand: str
    hex_color: str
    delta_e_score: float
    purchase_url: str


class ShadeMatchResponse(BaseModel):
    """Response for the shade matching endpoint."""

    query_hex: str
    category: str
    undertone_filter: Optional[str] = None
    matches: list[ShadeMatch]


class MakeupRecommendationResponse(BaseModel):
    """Response for the recommendations endpoint."""

    season: str
    undertone: str
    undertone_guidance: str
    foundation_tip: str
    lipstick_families: list[str]
    lipstick_picks: list[str]
    blush_families: list[str]
    blush_picks: list[str]
    eyeshadow_palettes: list[str]


# ─── Helpers ──────────────────────────────────────────────────


def _validate_hex_color(hex_color: str) -> str:
    """Validate and normalise a hex color string. Returns uppercased hex."""
    cleaned = hex_color.strip().lstrip("#")
    if len(cleaned) != 6:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid hex color: '{hex_color}'. Expected 6-character hex (e.g. #F5DEB3).",
        )
    try:
        int(cleaned, 16)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid hex color: '{hex_color}'. Contains non-hex characters.",
        ) from exc
    return f"#{cleaned.upper()}"


def _build_purchase_url(brand: str, shade_name: str) -> str:
    """Build a placeholder purchase URL for a shade."""
    slug = f"{brand} {shade_name}".lower().replace(" ", "-").replace("'", "")
    return f"https://www.lumiqe.com/shop/{slug}"


# ─── Endpoints ────────────────────────────────────────────────


@router.get("/shades", response_model=ShadeMatchResponse)
async def get_shade_matches(
    hex_color: str = Query(
        ...,
        description="User's skin hex color, e.g. '#D4A97A'",
    ),
    undertone: Optional[str] = Query(
        None,
        description="Filter by undertone: warm, cool, or neutral",
    ),
    category: str = Query(
        "foundation",
        description="Makeup category: foundation, concealer, lipstick, or blush",
    ),
) -> ShadeMatchResponse:
    """
    Match a skin hex color against the shade database.

    Returns the top 5 closest shades sorted by Delta-E 2000 perceptual
    distance. Lower delta_e_score means a closer visual match.
    """
    normalised_hex = _validate_hex_color(hex_color)
    category_lower = category.strip().lower()

    if category_lower not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid category: '{category}'. "
                f"Must be one of: {', '.join(sorted(VALID_CATEGORIES))}."
            ),
        )

    undertone_filter: Optional[str] = None
    if undertone is not None:
        undertone_filter = undertone.strip().lower()
        if undertone_filter not in VALID_UNDERTONES:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid undertone: '{undertone}'. "
                    f"Must be one of: {', '.join(sorted(VALID_UNDERTONES))}."
                ),
            )

    shades = ALL_SHADES.get(category_lower, [])
    if undertone_filter:
        shades = [s for s in shades if s["undertone"] == undertone_filter]

    user_lab = hex_to_lab(normalised_hex)

    scored: list[dict] = []
    for shade in shades:
        shade_lab = hex_to_lab(shade["hex"])
        distance = delta_e_cie2000(user_lab, shade_lab)
        scored.append({
            "shade_name": shade["name"],
            "brand": shade["brand"],
            "hex_color": shade["hex"],
            "delta_e_score": round(distance, 2),
            "purchase_url": _build_purchase_url(shade["brand"], shade["name"]),
        })

    scored.sort(key=lambda entry: entry["delta_e_score"])
    top_matches = scored[:5]

    logger.info(
        "Shade match: hex=%s category=%s undertone=%s top_delta_e=%.2f",
        normalised_hex,
        category_lower,
        undertone_filter,
        top_matches[0]["delta_e_score"] if top_matches else -1,
    )

    return ShadeMatchResponse(
        query_hex=normalised_hex,
        category=category_lower,
        undertone_filter=undertone_filter,
        matches=[ShadeMatch(**m) for m in top_matches],
    )


@router.get("/recommendations", response_model=MakeupRecommendationResponse)
async def get_makeup_recommendations(
    season: str = Query(
        ...,
        description="Color season: spring, summer, autumn, or winter",
    ),
    undertone: str = Query(
        ...,
        description="Skin undertone: warm, cool, or neutral",
    ),
) -> MakeupRecommendationResponse:
    """
    Return personalised makeup recommendations based on colour season
    and undertone. Includes foundation guidance, lipstick picks, blush
    suggestions, and eyeshadow palette ideas.
    """
    season_lower = season.strip().lower()
    undertone_lower = undertone.strip().lower()

    if season_lower not in VALID_SEASONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid season: '{season}'. "
                f"Must be one of: {', '.join(sorted(VALID_SEASONS))}."
            ),
        )

    if undertone_lower not in VALID_UNDERTONES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid undertone: '{undertone}'. "
                f"Must be one of: {', '.join(sorted(VALID_UNDERTONES))}."
            ),
        )

    recs = SEASON_RECOMMENDATIONS[season_lower]

    logger.info(
        "Makeup recommendations: season=%s undertone=%s",
        season_lower,
        undertone_lower,
    )

    return MakeupRecommendationResponse(
        season=season_lower,
        undertone=undertone_lower,
        undertone_guidance=recs["undertone_guidance"],
        foundation_tip=recs["foundation_tip"],
        lipstick_families=recs["lipstick_families"],
        lipstick_picks=recs["lipstick_picks"],
        blush_families=recs["blush_families"],
        blush_picks=recs["blush_picks"],
        eyeshadow_palettes=recs["eyeshadow_palettes"],
    )
