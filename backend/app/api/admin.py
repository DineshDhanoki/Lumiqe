"""
API — Admin endpoints for product catalog management.

Provides endpoints to trigger scrapes, view catalog stats,
and manually manage products. All endpoints require admin privileges.
"""

import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.models import Product
from app.repositories import product_repo
from app.services.brand_catalog import get_brands, get_all_vibes, get_all_genders

logger = logging.getLogger("lumiqe.api.admin")
router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.post("/products/refresh")
async def refresh_products(
    background_tasks: BackgroundTasks,
    gender: Literal["male", "female"] = Query(..., description="'male' or 'female'"),
    vibe: Literal["Casual", "Gym", "Party", "Formal"] = Query(..., description="'Casual', 'Gym', 'Party', 'Formal'"),
    max_per_brand: int = Query(8, ge=1, le=20),
    admin_user: dict = Depends(require_admin),
):
    """
    Trigger a Firecrawl scrape for a Gender + Vibe combination.
    Runs in the background so the request returns immediately.
    Requires admin privileges.
    """
    brands = get_brands(gender.lower(), vibe)
    if not brands:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "NO_BRANDS",
                "detail": f"No brands configured for {gender}/{vibe}",
                "code": 404,
            },
        )

    async def _run_scrape():
        from app.services.scraper import scrape_and_save
        try:
            count = await scrape_and_save(gender.lower(), vibe, max_per_brand)
            logger.info(f"Background scrape complete: {count} products saved for {gender}/{vibe}")
        except Exception as e:
            logger.error(f"Background scrape failed for {gender}/{vibe}: {e}", exc_info=True)

    background_tasks.add_task(_run_scrape)

    return {
        "message": f"Scrape started for {gender}/{vibe}",
        "brands": [b["brand"] for b in brands],
        "status": "running_in_background",
    }


@router.post("/products/refresh-all")
async def refresh_all_products(
    background_tasks: BackgroundTasks,
    max_per_brand: int = Query(6, ge=1, le=20),
    admin_user: dict = Depends(require_admin),
):
    """
    Trigger scraping for ALL Gender × Vibe combinations.
    Use with caution — consumes many Firecrawl API credits.
    Requires admin privileges.
    """
    combos = []
    for gender in get_all_genders():
        for vibe in get_all_vibes():
            brands = get_brands(gender, vibe)
            if brands:
                combos.append((gender, vibe))

    async def _run_full_scrape():
        from app.services.scraper import scrape_and_save
        total = 0
        for gender, vibe in combos:
            try:
                count = await scrape_and_save(gender, vibe, max_per_brand)
                total += count
                logger.info(f"Scraped {count} for {gender}/{vibe}")
            except Exception as e:
                logger.error(f"Scrape failed for {gender}/{vibe}: {e}")
        logger.info(f"Full catalog refresh complete: {total} total products")

    background_tasks.add_task(_run_full_scrape)

    return {
        "message": f"Full catalog refresh started for {len(combos)} combinations",
        "combinations": [f"{g}/{v}" for g, v in combos],
        "status": "running_in_background",
    }


@router.post("/send-weekly-digest")
async def send_weekly_digest(
    admin_user: dict = Depends(require_admin),
):
    """Manually trigger the weekly digest email for all users. Requires admin privileges."""
    try:
        from app.services.email_digest import send_weekly_digest as _send_digest
        count = await _send_digest()
        logger.info(f"Weekly digest triggered by admin {admin_user['email']}: {count} emails sent")
        return {"message": f"Weekly digest sent to {count} users.", "count": count}
    except ImportError:
        logger.warning("email_digest service not available")
        return {"message": "Weekly digest service not yet implemented.", "count": 0}
    except Exception as exc:
        logger.error(f"Weekly digest failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "DIGEST_FAILED", "detail": str(exc), "code": 500},
        )


@router.get("/products/stats")
async def catalog_stats(
    session: AsyncSession = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Return catalog health statistics. Requires admin privileges."""
    stats = await product_repo.get_catalog_stats(session)
    return stats


@router.get("/products")
async def list_products(
    search: str | None = Query(None, description="Filter by name or brand"),
    gender: str | None = Query(None, description="Filter by gender (male/female)"),
    vibe: str | None = Query(None, description="Filter by vibe"),
    active_only: bool = Query(False, description="Only show active products"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    admin_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    """List products with optional search and filtering."""
    q = select(Product).order_by(Product.id.desc())
    if active_only:
        q = q.where(Product.is_active == True)  # noqa: E712
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        q = q.where(Product.name.ilike(pattern) | Product.brand.ilike(pattern))
    if gender:
        q = q.where(Product.gender == gender.lower())
    if vibe:
        q = q.where(Product.vibe == vibe)
    result = await session.execute(q.limit(limit).offset(offset))
    products = result.scalars().all()
    return [p.to_dict() for p in products]


@router.patch("/products/{product_id}/toggle")
async def toggle_product_active(
    product_id: str,
    admin_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    """Toggle a product's is_active flag."""
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=404,
            detail={"error": "NOT_FOUND", "detail": "Product not found.", "code": 404},
        )
    product.is_active = not product.is_active
    await session.flush()
    logger.info(
        f"Admin {admin_user['email']} toggled product {product_id} "
        f"active={product.is_active}"
    )
    return {"id": product_id, "is_active": product.is_active}
