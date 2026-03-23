"""API — Save and manage shopping agent outfits."""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models import SavedOutfit

logger = logging.getLogger("lumiqe.api.saved_outfits")
router = APIRouter(prefix="/api/outfits", tags=["Saved Outfits"])

_MAX_SAVED_OUTFITS = 20


# ─── Request Models ─────────────────────────────────────────


class SaveOutfitRequest(BaseModel):
    look_name: str
    outfit_data: dict


# ─── Endpoints ──────────────────────────────────────────────


@router.get("/saved")
async def get_saved_outfits(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get all saved outfits for the authenticated user."""
    result = await session.execute(
        select(SavedOutfit)
        .where(SavedOutfit.user_id == current_user["id"])
        .order_by(SavedOutfit.created_at.desc())
    )
    outfits = result.scalars().all()

    return {
        "outfits": [
            {
                "id": outfit.id,
                "look_name": outfit.look_name,
                "outfit_data": outfit.outfit_data,
                "created_at": outfit.created_at.isoformat() if outfit.created_at else None,
            }
            for outfit in outfits
        ],
        "total": len(outfits),
    }


@router.post("/saved")
async def save_outfit(
    body: SaveOutfitRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Save a shopping agent outfit. Maximum 20 outfits per user."""
    # Enforce per-user limit
    count_result = await session.execute(
        select(func.count()).select_from(SavedOutfit).where(
            SavedOutfit.user_id == current_user["id"]
        )
    )
    current_count = count_result.scalar() or 0

    if current_count >= _MAX_SAVED_OUTFITS:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "OUTFIT_LIMIT_REACHED",
                "detail": f"You can save up to {_MAX_SAVED_OUTFITS} outfits. Delete some to save new ones.",
                "code": 400,
            },
        )

    outfit = SavedOutfit(
        id=str(uuid.uuid4()),
        user_id=current_user["id"],
        look_name=body.look_name,
        outfit_data=body.outfit_data,
        created_at=datetime.now(timezone.utc),
    )
    session.add(outfit)
    await session.flush()

    logger.info(f"User {current_user['id']} saved outfit '{body.look_name}' (id={outfit.id})")
    return {
        "message": "Outfit saved.",
        "outfit": {
            "id": outfit.id,
            "look_name": outfit.look_name,
            "outfit_data": outfit.outfit_data,
            "created_at": outfit.created_at.isoformat() if outfit.created_at else None,
        },
    }


@router.delete("/saved/{outfit_id}")
async def delete_saved_outfit(
    outfit_id: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Delete a saved outfit. Only the owner can delete their outfits."""
    result = await session.execute(
        select(SavedOutfit).where(SavedOutfit.id == outfit_id)
    )
    outfit = result.scalar_one_or_none()

    if not outfit:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "NOT_FOUND",
                "detail": "Outfit not found.",
                "code": 404,
            },
        )

    if outfit.user_id != current_user["id"]:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "FORBIDDEN",
                "detail": "You can only delete your own outfits.",
                "code": 403,
            },
        )

    await session.delete(outfit)
    logger.info(f"User {current_user['id']} deleted outfit {outfit_id}")
    return {"message": "Outfit deleted."}
