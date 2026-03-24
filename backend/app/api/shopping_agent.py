 """
API — Shopping Agent: 8-Category Outfit Assembly.

Endpoint:
    GET /api/shopping-agent?gender=male&palette=#C76B3F,#A0522D&exclude_ids=...

Accepts the user's palette and returns a complete 8-piece outfit.
Requires authentication.
"""

import logging
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel

from app.core.dependencies import get_current_user
from app.core.rate_limiter import check_rate_limit, get_rate_limit_key
from app.services.affiliate import affiliatize_url

logger = logging.getLogger("lumiqe.api.shopping_agent")
router = APIRouter(prefix="/api/shopping-agent", tags=["Shopping Agent"])


# ─── Response Schemas ─────────────────────────────────────────

class OutfitProductItem(BaseModel):
    name: str
    price: str
    image_url: str
    product_url: str


class CuratedOutfitResponse(BaseModel):
    look_name: str
    upper: OutfitProductItem
    layering: OutfitProductItem
    lower: OutfitProductItem
    shoes: OutfitProductItem
    watch: OutfitProductItem
    bag: OutfitProductItem
    eyewear: OutfitProductItem
    jewelry: OutfitProductItem


# ─── Endpoint ─────────────────────────────────────────────────

_BODY_SHAPE_TIPS: dict[str, str] = {
    "hourglass": "Your balanced proportions look great in fitted silhouettes. Highlight your waist with belted pieces.",
    "pear": "Draw attention upward with statement tops and structured shoulders. A-line bottoms will balance beautifully.",
    "apple": "Empire waists and V-necklines are your best friends. Structured fabrics create a polished look.",
    "rectangle": "Create curves with layered pieces, peplum tops, and belted outfits to define your waist.",
    "inverted_triangle": "Balance broad shoulders with wide-leg pants, A-line skirts, and softer necklines.",
}


@router.get("", response_model=CuratedOutfitResponse)
async def generate_outfit(
    request: Request,
    gender: Literal["male", "female"] = Query(..., description="'male' or 'female'"),
    palette: str = Query(
        ...,
        description=(
            "Comma-separated hex codes from face analysis, "
            "e.g. '#C76B3F,#A0522D,#8B4513'"
        ),
    ),
    exclude_ids: Optional[str] = Query(
        None,
        description=(
            "Comma-separated product URLs to exclude "
            "(for non-repeating outfits)"
        ),
    ),
    style_personality: Optional[str] = Query(None, description="User's style personality (e.g. 'Classic', 'Dramatic')"),
    body_shape: Optional[str] = Query(None, description="User's body shape (e.g. 'hourglass', 'pear')"),
    current_user: dict = Depends(get_current_user),
):
    """
    Scrape 8 categories concurrently, then use Delta-E color
    matching to pick the best item per category.
    Requires authentication.
    """
    # Rate limiting: 20/hour
    rate_key = get_rate_limit_key(request, current_user, "shopping")
    await check_rate_limit(rate_key, 20)

    from app.services.shopping_agent import get_curated_outfit

    palette_hexes = [h.strip() for h in palette.split(",") if h.strip()]

    if not palette_hexes:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_PALETTE",
                "detail": "Palette must contain at least one hex color.",
                "code": 400,
            },
        )

    # Parse exclude IDs into a set
    excluded: set[str] = set()
    if exclude_ids:
        excluded = {
            url.strip()
            for url in exclude_ids.split(",")
            if url.strip()
        }

    try:
        result = await get_curated_outfit(
            gender=gender,
            palette_hexes=palette_hexes,
            exclude_ids=excluded if excluded else None,
        )

        if "error" in result:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "OUTFIT_GENERATION_FAILED",
                    "detail": "Failed to generate outfit. Please try again.",
                    "code": 500,
                },
            )

        # Affiliatize product URLs in each outfit slot
        for slot_key in ("upper", "layering", "lower", "shoes", "watch", "bag", "eyewear", "jewelry"):
            slot = result.get(slot_key)
            if isinstance(slot, dict) and slot.get("product_url"):
                slot["product_url"] = affiliatize_url(slot["product_url"])

        response_data = {"outfit": result}

        # Add body shape tip if provided
        body_shape_tip = None
        if body_shape:
            body_shape_tip = _BODY_SHAPE_TIPS.get(body_shape.lower())
        response_data["body_shape_tip"] = body_shape_tip

        return CuratedOutfitResponse(**result)

    except HTTPException:
        raise

    except Exception as exc:
        logger.error(f"Shopping agent failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "SHOPPING_AGENT_ERROR",
                "detail": "An unexpected error occurred. Please try again.",
                "code": 500,
            },
        )
