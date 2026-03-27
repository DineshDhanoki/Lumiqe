"""API — Web Push Notification endpoints.

Handles push subscription storage and notification delivery.
Subscriptions are stored in Redis for multi-pod scalability.
Requires VAPID_PRIVATE_KEY and VAPID_PUBLIC_KEY env vars.
"""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.core.dependencies import get_current_user

logger = logging.getLogger("lumiqe.api.push")
router = APIRouter(prefix="/api/push", tags=["Push Notifications"])

_PUSH_KEY_PREFIX = "lumiqe:push:subs:"
_PUSH_SUB_TTL = 30 * 24 * 3600  # 30 days


class PushSubscription(BaseModel):
    endpoint: str
    keys: dict  # {p256dh: str, auth: str}


# ─── Redis-backed subscription storage ───────────────────────


async def _get_redis():
    """Get the Redis client from rate_limiter module (shared connection)."""
    from app.core.rate_limiter import _redis_client, _redis_available
    if _redis_available and _redis_client:
        return _redis_client
    return None


async def _get_subscriptions(user_id: int) -> list[dict]:
    """Load push subscriptions for a user from Redis."""
    redis = await _get_redis()
    if not redis:
        return []
    try:
        raw = await redis.get(f"{_PUSH_KEY_PREFIX}{user_id}")
        return json.loads(raw) if raw else []
    except Exception:
        return []


async def _save_subscriptions(user_id: int, subs: list[dict]) -> None:
    """Save push subscriptions for a user to Redis."""
    redis = await _get_redis()
    if not redis:
        return
    try:
        await redis.set(
            f"{_PUSH_KEY_PREFIX}{user_id}",
            json.dumps(subs),
            ex=_PUSH_SUB_TTL,
        )
    except Exception as exc:
        logger.warning(f"Failed to save push subscriptions: {exc}")


# ─── Endpoints ────────────────────────────────────────────────


@router.post("/subscribe")
async def subscribe(
    body: PushSubscription,
    current_user: dict = Depends(get_current_user),
):
    """Store a push subscription for the current user (Redis-backed)."""
    user_id = current_user["id"]
    subs = await _get_subscriptions(user_id)

    # Avoid duplicate subscriptions
    existing_endpoints = [s["endpoint"] for s in subs]
    if body.endpoint not in existing_endpoints:
        subs.append({"endpoint": body.endpoint, "keys": body.keys})
        await _save_subscriptions(user_id, subs)
        logger.info(f"Push subscription added for user {user_id}")

    return {"status": "subscribed"}


@router.delete("/subscribe")
async def unsubscribe(
    body: PushSubscription,
    current_user: dict = Depends(get_current_user),
):
    """Remove a push subscription."""
    user_id = current_user["id"]
    subs = await _get_subscriptions(user_id)
    subs = [s for s in subs if s["endpoint"] != body.endpoint]
    await _save_subscriptions(user_id, subs)
    return {"status": "unsubscribed"}


@router.get("/vapid-key")
async def get_vapid_key():
    """Return the VAPID public key for client-side subscription."""
    public_key = getattr(settings, "VAPID_PUBLIC_KEY", None)
    if not public_key:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "PUSH_NOT_CONFIGURED",
                "detail": "Push notifications are not configured on this server.",
                "code": 503,
            },
        )
    return {"public_key": public_key}


async def send_push_notification(user_id: int, title: str, body: str, url: str = "/") -> bool:
    """Send a push notification to all subscriptions for a user."""
    try:
        from pywebpush import webpush
    except ImportError:
        logger.debug("pywebpush not installed — push notifications disabled")
        return False

    vapid_private = getattr(settings, "VAPID_PRIVATE_KEY", None)
    vapid_email = getattr(settings, "VAPID_CONTACT_EMAIL", "mailto:support@lumiqe.in")
    if not vapid_private:
        return False

    payload = json.dumps({"title": title, "body": body, "url": url})
    subs = await _get_subscriptions(user_id)
    sent = 0

    for sub in subs:
        try:
            webpush(
                subscription_info=sub,
                data=payload,
                vapid_private_key=vapid_private,
                vapid_claims={"sub": vapid_email},
            )
            sent += 1
        except Exception as exc:
            logger.warning(f"Push send failed for user {user_id}: {exc}")

    logger.info(f"Push sent to {sent}/{len(subs)} subscriptions for user {user_id}")
    return sent > 0
