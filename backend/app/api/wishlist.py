"""API — Wishlist CRUD for saved products."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.repositories import wishlist_repo

logger = logging.getLogger("lumiqe.api.wishlist")
router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])


# ─── Request Models ─────────────────────────────────────────


class WishlistAddRequest(BaseModel):
    product_id: str
    product_name: str
    product_brand: str
    product_price: str
    product_image: str
    product_url: str
    match_score: int = 0


# ─── Endpoints ──────────────────────────────────────────────


@router.get("")
async def get_wishlist(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get all wishlist items for the authenticated user."""
    items = await wishlist_repo.get_user_wishlist(session, current_user["id"])
    return {"items": items, "total": len(items)}


@router.post("")
async def add_to_wishlist(
    body: WishlistAddRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Add a product to the user's wishlist."""
    already_exists = await wishlist_repo.is_wishlisted(
        session, current_user["id"], body.product_id
    )
    if already_exists:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "ALREADY_WISHLISTED",
                "detail": "This product is already in your wishlist.",
                "code": 409,
            },
        )

    item = await wishlist_repo.add_item(
        session,
        user_id=current_user["id"],
        product_id=body.product_id,
        product_name=body.product_name,
        product_brand=body.product_brand,
        product_price=body.product_price,
        product_image=body.product_image,
        product_url=body.product_url,
        match_score=body.match_score,
    )
    logger.info(f"User {current_user['id']} wishlisted product {body.product_id}")
    return {"message": "Product added to wishlist.", "item": item}


@router.delete("/{product_id}")
async def remove_from_wishlist(
    product_id: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Remove a product from the user's wishlist."""
    removed = await wishlist_repo.remove_item(
        session, current_user["id"], product_id
    )
    if not removed:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "NOT_FOUND",
                "detail": "Product not found in your wishlist.",
                "code": 404,
            },
        )
    logger.info(f"User {current_user['id']} removed product {product_id} from wishlist")
    return {"message": "Product removed from wishlist."}


@router.get("/check/{product_id}")
async def check_wishlisted(
    product_id: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Check if a specific product is in the user's wishlist."""
    is_saved = await wishlist_repo.is_wishlisted(
        session, current_user["id"], product_id
    )
    return {"wishlisted": is_saved}
