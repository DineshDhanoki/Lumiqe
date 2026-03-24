"""API — Gift code creation, redemption, and validation."""

import json
import logging
import secrets
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.core.rate_limiter import (
    check_rate_limit,
    get_rate_limit_key,
    _redis_client,
    _redis_available,
)
from app.models import Event, User
from app.repositories import user_repo

logger = logging.getLogger("lumiqe.api.gift")
router = APIRouter(prefix="/api/gift", tags=["Gift"])


# ─── In-Memory Gift Code Store (fallback) ───────────────────

_gift_codes: dict = {}
_MAX_GIFT_CODES = 5000
_GIFT_CODE_TTL_HOURS = 72
_GIFT_REDIS_PREFIX = "lumiqe:gift:"


def _evict_expired_gifts() -> int:
    """Remove all expired gift codes from the in-memory store."""
    now = datetime.now(timezone.utc)
    expired_keys = [
        code for code, entry in _gift_codes.items()
        if entry["expires_at"] <= now
    ]
    for key in expired_keys:
        del _gift_codes[key]

    if expired_keys:
        logger.info(f"Evicted {len(expired_keys)} expired gift codes")

    return len(expired_keys)


async def _store_gift_code(code: str, entry: dict) -> None:
    """Store a gift code in Redis (with TTL) or fall back to in-memory."""
    if _redis_available and _redis_client:
        ttl_seconds = int(
            (entry["expires_at"] - datetime.now(timezone.utc)).total_seconds()
        )
        if ttl_seconds <= 0:
            return
        serializable = {
            **entry,
            "created_at": entry["created_at"].isoformat(),
            "expires_at": entry["expires_at"].isoformat(),
        }
        await _redis_client.set(
            f"{_GIFT_REDIS_PREFIX}{code}",
            json.dumps(serializable),
            ex=ttl_seconds,
        )
    else:
        # In-memory fallback with capacity management
        if len(_gift_codes) >= _MAX_GIFT_CODES:
            evicted = _evict_expired_gifts()
            if evicted == 0 and len(_gift_codes) >= _MAX_GIFT_CODES:
                oldest_key = next(iter(_gift_codes))
                del _gift_codes[oldest_key]
                logger.warning("Gift code store at capacity — evicted oldest code")
        _gift_codes[code] = entry


async def _get_gift_code(code: str) -> dict | None:
    """Retrieve a gift code from Redis or in-memory fallback."""
    if _redis_available and _redis_client:
        raw = await _redis_client.get(f"{_GIFT_REDIS_PREFIX}{code}")
        if raw is None:
            return None
        entry = json.loads(raw)
        entry["created_at"] = datetime.fromisoformat(entry["created_at"])
        entry["expires_at"] = datetime.fromisoformat(entry["expires_at"])
        return entry
    else:
        _evict_expired_gifts()
        return _gift_codes.get(code)


async def _delete_gift_code(code: str) -> None:
    """Delete a gift code from Redis or in-memory fallback."""
    if _redis_available and _redis_client:
        await _redis_client.delete(f"{_GIFT_REDIS_PREFIX}{code}")
    else:
        _gift_codes.pop(code, None)


def _generate_gift_code() -> str:
    """Generate a unique GIFT-XXXXXXXX code."""
    chars = string.ascii_uppercase + string.digits
    for _ in range(20):
        suffix = "".join(secrets.choice(chars) for _ in range(8))
        code = f"GIFT-{suffix}"
        if code not in _gift_codes:
            return code
    raise RuntimeError("Failed to generate a unique gift code after 20 attempts")


# ─── Request Models ─────────────────────────────────────────


class GiftCreateRequest(BaseModel):
    """Optional message to attach to the gift."""
    message: str = ""


class GiftRedeemRequest(BaseModel):
    code: str


# ─── Endpoints ──────────────────────────────────────────────


@router.post("/create")
async def create_gift(
    body: GiftCreateRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Create a gift code by spending 1 credit.

    The code is valid for 72 hours. The recipient gets 1 free scan.
    """
    # Deduct 1 credit from the sender
    deducted = await user_repo.deduct_credit(session, current_user["id"])
    if not deducted:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "INSUFFICIENT_CREDITS",
                "detail": "You need at least 1 credit to create a gift. Purchase credits first.",
                "code": 402,
            },
        )

    code = _generate_gift_code()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=_GIFT_CODE_TTL_HOURS)

    entry = {
        "sender_id": current_user["id"],
        "sender_email": current_user["email"],
        "message": body.message,
        "created_at": now,
        "expires_at": expires_at,
    }
    await _store_gift_code(code, entry)

    # Log the gift creation event
    event = Event(
        user_id=current_user["id"],
        event_name="gift_created",
        properties={"code": code, "message": body.message},
    )
    session.add(event)
    await session.flush()

    logger.info(f"User {current_user['id']} created gift code {code}")

    return {
        "code": code,
        "expires_at": expires_at.isoformat(),
        "message": "Gift code created! Share it with a friend.",
    }


@router.post("/redeem")
async def redeem_gift(
    body: GiftRedeemRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Redeem a gift code. Adds 1 free scan to the redeemer's account.

    The code is consumed on use (single-use).
    """
    # Rate limit: 5 requests per minute per user
    rate_key = get_rate_limit_key(request, current_user, "gift_redeem")
    await check_rate_limit(rate_key, max_requests=5, window_seconds=60)

    code = body.code.strip().upper()

    entry = await _get_gift_code(code)
    if entry is None:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "INVALID_CODE",
                "detail": "Gift code is invalid or has expired.",
                "code": 404,
            },
        )

    # Check expiry (belt-and-suspenders with eviction)
    now = datetime.now(timezone.utc)
    if entry["expires_at"] <= now:
        await _delete_gift_code(code)
        raise HTTPException(
            status_code=410,
            detail={
                "error": "CODE_EXPIRED",
                "detail": "This gift code has expired.",
                "code": 410,
            },
        )

    # Prevent self-redemption
    if entry["sender_id"] == current_user["id"]:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "SELF_REDEEM",
                "detail": "You cannot redeem your own gift code.",
                "code": 400,
            },
        )

    # Consume the code
    await _delete_gift_code(code)

    # Add 1 free scan to the redeemer
    from sqlalchemy import update
    await session.execute(
        update(User)
        .where(User.id == current_user["id"])
        .values(free_scans_left=User.free_scans_left + 1)
    )

    # Log the redemption event
    event = Event(
        user_id=current_user["id"],
        event_name="gift_redeemed",
        properties={
            "code": code,
            "sender_id": entry["sender_id"],
        },
    )
    session.add(event)
    await session.flush()

    logger.info(
        f"User {current_user['id']} redeemed gift code {code} "
        f"(from user {entry['sender_id']})"
    )

    # Notify the gift creator that their code was redeemed
    from app.api.notifications import create_notification

    await create_notification(
        user_id=entry["sender_id"],
        title="Gift Code Redeemed",
        message=(
            f"Your gift code {code} was redeemed! "
            "The recipient received 1 free scan."
        ),
        notification_type="success",
    )

    return {
        "message": "Gift redeemed! You received 1 free scan.",
        "bonus_scans": 1,
        "sender_message": entry.get("message", ""),
    }


@router.get("/check/{code}")
async def check_gift_code(code: str, request: Request):
    """
    Check if a gift code is valid. No authentication required.

    Returns validity status without consuming the code.
    """
    # Rate limit: 10 requests per minute per IP
    rate_key = get_rate_limit_key(request, None, "gift_check")
    await check_rate_limit(rate_key, max_requests=10, window_seconds=60)

    normalized_code = code.strip().upper()

    entry = await _get_gift_code(normalized_code)
    if entry is None:
        return {"valid": False, "reason": "Code not found or expired."}

    now = datetime.now(timezone.utc)
    if entry["expires_at"] <= now:
        await _delete_gift_code(normalized_code)
        return {"valid": False, "reason": "Code has expired."}

    remaining_hours = int((entry["expires_at"] - now).total_seconds() / 3600)

    return {
        "valid": True,
        "expires_in_hours": remaining_hours,
        "message": entry.get("message", ""),
    }
