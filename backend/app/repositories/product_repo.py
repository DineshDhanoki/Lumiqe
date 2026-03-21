"""
Product Repository — Database queries for dynamic catalog.

Supports filtering by season, gender, vibe, tier, pgvector
cosine similarity search, and Guarantee-6 cascading fallback.
"""

import logging
from typing import Optional

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Product

logger = logging.getLogger("lumiqe.repo.product")

# Sibling season mapping — ordered by color-theory proximity
SIBLING_SEASONS: dict[str, list[str]] = {
    "Deep Winter":   ["True Winter", "Deep Autumn"],
    "True Winter":   ["Deep Winter", "Cool Summer"],
    "Bright Winter": ["True Winter", "Bright Spring"],
    "Deep Autumn":   ["Deep Winter", "True Autumn"],
    "True Autumn":   ["Deep Autumn", "Soft Autumn"],
    "Soft Autumn":   ["True Autumn", "Soft Summer"],
    "Bright Spring": ["Bright Winter", "True Spring"],
    "True Spring":   ["Bright Spring", "Light Spring"],
    "Light Spring":  ["True Spring", "Light Summer"],
    "Cool Summer":   ["True Winter", "True Summer"],
    "True Summer":   ["Cool Summer", "Light Summer"],
    "Light Summer":  ["True Summer", "Light Spring"],
    "Soft Summer":   ["Soft Autumn", "True Summer"],
}

MIN_PRODUCTS = 12  # Guarantee this many items per feed section


async def count_products(
    session: AsyncSession,
    season: Optional[str] = None,
    gender: Optional[str] = None,
    vibe: Optional[str] = None,
) -> int:
    """Count active products matching the given filters."""
    conditions = [Product.is_active == True]
    if season:
        conditions.append(Product.season == season)
    if gender:
        conditions.append(Product.gender == gender.lower())
    if vibe:
        conditions.append(Product.vibe == vibe)

    count = await session.scalar(
        select(func.count(Product.id)).where(and_(*conditions))
    )
    return count or 0


async def get_by_season(
    session: AsyncSession,
    season: str,
    gender: Optional[str] = None,
    vibe: Optional[str] = None,
    limit: int = 50,
) -> list[dict]:
    """Get active products for a season, optionally filtered by gender/vibe."""
    conditions = [
        Product.season == season,
        Product.is_active == True,
    ]
    if gender:
        conditions.append(Product.gender == gender.lower())
    if vibe:
        conditions.append(Product.vibe == vibe)

    stmt = (
        select(Product)
        .where(and_(*conditions))
        .order_by(Product.match_score.desc())
        .limit(limit)
    )
    result = await session.execute(stmt)
    products = result.scalars().all()
    return [p.to_dict() for p in products]


async def get_by_filters(
    session: AsyncSession,
    gender: Optional[str] = None,
    vibe: Optional[str] = None,
    season: Optional[str] = None,
    tier: Optional[str] = None,
    limit: int = 50,
) -> list[dict]:
    """Get products by any combination of filters."""
    conditions = [Product.is_active == True]

    if gender:
        conditions.append(Product.gender == gender.lower())
    if vibe:
        conditions.append(Product.vibe == vibe)
    if season:
        conditions.append(Product.season == season)
    if tier:
        conditions.append(Product.tier == tier)

    stmt = (
        select(Product)
        .where(and_(*conditions))
        .order_by(Product.match_score.desc())
        .limit(limit)
    )
    result = await session.execute(stmt)
    products = result.scalars().all()
    return [p.to_dict() for p in products]


async def get_with_fallback(
    session: AsyncSession,
    season: str,
    gender: Optional[str] = None,
    vibe: Optional[str] = None,
    min_items: int = MIN_PRODUCTS,
) -> list[dict]:
    """
    Guarantee at least `min_items` products using cascading fallback:
      1. Exact season match
      2. Sibling seasons (color-theory close)
      3. Any item in the same vibe (universal)
    """
    seen_ids: set[str] = set()
    results: list[dict] = []

    def _add(items: list[dict]):
        for item in items:
            if item["id"] not in seen_ids:
                seen_ids.add(item["id"])
                results.append(item)

    # Level 1 — Exact match
    exact = await get_by_filters(session, gender=gender, vibe=vibe, season=season, limit=min_items)
    _add(exact)
    if len(results) >= min_items:
        return results[:min_items]

    # Level 2 — Sibling seasons
    siblings = SIBLING_SEASONS.get(season, [])
    for sibling_season in siblings:
        if len(results) >= min_items:
            break
        remaining = min_items - len(results)
        sibling_items = await get_by_filters(
            session, gender=gender, vibe=vibe, season=sibling_season, limit=remaining
        )
        _add(sibling_items)

    if len(results) >= min_items:
        return results[:min_items]

    # Level 3 — Universal (same vibe, any season)
    remaining = min_items - len(results)
    universal = await get_by_filters(session, gender=gender, vibe=vibe, limit=remaining + len(seen_ids))
    _add(universal)

    logger.info(
        f"Fallback fill: {season}/{vibe}/{gender} → exact={len(exact)}, "
        f"siblings={len(results) - len(exact)}, total={len(results)}"
    )
    return results[:min_items]


async def score_and_rank(
    session: AsyncSession,
    palette_hexes: list[str],
    season: str = "",
    gender: Optional[str] = None,
    vibe: Optional[str] = None,
    min_items: int = MIN_PRODUCTS,
) -> list[dict]:
    """
    Tier 1 + Tier 2: Score products using Delta-E against the user's palette,
    then diversify by category.

    Steps:
      1. Fetch a wide pool of candidates via get_with_fallback()
      2. Compute real Delta-E match score for each product
      3. Apply category round-robin for maximum diversity
      4. Return top `min_items` products with real match scores
    """
    from app.services.color_matcher import hex_to_lab, delta_e_cie2000

    # Step 1 — Get a wide candidate pool (3x our target for diversity headroom)
    candidates = await get_with_fallback(
        session, season=season, gender=gender, vibe=vibe,
        min_items=min_items * 3,
    )

    if not candidates or not palette_hexes:
        return candidates[:min_items]

    # Pre-compute palette LAB values (once)
    palette_labs = []
    for hex_color in palette_hexes:
        try:
            palette_labs.append(hex_to_lab(hex_color))
        except Exception:
            continue

    if not palette_labs:
        return candidates[:min_items]

    # Step 2 — Score each product using Delta-E 2000
    scored: list[dict] = []
    for product in candidates:
        product_hex = product.get("color_hex")
        if not product_hex or len(product_hex) < 4:
            # No color data — assign a neutral score
            product["match_score"] = 50
            scored.append(product)
            continue

        try:
            product_lab = hex_to_lab(product_hex)
        except Exception:
            product["match_score"] = 50
            scored.append(product)
            continue

        # Find the closest palette color (minimum Delta-E)
        best_delta_e = min(
            delta_e_cie2000(product_lab, p_lab) for p_lab in palette_labs
        )

        # Convert Delta-E to 0-100 score
        # Delta-E 0 → 100%, Delta-E ≥ 40 → 0%
        MAX_DELTA_E = 40.0
        match_score = max(0, int(100 - (best_delta_e / MAX_DELTA_E * 100)))

        product["match_score"] = match_score
        scored.append(product)

    # Step 3 — Category round-robin for diversity (Tier 2)
    scored.sort(key=lambda p: p["match_score"], reverse=True)

    # Group by category
    by_category: dict[str, list[dict]] = {}
    for product in scored:
        cat = product.get("category", "Other")
        by_category.setdefault(cat, []).append(product)

    # Pick top-1 from each category first (round-robin)
    result: list[dict] = []
    seen_ids: set[str] = set()

    for cat_products in by_category.values():
        if cat_products and len(result) < min_items:
            top = cat_products[0]
            if top["id"] not in seen_ids:
                result.append(top)
                seen_ids.add(top["id"])

    # Fill remaining slots with best scoring products
    for product in scored:
        if len(result) >= min_items:
            break
        if product["id"] not in seen_ids:
            result.append(product)
            seen_ids.add(product["id"])

    # Final sort by score (highest first)
    result.sort(key=lambda p: p["match_score"], reverse=True)

    logger.info(
        f"score_and_rank: palette={len(palette_hexes)} colors, "
        f"candidates={len(candidates)}, scored={len(scored)}, "
        f"categories={len(by_category)}, final={len(result)}"
    )
    return result[:min_items]


async def search_by_color(
    session: AsyncSession,
    hex_color: str,
    limit: int = 20,
    gender: Optional[str] = None,
    vibe: Optional[str] = None,
) -> list[dict]:
    """Find products closest to a color using pgvector cosine distance."""
    hex_clean = hex_color.lstrip("#")
    r = int(hex_clean[0:2], 16) / 255.0
    g = int(hex_clean[2:4], 16) / 255.0
    b = int(hex_clean[4:6], 16) / 255.0
    target_vector = [r, g, b]

    conditions = [
        Product.color_embedding.isnot(None),
        Product.is_active == True,
    ]
    if gender:
        conditions.append(Product.gender == gender.lower())
    if vibe:
        conditions.append(Product.vibe == vibe)

    stmt = (
        select(Product)
        .where(and_(*conditions))
        .order_by(Product.color_embedding.cosine_distance(target_vector))
        .limit(limit)
    )
    result = await session.execute(stmt)
    products = result.scalars().all()
    return [p.to_dict() for p in products]


async def get_catalog_stats(session: AsyncSession) -> dict:
    """Return catalog health stats."""
    total = await session.scalar(select(func.count(Product.id)))
    active = await session.scalar(
        select(func.count(Product.id)).where(Product.is_active == True)
    )
    by_vibe = {}
    for vibe in ["Casual", "Gym", "Party", "Formal"]:
        count = await session.scalar(
            select(func.count(Product.id)).where(
                and_(Product.vibe == vibe, Product.is_active == True)
            )
        )
        by_vibe[vibe] = count or 0

    by_gender = {}
    for gender in ["male", "female"]:
        count = await session.scalar(
            select(func.count(Product.id)).where(
                and_(Product.gender == gender, Product.is_active == True)
            )
        )
        by_gender[gender] = count or 0

    return {
        "total": total or 0,
        "active": active or 0,
        "by_vibe": by_vibe,
        "by_gender": by_gender,
    }
