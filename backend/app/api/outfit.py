"""API — Daily outfit suggestion endpoint."""

import hashlib
import json
import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user, get_db
from app.repositories import product_repo

logger = logging.getLogger("lumiqe.api.outfit")
router = APIRouter(prefix="/api/outfit", tags=["Outfit"])


@router.get("/daily")
async def get_daily_outfit(
    current_user: dict = Depends(get_current_user),
    session=Depends(get_db),
):
    """
    Get today's outfit suggestion based on user's color palette.
    Cached per user per day in Redis.
    """
    user_id = current_user["id"]
    palette = current_user.get("palette") or []
    season = current_user.get("season") or ""
    gender = current_user.get("gender") or "male"

    if not palette or not season:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "NO_ANALYSIS",
                "detail": "Complete a color analysis first to get outfit suggestions.",
                "code": 400,
            },
        )

    today = date.today().isoformat()
    cache_key = f"daily_outfit:{user_id}:{today}"

    # Try Redis cache first
    redis_client = None
    try:
        from app.core.rate_limiter import _redis_client, _redis_available
        if _redis_available and _redis_client:
            redis_client = _redis_client
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
    except Exception:
        pass

    # Deterministic seed from user_id + date
    seed = int(hashlib.md5(f"{user_id}:{today}".encode()).hexdigest()[:8], 16)

    # Query products matching user's season across categories
    categories = ["upper", "lower", "shoes", "watch"]
    outfit_items = []

    all_products = await product_repo.get_by_season(
        session, season=season, gender=gender, limit=50
    )

    # Group by category-like heuristic (product name / tags)
    for cat in categories:
        cat_products = [
            p for p in all_products
            if cat in (p.get("category") or "").lower()
            or cat in (p.get("name") or "").lower()
        ]
        if not cat_products:
            cat_products = all_products

        if cat_products:
            pick = cat_products[seed % len(cat_products)]
            outfit_items.append(pick)
            # Rotate seed for variety
            seed = (seed * 31 + 7) & 0xFFFFFFFF

    # Apply affiliate links
    try:
        from app.services.affiliate import affiliatize_products
        outfit_items = affiliatize_products(outfit_items)
    except ImportError:
        pass

    result = {
        "date": today,
        "season": season,
        "items": outfit_items,
        "tip": f"Today's outfit is curated for your {season} palette. Mix and match with confidence!",
    }

    # Cache in Redis for 24 hours
    try:
        if redis_client:
            await redis_client.set(cache_key, json.dumps(result, default=str), ex=86400)
    except Exception:
        pass

    return result
