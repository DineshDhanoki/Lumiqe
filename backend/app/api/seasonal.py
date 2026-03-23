"""API — Seasonal wardrobe guide based on Indian climate transitions."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

logger = logging.getLogger("lumiqe.api.seasonal")
router = APIRouter(prefix="/api/seasonal-guide", tags=["Seasonal Guide"])


# ─── Season Data ─────────────────────────────────────────────

# Indian climate transitions by month range
_SEASONAL_GUIDE: list[dict] = [
    {
        "months": [1, 2],
        "name": "Peak Winter",
        "description": "Cold, dry weather across North India. Layer up with warm tones.",
        "swap_out": ["Linen shirts", "Sleeveless tops", "Light cotton kurtas"],
        "swap_in": ["Wool blazers", "Cashmere sweaters", "Layered jackets"],
        "recommended_colors": ["#8B4513", "#A0522D", "#800020", "#2F4F4F", "#556B2F", "#704214"],
    },
    {
        "months": [3, 4],
        "name": "Spring Transition",
        "description": "Warming up. Shift from heavy layers to breathable mid-layers.",
        "swap_out": ["Heavy wool coats", "Thick scarves", "Dark thermals"],
        "swap_in": ["Light cardigans", "Cotton shirts", "Pastel kurtas"],
        "recommended_colors": ["#FFB6C1", "#98FB98", "#87CEEB", "#DDA0DD", "#F0E68C", "#E6E6FA"],
    },
    {
        "months": [5, 6],
        "name": "Pre-Monsoon Summer",
        "description": "Peak heat. Prioritize breathable fabrics and light colors.",
        "swap_out": ["Layered outfits", "Dark denim", "Synthetic fabrics"],
        "swap_in": ["Linen shirts", "Cotton kurtas", "Light chinos"],
        "recommended_colors": ["#FFFFFF", "#F5F5DC", "#FAEBD7", "#E0FFFF", "#FFFACD", "#F0FFF0"],
    },
    {
        "months": [7, 8, 9],
        "name": "Monsoon Season",
        "description": "Heavy rainfall. Choose quick-dry fabrics and waterproof layers.",
        "swap_out": ["Suede shoes", "Silk garments", "White bottoms"],
        "swap_in": ["Waterproof jackets", "Quick-dry tees", "Dark denim"],
        "recommended_colors": ["#2E8B57", "#4682B4", "#708090", "#483D8B", "#6B8E23", "#5F9EA0"],
    },
    {
        "months": [10, 11],
        "name": "Autumn Festive",
        "description": "Festival season. Rich, warm tones for celebrations and cooler evenings.",
        "swap_out": ["Rain gear", "Dull quick-dry fabrics", "Flip-flops"],
        "swap_in": ["Ethnic wear", "Blazers", "Statement accessories"],
        "recommended_colors": ["#DAA520", "#B8860B", "#CD853F", "#DC143C", "#8B0000", "#FF8C00"],
    },
    {
        "months": [12],
        "name": "Early Winter",
        "description": "Temperatures dropping. Start layering with earth tones and jewel tones.",
        "swap_out": ["Lightweight cotton", "Open sandals", "Bright summer prints"],
        "swap_in": ["Quilted jackets", "Thermal innerwear", "Ankle boots"],
        "recommended_colors": ["#800000", "#191970", "#2F4F4F", "#8B4513", "#4B0082", "#696969"],
    },
]


# ─── Response Schema ─────────────────────────────────────────


class SeasonalGuideResponse(BaseModel):
    """Current seasonal wardrobe transition guide."""
    current_month: int
    season_name: str
    description: str
    swap_out: list[str]
    swap_in: list[str]
    recommended_colors: list[str]


# ─── Endpoint ────────────────────────────────────────────────


def _get_current_guide() -> dict:
    """Return the seasonal guide for the current month."""
    current_month = datetime.now(timezone.utc).month

    for guide in _SEASONAL_GUIDE:
        if current_month in guide["months"]:
            return {
                "current_month": current_month,
                "season_name": guide["name"],
                "description": guide["description"],
                "swap_out": guide["swap_out"],
                "swap_in": guide["swap_in"],
                "recommended_colors": guide["recommended_colors"],
            }

    # Fallback (should not happen)
    return {
        "current_month": current_month,
        "season_name": "Unknown",
        "description": "No seasonal guide available for this month.",
        "swap_out": [],
        "swap_in": [],
        "recommended_colors": [],
    }


@router.get("", response_model=SeasonalGuideResponse)
async def get_seasonal_guide():
    """
    Returns the current Indian climate transition with wardrobe
    swap_out/swap_in recommendations and recommended_colors.
    """
    guide = _get_current_guide()
    logger.info(f"Seasonal guide served: month={guide['current_month']} season={guide['season_name']}")
    return SeasonalGuideResponse(**guide)
