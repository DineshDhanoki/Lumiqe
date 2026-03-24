"""API — Community moderation: reporting, admin review, and admin deletion."""

import logging
import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_admin
from app.models import CommunityPost, CommunityLike, Event
from app.api.community import PostResponse

logger = logging.getLogger("lumiqe.api.community_moderation")
router = APIRouter(prefix="/api/community", tags=["Community Moderation"])


# ─── Report Rate Limiting (in-memory) ────────────────────────

_report_timestamps: dict[int, list[float]] = defaultdict(list)
_REPORT_MAX_PER_HOUR = 5
_REPORT_WINDOW_SECONDS = 3600


def _check_report_rate_limit(user_id: int) -> None:
    """Raise 429 if user has exceeded 5 reports per hour."""
    now = time.time()
    cutoff = now - _REPORT_WINDOW_SECONDS
    timestamps = _report_timestamps[user_id]
    _report_timestamps[user_id] = [t for t in timestamps if t > cutoff]
    if len(_report_timestamps[user_id]) >= _REPORT_MAX_PER_HOUR:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "RATE_LIMIT_EXCEEDED",
                "detail": "You can only submit 5 reports per hour.",
                "code": 429,
            },
        )
    _report_timestamps[user_id].append(now)


# ─── Request / Response Schemas ──────────────────────────────


class ReportRequest(BaseModel):
    """Reason for reporting a community post."""

    reason: str = Field(..., min_length=1, max_length=500)


class ReportedPostResponse(BaseModel):
    """A reported post with report details."""

    post: PostResponse
    report_count: int
    report_reasons: list[str]


# ─── Helper Functions ────────────────────────────────────────


async def _fetch_post_or_404(
    session: AsyncSession, post_id: int
) -> CommunityPost:
    """Fetch a community post by ID or raise 404."""
    post_result = await session.execute(
        select(CommunityPost).where(CommunityPost.id == post_id)
    )
    post = post_result.scalar_one_or_none()
    if not post:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "POST_NOT_FOUND",
                "detail": f"Community post with id {post_id} not found.",
                "code": 404,
            },
        )
    return post


def _serialize_post(post: CommunityPost) -> PostResponse:
    """Convert a CommunityPost ORM object to a PostResponse schema."""
    return PostResponse(
        id=post.id,
        user_id=post.user_id,
        image_url=post.image_url,
        caption=post.caption,
        season_tag=post.season_tag,
        likes_count=post.likes_count,
        created_at=post.created_at.isoformat() if post.created_at else None,
    )


async def _count_reports_for_post(
    session: AsyncSession, post_id: int
) -> int:
    """Count total community_report events targeting a specific post."""
    all_reports_result = await session.execute(
        select(Event).where(Event.event_name == "community_report")
    )
    all_reports = all_reports_result.scalars().all()
    return sum(
        1
        for r in all_reports
        if r.properties and r.properties.get("post_id") == post_id
    )


# ─── Endpoints ───────────────────────────────────────────────


@router.post("/{post_id}/report")
async def report_post(
    post_id: int,
    body: ReportRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Report a community post. Rate limited to 5 reports per hour per user."""
    _check_report_rate_limit(current_user["id"])

    post = await _fetch_post_or_404(session, post_id)

    # Check if user already reported this post
    existing_reports_result = await session.execute(
        select(Event).where(
            Event.event_name == "community_report",
            Event.user_id == current_user["id"],
        )
    )
    existing_reports = existing_reports_result.scalars().all()
    for report in existing_reports:
        if report.properties and report.properties.get("post_id") == post_id:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "ALREADY_REPORTED",
                    "detail": "You have already reported this post.",
                    "code": 400,
                },
            )

    # Create report event
    event = Event(
        user_id=current_user["id"],
        event_name="community_report",
        properties={
            "post_id": post_id,
            "reason": body.reason,
        },
    )
    session.add(event)
    await session.flush()

    report_count = await _count_reports_for_post(session, post_id)

    # Auto-hide: if 3+ reports, delete the post
    auto_hidden = False
    if report_count >= 3:
        await session.delete(post)
        auto_hidden = True
        logger.warning(
            "Community post auto-hidden (3+ reports): post_id=%d report_count=%d",
            post_id,
            report_count,
        )

    logger.info(
        "Community post reported: user_id=%d post_id=%d reason=%s",
        current_user["id"],
        post_id,
        body.reason[:100],
    )

    return {
        "message": "Report submitted. Thank you for helping keep the community safe.",
        "auto_hidden": auto_hidden,
    }


@router.get("/reported", response_model=list[ReportedPostResponse])
async def get_reported_posts(
    admin_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    """Admin only: get posts with 1+ reports, sorted by report count."""
    report_events_result = await session.execute(
        select(Event).where(Event.event_name == "community_report")
    )
    report_events = report_events_result.scalars().all()

    # Group report reasons by post_id
    reports_by_post: dict[int, list[str]] = defaultdict(list)
    for event in report_events:
        if event.properties and "post_id" in event.properties:
            pid = event.properties["post_id"]
            reason = event.properties.get("reason", "No reason given")
            reports_by_post[pid].append(reason)

    if not reports_by_post:
        return []

    # Fetch the actual posts
    post_ids = list(reports_by_post.keys())
    posts_result = await session.execute(
        select(CommunityPost).where(CommunityPost.id.in_(post_ids))
    )
    posts_by_id = {p.id: p for p in posts_result.scalars().all()}

    # Build response sorted by report count descending
    reported_posts = []
    for pid in sorted(
        reports_by_post, key=lambda x: len(reports_by_post[x]), reverse=True
    ):
        post = posts_by_id.get(pid)
        if post is None:
            continue  # Post was already deleted
        reported_posts.append(
            ReportedPostResponse(
                post=_serialize_post(post),
                report_count=len(reports_by_post[pid]),
                report_reasons=reports_by_post[pid],
            )
        )

    return reported_posts


@router.delete("/admin/{post_id}")
async def admin_delete_post(
    post_id: int,
    admin_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    """Admin only: permanently delete a community post."""
    post = await _fetch_post_or_404(session, post_id)

    # Delete associated likes
    await session.execute(
        delete(CommunityLike).where(CommunityLike.post_id == post_id)
    )

    await session.delete(post)
    await session.flush()

    logger.info(
        "Admin deleted community post: admin_id=%d post_id=%d",
        admin_user["id"],
        post_id,
    )

    return {"message": f"Post {post_id} permanently deleted."}
