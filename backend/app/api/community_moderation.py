"""API — Community moderation: reporting, admin review, and admin deletion."""

import logging
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, delete, func, Integer, cast, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_admin
from app.core.rate_limiter import check_rate_limit
from app.models import CommunityPost, CommunityLike, Event
from app.api.community import PostResponse

logger = logging.getLogger("lumiqe.api.community_moderation")
router = APIRouter(prefix="/api/community", tags=["Community Moderation"])


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
    result = await session.execute(
        select(func.count()).select_from(Event).where(
            Event.event_name == "community_report",
            cast(Event.properties["post_id"].astext, Integer) == post_id,
        )
    )
    return result.scalar_one()


# ─── Endpoints ───────────────────────────────────────────────


@router.post("/{post_id}/report")
async def report_post(
    post_id: int,
    body: ReportRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Report a community post. Rate limited to 5 reports per hour per user."""
    await check_rate_limit(f"report:{current_user['id']}", max_requests=5, window_seconds=3600)

    post = await _fetch_post_or_404(session, post_id)

    # Check if user already reported this specific post (single targeted query)
    already_reported_result = await session.execute(
        select(func.count()).select_from(Event).where(
            Event.event_name == "community_report",
            Event.user_id == current_user["id"],
            cast(Event.properties["post_id"].astext, Integer) == post_id,
        )
    )
    if already_reported_result.scalar_one() > 0:
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
    # Use a single SQL query to group and count reports — no full-table scan into memory
    grouped_result = await session.execute(
        select(
            cast(Event.properties["post_id"].astext, Integer).label("post_id"),
            func.count(Event.id).label("report_count"),
        )
        .where(Event.event_name == "community_report")
        .group_by(text("post_id"))
        .order_by(text("report_count DESC"))
    )
    rows = grouped_result.all()

    if not rows:
        return []

    # Fetch reasons for each reported post (separate targeted queries)
    post_ids = [row.post_id for row in rows]
    posts_result = await session.execute(
        select(CommunityPost).where(CommunityPost.id.in_(post_ids))
    )
    posts_by_id = {p.id: p for p in posts_result.scalars().all()}

    # Fetch reasons grouped in Python (only for posts that still exist)
    reasons_result = await session.execute(
        select(
            cast(Event.properties["post_id"].astext, Integer).label("post_id"),
            Event.properties["reason"].astext.label("reason"),
        ).where(
            Event.event_name == "community_report",
            cast(Event.properties["post_id"].astext, Integer).in_(post_ids),
        )
    )
    reasons_by_post: dict[int, list[str]] = defaultdict(list)
    for r in reasons_result.all():
        reasons_by_post[r.post_id].append(r.reason or "No reason given")

    reported_posts = []
    for row in rows:
        post = posts_by_id.get(row.post_id)
        if post is None:
            continue  # Post was already deleted
        reported_posts.append(
            ReportedPostResponse(
                post=_serialize_post(post),
                report_count=row.report_count,
                report_reasons=reasons_by_post.get(row.post_id, []),
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
