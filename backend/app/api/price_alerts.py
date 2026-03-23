"""API — Price drop alerts CRUD for user wishlisted products."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models import PriceAlert

logger = logging.getLogger("lumiqe.api.price_alerts")
router = APIRouter(prefix="/api/price-alerts", tags=["Price Alerts"])


# ─── Request / Response Schemas ──────────────────────────────


class CreatePriceAlertRequest(BaseModel):
    """Request to create a price drop alert."""
    product_id: str = Field(..., min_length=1, max_length=255)
    product_name: str = Field(..., min_length=1, max_length=255)
    product_url: str = Field(..., min_length=1, max_length=512)
    original_price_cents: int = Field(..., gt=0)
    target_drop_percent: int = Field(default=15, ge=1, le=90)


class PriceAlertResponse(BaseModel):
    """Serialized price alert."""
    id: int
    product_id: str
    product_name: str
    product_url: str
    original_price_cents: int
    target_drop_percent: int
    is_triggered: bool
    created_at: str | None


# ─── Endpoints ───────────────────────────────────────────────


@router.get("", response_model=list[PriceAlertResponse])
async def list_price_alerts(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """List all price alerts for the authenticated user."""
    result = await session.execute(
        select(PriceAlert)
        .where(PriceAlert.user_id == current_user["id"])
        .order_by(PriceAlert.created_at.desc())
    )
    alerts = result.scalars().all()

    return [
        PriceAlertResponse(
            id=a.id,
            product_id=a.product_id,
            product_name=a.product_name,
            product_url=a.product_url,
            original_price_cents=a.original_price_cents,
            target_drop_percent=a.target_drop_percent,
            is_triggered=a.is_triggered,
            created_at=a.created_at.isoformat() if a.created_at else None,
        )
        for a in alerts
    ]


@router.post("", response_model=PriceAlertResponse, status_code=201)
async def create_price_alert(
    body: CreatePriceAlertRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Create a new price drop alert. Auth required."""
    alert = PriceAlert(
        user_id=current_user["id"],
        product_id=body.product_id,
        product_name=body.product_name,
        product_url=body.product_url,
        original_price_cents=body.original_price_cents,
        target_drop_percent=body.target_drop_percent,
    )
    session.add(alert)
    await session.flush()

    logger.info(
        f"Price alert created: user_id={current_user['id']} "
        f"product={body.product_name} target_drop={body.target_drop_percent}%"
    )

    return PriceAlertResponse(
        id=alert.id,
        product_id=alert.product_id,
        product_name=alert.product_name,
        product_url=alert.product_url,
        original_price_cents=alert.original_price_cents,
        target_drop_percent=alert.target_drop_percent,
        is_triggered=alert.is_triggered,
        created_at=alert.created_at.isoformat() if alert.created_at else None,
    )


@router.delete("/{alert_id}")
async def delete_price_alert(
    alert_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Delete a price alert. Auth required. User must own the alert."""
    result = await session.execute(
        select(PriceAlert).where(PriceAlert.id == alert_id)
    )
    alert = result.scalar_one_or_none()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "ALERT_NOT_FOUND",
                "detail": f"Price alert with id {alert_id} not found.",
                "code": 404,
            },
        )

    if alert.user_id != current_user["id"]:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "NOT_OWNER",
                "detail": "You do not own this price alert.",
                "code": 403,
            },
        )

    await session.delete(alert)
    logger.info(
        f"Price alert deleted: id={alert_id} user_id={current_user['id']}"
    )

    return {"message": f"Price alert for '{alert.product_name}' deleted."}
