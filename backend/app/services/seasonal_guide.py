"""
Lumiqe — Indian Climate-Based Seasonal Wardrobe Guide.

Maps the Indian climate calendar (5 seasons) to wardrobe transition
guides with swap-out/swap-in items and recommended colors.
"""

import logging
from datetime import date

logger = logging.getLogger("lumiqe.seasonal_guide")

# ─── Indian Climate Calendar ─────────────────────────────────
# Maps each month (1-12) to one of 5 Indian seasons.
MONTH_TO_SEASON: dict[int, str] = {
    1: "Winter",
    2: "Winter",
    3: "Spring",
    4: "Spring",
    5: "Summer",
    6: "Summer",
    7: "Monsoon",
    8: "Monsoon",
    9: "Monsoon",
    10: "Autumn",
    11: "Autumn",
    12: "Winter",
}

# Ordered season cycle for determining next season
SEASON_ORDER = ["Winter", "Spring", "Summer", "Monsoon", "Autumn"]


def _next_season(current: str) -> str:
    """Return the next season in the Indian climate cycle."""
    try:
        idx = SEASON_ORDER.index(current)
        return SEASON_ORDER[(idx + 1) % len(SEASON_ORDER)]
    except ValueError:
        return "Spring"


# ─── Transition Guides ───────────────────────────────────────
# Each season transition defines what to retire, what to bring in,
# and recommended color palettes for warm and cool undertones.

TRANSITION_GUIDES: dict[str, dict] = {
    "Winter": {
        "months": "December — February",
        "description": "Cold, dry weather across North India. Layering season.",
        "swap_out": [
            "Cotton kurtas",
            "Linen shirts",
            "Sandals",
            "Light scarves",
            "Sleeveless tops",
        ],
        "swap_in": [
            "Wool sweaters",
            "Layered jackets",
            "Boots / closed-toe shoes",
            "Shawls and pashminas",
            "Thermal innerwear",
            "Dark denim",
        ],
        "recommended_colors": {
            "warm": ["#8B0000", "#B8860B", "#5C3317", "#A0522D", "#C68642", "#704214"],
            "cool": ["#191970", "#4B0082", "#2F4F4F", "#800020", "#483D8B", "#1C1C3C"],
        },
    },
    "Spring": {
        "months": "March — April",
        "description": "Pleasant, warming days. Festival season with Holi colors.",
        "swap_out": [
            "Heavy wool coats",
            "Thermal innerwear",
            "Thick boots",
            "Dark heavy fabrics",
        ],
        "swap_in": [
            "Light cotton shirts",
            "Pastel kurtas",
            "Canvas sneakers",
            "Floral prints",
            "Light cardigans",
            "Breathable chinos",
        ],
        "recommended_colors": {
            "warm": ["#FF7F50", "#DAA520", "#F4A460", "#E9967A", "#DEB887", "#FFDEAD"],
            "cool": ["#E6E6FA", "#B0C4DE", "#FFB6C1", "#DDA0DD", "#87CEEB", "#ADD8E6"],
        },
    },
    "Summer": {
        "months": "May — June",
        "description": "Peak heat. Lightweight, breathable fabrics are essential.",
        "swap_out": [
            "Cardigans",
            "Closed-toe shoes",
            "Layered outfits",
            "Dark heavy fabrics",
            "Denim jackets",
        ],
        "swap_in": [
            "Linen shirts and kurtas",
            "Cotton palazzos",
            "Kolhapuris / sandals",
            "White and off-white staples",
            "UV-protective sunglasses",
            "Breathable caps or hats",
        ],
        "recommended_colors": {
            "warm": ["#FFFFF0", "#FAEBD7", "#F0E68C", "#FFD700", "#FFDAB9", "#FFF8DC"],
            "cool": ["#F5F5F5", "#E0FFFF", "#F0F8FF", "#FFFFFF", "#B0E0E6", "#E8E8E8"],
        },
    },
    "Monsoon": {
        "months": "July — September",
        "description": "Heavy rains. Quick-dry fabrics, waterproofing, and bold colors.",
        "swap_out": [
            "Suede shoes",
            "Pure silk garments",
            "Linen (wrinkles in humidity)",
            "Light-colored bottoms",
        ],
        "swap_in": [
            "Quick-dry synthetic tops",
            "Waterproof footwear",
            "Dark-wash denims",
            "Rain-friendly jackets",
            "Umbrellas as accessories",
            "Bright prints to beat the grey",
        ],
        "recommended_colors": {
            "warm": ["#006400", "#2E8B57", "#BF5700", "#CD853F", "#B8860B", "#556B2F"],
            "cool": ["#008080", "#4682B4", "#5F9EA0", "#708090", "#20B2AA", "#2F4F4F"],
        },
    },
    "Autumn": {
        "months": "October — November",
        "description": "Cool evenings return. Festive season with Diwali and weddings.",
        "swap_out": [
            "Rain jackets",
            "Waterproof shoes",
            "Quick-dry synthetics",
            "Monsoon-proof accessories",
        ],
        "swap_in": [
            "Light blazers",
            "Festive kurta sets",
            "Ankle boots",
            "Statement jewelry",
            "Silk and brocade fabrics",
            "Earthy layering pieces",
        ],
        "recommended_colors": {
            "warm": ["#D2691E", "#B8860B", "#CD853F", "#8B4513", "#A0522D", "#DAA520"],
            "cool": ["#800080", "#4B0082", "#483D8B", "#800020", "#2F4F4F", "#191970"],
        },
    },
}


def get_guide_for_month(month: int) -> dict:
    """
    Get the seasonal wardrobe transition guide for a specific month.

    Args:
        month: Month number (1-12).

    Returns:
        Dict with current_season, next_season, transition details,
        swap_out/swap_in lists, and recommended color palettes.
    """
    if month < 1 or month > 12:
        month = date.today().month

    current_season = MONTH_TO_SEASON[month]
    next_season = _next_season(current_season)
    guide = TRANSITION_GUIDES[current_season]

    return {
        "current_season": current_season,
        "next_season": next_season,
        "months": guide["months"],
        "description": guide["description"],
        "swap_out": guide["swap_out"],
        "swap_in": guide["swap_in"],
        "recommended_colors": guide["recommended_colors"],
    }


def get_current_guide() -> dict:
    """
    Get the seasonal wardrobe transition guide for the current month.

    Returns:
        Dict with current_season, next_season, transition details,
        swap_out/swap_in lists, and recommended color palettes.
    """
    today = date.today()
    return get_guide_for_month(today.month)
