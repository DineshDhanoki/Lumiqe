"""API — Web Push Notification endpoints.

Handles push subscription storage and notification delivery.
Requires VAPID_PRIVATE_KEY and VAPID_PUBLIC_KEY env vars.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.core.dependencies import get_current_user

logger = logging.getLogger("lumiqe.api.push")
router = APIRouter(prefix="/api/push", tags=["Push Notifications"])


class PushSubscription(BaseModel):
    endpoint: str
    keys: dict  # {p256dh: str, auth: str}


# In-memory store for dev; production should use Redis/DB
_subscriptions: dict[int, list[dict]] = {}


@router.post("/subscribe")
async def subscribe(
    body: PushSubscription,
    current_user: dict = Depends(get_current_user),
):
    """Store a push subscription for the current user."""
    user_id = current_user["id"]
    sub_data = {"endpoint": body.endpoint, "keys": body.keys}

    if user_id not in _subscriptions:
        _subscriptions[user_id] = []

    # Avoid duplicate subscriptions
    existing_endpoints = [s["endpoint"] for s in _subscriptions[user_id]]
    if body.endpoint not in existing_endpoints:
        _subscriptions[user_id].append(sub_data)
        logger.info(f"Push subscription added for user {user_id}")

    return {"status": "subscribed"}


@router.delete("/subscribe")
async def unsubscribe(
    body: PushSubscription,
    current_user: dict = Depends(get_current_user),
):
    """Remove a push subscription."""
    user_id = current_user["id"]
    if user_id in _subscriptions:
        _subscriptions[user_id] = [
            s for s in _subscriptions[user_id]
            if s["endpoint"] != body.endpoint
        ]
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
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.debug("pywebpush not installed — push notifications disabled")
        return False

    vapid_private = getattr(settings, "VAPID_PRIVATE_KEY", None)
    vapid_email = getattr(settings, "VAPID_CONTACT_EMAIL", "mailto:support@lumiqe.in")
    if not vapid_private:
        return False

    import json
    payload = json.dumps({"title": title, "body": body, "url": url})
    subs = _subscriptions.get(user_id, [])
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
