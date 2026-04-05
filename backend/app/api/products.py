"""
API — Product listing with Metered Teaser PLG gatekeeper + JIT Scraping.

Implements:
- Casual vibe: fully unlocked for all users, JIT scrape if < 6 items
- Premium vibes (Gym/Party/Formal):
  - Free user: placeholder grid if DB empty, teaser if DB has items
  - Premium user: full access, triggers scrape if needed
"""

import json
import logging
from pathlib import Path
from typing import Literal, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import product_repo
from app.core.dependencies import get_db
from app.services.affiliate import affiliatize_products
from app.services.social_proof import get_product_social_proof

logger = logging.getLogger("lumiqe.api.products")
router = APIRouter(prefix="/api/products", tags=["Products"])

# ─── Fallback JSON (if DB is empty during initial setup) ─────
_PRODUCTS_JSON = Path(__file__).resolve().parent.parent.parent / "data" / "products.json"
_PRODUCTS_FALLBACK: dict = {}
if _PRODUCTS_JSON.exists():
    with open(_PRODUCTS_JSON, "r", encoding="utf-8") as f:
        _PRODUCTS_FALLBACK = json.load(f)

PREMIUM_VIBES = {"Gym", "Party", "Formal"}


async def _attach_social_proof(
    session: AsyncSession,
    products: list[dict],
    user_season: str | None,
) -> list[dict]:
    """Attach social_proof data to each product dict in-place."""
    product_ids = [p.get("id") for p in products if p.get("id")]
    if not product_ids:
        return products

    proof_map = await get_product_social_proof(session, product_ids, user_season)
    for product in products:
        pid = product.get("id")
        product["social_proof"] = proof_map.get(pid, {
            "wishlisted_count": 0,
            "season_match_percent": 0,
            "trending": False,
        })
    return products


# ─── PLG Gatekeeper ─────────────────────────────────────────

def _lock_product(product: dict) -> dict:
    """Strip sensitive data from a product for locked display."""
    locked = dict(product)
    locked["name"] = "Premium Fit"
    locked["purchase_link"] = ""
    locked["url"] = ""
    locked["is_locked"] = True
    return locked


def _unlock_product(product: dict) -> dict:
    """Mark a product as unlocked."""
    unlocked = dict(product)
    unlocked["is_locked"] = False
    return unlocked


def _apply_gatekeeper(
    products: list[dict],
    vibe: str,
    is_teaser_request: bool,
    user_tier: str = "free",
) -> list[dict]:
    """
    Apply the PLG paywall logic to a list of products.

    - Casual vibe or premium user → all unlocked
    - Premium vibe + free user + teaser → item[0] unlocked, rest locked
    - Premium vibe + free user + no teaser → all locked
    """
    if vibe == "Casual" or user_tier == "premium":
        return [_unlock_product(p) for p in products]

    if is_teaser_request:
        result = []
        for i, p in enumerate(products):
            if i == 0:
                result.append(_unlock_product(p))
            else:
                result.append(_lock_product(p))
        return result
    else:
        return [_lock_product(p) for p in products]


def _generate_placeholder_grid(count: int = 6) -> list[dict]:
    """Create placeholder product cards for premium vibes with empty DBs."""
    return [
        {
            "id": f"placeholder-{i}",
            "name": "Premium Fit",
            "brand": "Exclusive",
            "price": "",
            "image_url": "",
            "match_score": 0,
            "purchase_link": "",
            "is_locked": True,
            "is_placeholder": True,
        }
        for i in range(count)
    ]


# ─── JIT Background Scrape Trigger ───────────────────────────

async def _trigger_casual_scrape(season: str, gender: str):
    """Trigger a background Firecrawl scrape for Casual brands only."""
    try:
        from app.services.scraper import scrape_and_store
        from app.services.brand_catalog import BRAND_CATALOG

        casual_brands = BRAND_CATALOG.get(gender, {}).get("Casual", [])
        if not casual_brands:
            logger.warning(f"No Casual brands configured for gender={gender}")
            return

        logger.info(f"JIT scrape triggered: Casual / {gender} (need items for {season})")
        await scrape_and_store(
            gender=gender,
            vibe="Casual",
            max_per_brand=8,
        )
        logger.info(f"JIT scrape complete for Casual / {gender}")
    except Exception as e:
        logger.error(f"JIT scrape failed: {e}", exc_info=True)


async def _trigger_premium_scrape(gender: str, vibe: str):
    """Trigger a background scrape for premium vibe brands (post-purchase)."""
    try:
        from app.services.scraper import scrape_and_store

        logger.info(f"Premium scrape triggered: {vibe} / {gender}")
        await scrape_and_store(
            gender=gender,
            vibe=vibe,
            max_per_brand=8,
        )
        logger.info(f"Premium scrape complete for {vibe} / {gender}")
    except Exception as e:
        logger.error(f"Premium scrape failed: {e}", exc_info=True)


# ─── Endpoints ───────────────────────────────────────────────

@router.get("")
async def get_products_filtered(
    background_tasks: BackgroundTasks,
    season: Optional[str] = Query(None, description="Color season, e.g. 'Deep Winter'"),
    gender: Optional[str] = Query(None, description="'male' or 'female'"),
    vibe: Optional[str] = Query("Casual", description="'Casual', 'Gym', 'Party', 'Formal'"),
    palette: Optional[str] = Query(None, description="Comma-separated hex colors from user's palette, e.g. '#2C1810,#4A2820'"),
    is_teaser_request: bool = Query(False, description="True for the first premium peek"),
    user_tier: Literal["free", "premium"] = Query("free", description="'free' or 'premium'"),
    limit: int = Query(50, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
):
    """
    Fetch products with Delta-E scoring, JIT scraping, cascading fallback, and PLG gatekeeper.
    """
    effective_vibe = vibe or "Casual"
    is_premium_vibe = effective_vibe in PREMIUM_VIBES

    # Parse palette hex colors
    palette_hexes: list[str] = []
    if palette:
        palette_hexes = [c.strip() for c in palette.split(",") if c.strip().startswith("#")]

    # Helper: fetch products using Delta-E if palette available, else fallback
    async def _smart_fetch(vibe_arg: str) -> list[dict]:
        if palette_hexes:
            return await product_repo.score_and_rank(
                session, palette_hexes=palette_hexes,
                season=season or "", gender=gender, vibe=vibe_arg,
            )
        return await product_repo.get_with_fallback(
            session, season=season or "", gender=gender, vibe=vibe_arg,
        )

    # ── CASE 1: Free user requesting a premium vibe ──────────
    if is_premium_vibe and user_tier == "free":
        # Check if we have ANY items in DB for this combo
        db_count = await product_repo.count_products(
            session, season=season, gender=gender, vibe=effective_vibe
        )

        if db_count == 0:
            # DB is empty for this premium vibe — show placeholder grid, no scraping
            logger.info(f"No {effective_vibe} items for {season}/{gender} — returning placeholders")
            return {
                "products": _generate_placeholder_grid(6),
                "total": 6,
                "is_placeholder": True,
            }

        # DB has items — use smart fetch (Delta-E if palette available)
        products = await _smart_fetch(effective_vibe)
        gated = _apply_gatekeeper(products, effective_vibe, is_teaser_request, "free")
        final = affiliatize_products(gated)
        final = await _attach_social_proof(session, final, season)
        return {"products": final, "total": len(gated)}

    # ── CASE 2: Casual vibe (free or premium user) ───────────
    if not is_premium_vibe:
        products = await _smart_fetch(effective_vibe)

        # Fallback to static JSON if DB is still empty
        if not products and season:
            fallback = _PRODUCTS_FALLBACK.get(season, [])
            if not fallback:
                for key, value in _PRODUCTS_FALLBACK.items():
                    if key.lower() == season.lower():
                        fallback = value
                        break
            if fallback:
                logger.warning(f"Using JSON fallback for season: {season}")
                products = fallback

        # JIT: If we have fewer than 6 Casual items, trigger a background scrape
        if len(products) < product_repo.MIN_PRODUCTS and season and gender:
            logger.info(f"Low stock detected ({len(products)} items) — triggering JIT scrape")
            background_tasks.add_task(_trigger_casual_scrape, season, gender)

        gated = _apply_gatekeeper(products, "Casual", is_teaser_request, user_tier)
        final = affiliatize_products(gated)
        final = await _attach_social_proof(session, final, season)
        return {"products": final, "total": len(gated)}

    # ── CASE 3: Premium user requesting a premium vibe ───────
    products = await _smart_fetch(effective_vibe)

    # If premium user has no items yet, trigger a scrape and show loading hint
    if len(products) < product_repo.MIN_PRODUCTS and gender:
        background_tasks.add_task(_trigger_premium_scrape, gender, effective_vibe)

    gated = _apply_gatekeeper(products, effective_vibe, is_teaser_request, "premium")
    final = affiliatize_products(gated)
    final = await _attach_social_proof(session, final, season)
    return {
        "products": final,
        "total": len(gated),
        "scraping_in_progress": len(products) < product_repo.MIN_PRODUCTS,
    }


@router.get("/match")
async def match_products_by_color(
    hex: str = Query(..., description="Target hex color, e.g. #C76B3F"),
    limit: int = Query(20, ge=1, le=100),
    gender: Optional[str] = Query(None),
    vibe: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_db),
):
    """Vector similarity search with optional gender/vibe filters."""
    hex_clean = hex.lstrip("#")
    if len(hex_clean) != 6:
        raise HTTPException(
            status_code=422,
            detail={"error": "INVALID_HEX", "detail": f"Expected 6-digit hex color, got: {hex}", "code": 422},
        )

    products = await product_repo.search_by_color(session, hex, limit, gender, vibe)
    return {"products": affiliatize_products(products), "total": len(products)}


@router.get("/{season}")
async def get_products_by_season(
    season: str,
    gender: Optional[str] = Query(None),
    vibe: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_db),
):
    """Return products for a given color season (legacy endpoint)."""
    products = await product_repo.get_by_season(session, season, gender, vibe)

    if not products:
        fallback = _PRODUCTS_FALLBACK.get(season, [])
        if not fallback:
            for key, value in _PRODUCTS_FALLBACK.items():
                if key.lower() == season.lower():
                    fallback = value
                    break
        if fallback:
            logger.warning(f"Using JSON fallback for season: {season}")
            return fallback

    if not products:
        raise HTTPException(
            status_code=404,
            detail={"error": "SEASON_NOT_FOUND", "detail": f"No products found for season: {season}", "code": 404},
        )

    return products
