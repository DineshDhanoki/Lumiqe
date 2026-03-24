"""API — In-app notification system with Redis-backed store."""

import json
import logging
import time
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_user
from app.core.rate_limiter import _redis_client, _redis_available

logger = logging.getLogger("lumiqe.api.notifications")
router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

# ─── Constants ────────────────────────────────────────────────
_MAX_PER_USER = 50
_REDIS_PREFIX = "lumiqe:notifications:"
_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days

# ─── In-Memory Fallback Store ─────────────────────────────────
_memory_store: dict[int, list[dict]] = defaultdict(list)
_id_counter: int = 0


# ─── Schemas ──────────────────────────────────────────────────


class NotificationOut(BaseModel):
    """Single notification for API responses."""

    id: str
    user_id: int
    title: str
    message: str
    type: str = Field(
        ..., description="info | success | warning | price_alert | digest"
    )
    is_read: bool
    created_at: str


class NotificationsResponse(BaseModel):
    """List of user notifications."""

    notifications: list[NotificationOut]
    unread_count: int


class UnreadCountResponse(BaseModel):
    """Unread notification count."""

    unread_count: int


# ─── Helper: create_notification ──────────────────────────────


async def create_notification(
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "info",
) -> dict:
    """Create a notification for a user. Callable from any module.

    Args:
        user_id: Target user's ID.
        title: Short notification title.
        message: Notification body text.
        notification_type: One of info, success, warning, price_alert, digest.

    Returns:
        The created notification dict.
    """
    global _id_counter

    _id_counter += 1
    notification_id = f"notif_{user_id}_{int(time.time())}_{_id_counter}"

    notification = {
        "id": notification_id,
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notification_type,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if _redis_available and _redis_client:
        redis_key = f"{_REDIS_PREFIX}{user_id}"
        await _redis_client.lpush(redis_key, json.dumps(notification))
        await _redis_client.ltrim(redis_key, 0, _MAX_PER_USER - 1)
        await _redis_client.expire(redis_key, _TTL_SECONDS)
    else:
        user_list = _memory_store[user_id]
        user_list.insert(0, notification)
        if len(user_list) > _MAX_PER_USER:
            _memory_store[user_id] = user_list[:_MAX_PER_USER]

    logger.info(
        "Notification created: user_id=%d type=%s title=%s",
        user_id,
        notification_type,
        title,
    )

    return notification


# ─── Internal helpers ─────────────────────────────────────────


async def _get_user_notifications(user_id: int) -> list[dict]:
    """Return all stored notifications for a user (newest first)."""
    if _redis_available and _redis_client:
        redis_key = f"{_REDIS_PREFIX}{user_id}"
        raw_items = await _redis_client.lrange(redis_key, 0, _MAX_PER_USER - 1)
        return [json.loads(item) for item in raw_items]
    else:
        return list(_memory_store.get(user_id, []))


async def _save_user_notifications(
    user_id: int, notifications: list[dict]
) -> None:
    """Overwrite the stored notifications for a user."""
    if _redis_available and _redis_client:
        redis_key = f"{_REDIS_PREFIX}{user_id}"
        pipe = _redis_client.pipeline()
        await pipe.delete(redis_key)
        for notif in notifications:
            await pipe.rpush(redis_key, json.dumps(notif))
        await pipe.expire(redis_key, _TTL_SECONDS)
        await pipe.execute()
    else:
        _memory_store[user_id] = notifications


# ─── Endpoints ────────────────────────────────────────────────


@router.get("", response_model=NotificationsResponse)
async def get_notifications(
    current_user: dict = Depends(get_current_user),
):
    """Get the authenticated user's recent notifications."""
    user_id = current_user["id"]
    notifications = await _get_user_notifications(user_id)
    unread_count = sum(1 for n in notifications if not n["is_read"])

    return NotificationsResponse(
        notifications=[NotificationOut(**n) for n in notifications],
        unread_count=unread_count,
    )


@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Mark a single notification as read."""
    user_id = current_user["id"]
    notifications = await _get_user_notifications(user_id)

    found = False
    for notif in notifications:
        if notif["id"] == notification_id:
            notif["is_read"] = True
            found = True
            break

    if not found:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "NOTIFICATION_NOT_FOUND",
                "detail": f"Notification {notification_id} not found.",
                "code": 404,
            },
        )

    await _save_user_notifications(user_id, notifications)
    return {"message": "Notification marked as read."}


@router.post("/read-all")
async def mark_all_as_read(
    current_user: dict = Depends(get_current_user),
):
    """Mark all of the authenticated user's notifications as read."""
    user_id = current_user["id"]
    notifications = await _get_user_notifications(user_id)

    for notif in notifications:
        notif["is_read"] = True

    await _save_user_notifications(user_id, notifications)
    return {"message": "All notifications marked as read."}


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: dict = Depends(get_current_user),
):
    """Return the count of unread notifications."""
    user_id = current_user["id"]
    notifications = await _get_user_notifications(user_id)
    unread_count = sum(1 for n in notifications if not n["is_read"])

    return UnreadCountResponse(unread_count=unread_count)
