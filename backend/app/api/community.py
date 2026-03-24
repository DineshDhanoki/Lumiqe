"""API — Season-tagged outfit gallery with community feed, likes, and moderation."""

import logging
import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_admin
from app.core.rate_limiter import check_rate_limit, get_rate_limit_key
from app.models import CommunityPost, CommunityLike, Event

logger = logging.getLogger("lumiqe.api.community")
router = APIRouter(prefix="/api/community", tags=["Community"])


# ─── Profanity Filter ────────────────────────────────────────

BLOCKED_WORDS: set[str] = {
    "ass",
    "asshole",
    "bastard",
    "bitch",
    "bullshit",
    "cock",
    "crap",
    "cunt",
    "damn",
    "dick",
    "fuck",
    "fucker",
    "fucking",
    "hell",
    "motherfucker",
    "nigger",
    "piss",
    "pussy",
    "shit",
    "slut",
    "whore",
}


def _contains_blocked_words(text: str) -> bool:
    """Check if text contains any blocked words (case-insensitive, whole word)."""
    words = text.lower().split()
    stripped_words = [w.strip(".,!?;:'\"()-") for w in words]
    return bool(BLOCKED_WORDS.intersection(stripped_words))


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


class CreatePostRequest(BaseModel):
    """Request to create a community post."""

    image_url: str = Field(..., min_length=1, max_length=512)
    caption: str = Field(..., min_length=1, max_length=500)
    season_tag: str = Field(..., min_length=1, max_length=50)


class PostResponse(BaseModel):
    """Serialized community post."""

    id: int
    user_id: int
    image_url: str
    caption: str
    season_tag: str
    likes_count: int
    created_at: str | None


class FeedResponse(BaseModel):
    """Paginated feed of community posts."""

    posts: list[PostResponse]
    page: int
    limit: int
    total: int


class ReportRequest(BaseModel):
    """Reason for reporting a community post."""

    reason: str = Field(..., min_length=1, max_length=500)


class ReportedPostResponse(BaseModel):
    """A reported post with report details."""

    post: PostResponse
    report_count: int
    report_reasons: list[str]


# ─── Endpoints ───────────────────────────────────────────────


@router.get("/feed", response_model=FeedResponse)
async def get_feed(
    season: str | None = Query(default=None, description="Filter by season tag"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
):
    """Paginated community feed, optionally filterable by season."""
    query = select(CommunityPost)
    count_query = select(func.count(CommunityPost.id))

    if season:
        query = query.where(CommunityPost.season_tag == season)
        count_query = count_query.where(CommunityPost.season_tag == season)

    # Get total count
    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated posts
    offset = (page - 1) * limit
    query = query.order_by(CommunityPost.created_at.desc()).offset(offset).limit(limit)
    result = await session.execute(query)
    posts = result.scalars().all()

    return FeedResponse(
        posts=[
            PostResponse(
                id=p.id,
                user_id=p.user_id,
                image_url=p.image_url,
                caption=p.caption,
                season_tag=p.season_tag,
                likes_count=p.likes_count,
                created_at=p.created_at.isoformat() if p.created_at else None,
            )
            for p in posts
        ],
        page=page,
        limit=limit,
        total=total,
    )


@router.post("", response_model=PostResponse, status_code=201)
async def create_post(
    request: Request,
    body: CreatePostRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Create a new community post. Auth required. Content is filtered."""
    rate_key = get_rate_limit_key(request, current_user, "community_post")
    await check_rate_limit(rate_key, max_requests=10, window_seconds=3600)

    # Content filter: check caption for blocked words
    if _contains_blocked_words(body.caption):
        raise HTTPException(
            status_code=422,
            detail={
                "error": "CONTENT_VIOLATION",
                "detail": "Content violates community guidelines",
                "code": 422,
            },
        )

    post = CommunityPost(
        user_id=current_user["id"],
        image_url=body.image_url,
        caption=body.caption,
        season_tag=body.season_tag,
    )
    session.add(post)
    await session.flush()

    logger.info(
        "Community post created: user_id=%d season=%s post_id=%d",
        current_user["id"],
        body.season_tag,
        post.id,
    )

    return PostResponse(
        id=post.id,
        user_id=post.user_id,
        image_url=post.image_url,
        caption=post.caption,
        season_tag=post.season_tag,
        likes_count=post.likes_count,
        created_at=post.created_at.isoformat() if post.created_at else None,
    )


@router.post("/{post_id}/like")
async def toggle_like(
    post_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Toggle like on a community post. Auth required."""
    # Verify post exists
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

    # Check if already liked
    like_result = await session.execute(
        select(CommunityLike).where(
            CommunityLike.user_id == current_user["id"],
            CommunityLike.post_id == post_id,
        )
    )
    existing_like = like_result.scalar_one_or_none()

    if existing_like:
        # Unlike
        await session.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
        action = "unliked"
    else:
        # Like
        like = CommunityLike(
            user_id=current_user["id"],
            post_id=post_id,
        )
        session.add(like)
        post.likes_count += 1
        action = "liked"

    logger.info(
        "Community post %s: user_id=%d post_id=%d",
        action,
        current_user["id"],
        post_id,
    )

    return {
        "action": action,
        "likes_count": post.likes_count,
    }


@router.get("/my-season", response_model=list[PostResponse])
async def get_my_season_posts(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get community posts matching the authenticated user's season."""
    user_season = current_user.get("season")
    if not user_season:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "NO_SEASON",
                "detail": "Complete a color analysis first to see season-matched posts.",
                "code": 400,
            },
        )

    result = await session.execute(
        select(CommunityPost)
        .where(CommunityPost.season_tag == user_season)
        .order_by(CommunityPost.created_at.desc())
        .limit(50)
    )
    posts = result.scalars().all()

    return [
        PostResponse(
            id=p.id,
            user_id=p.user_id,
            image_url=p.image_url,
            caption=p.caption,
            season_tag=p.season_tag,
            likes_count=p.likes_count,
            created_at=p.created_at.isoformat() if p.created_at else None,
        )
        for p in posts
    ]


# ─── Moderation Endpoints ────────────────────────────────────


@router.post("/{post_id}/report")
async def report_post(
    post_id: int,
    body: ReportRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Report a community post. Rate limited to 5 reports per hour per user."""
    _check_report_rate_limit(current_user["id"])

    # Verify post exists
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

    # Count total reports for this post
    all_reports_result = await session.execute(
        select(Event).where(Event.event_name == "community_report")
    )
    all_reports = all_reports_result.scalars().all()
    report_count = sum(
        1
        for r in all_reports
        if r.properties and r.properties.get("post_id") == post_id
    )

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
    # Get all report events
    report_events_result = await session.execute(
        select(Event).where(Event.event_name == "community_report")
    )
    report_events = report_events_result.scalars().all()

    # Group by post_id
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
                post=PostResponse(
                    id=post.id,
                    user_id=post.user_id,
                    image_url=post.image_url,
                    caption=post.caption,
                    season_tag=post.season_tag,
                    likes_count=post.likes_count,
                    created_at=(
                        post.created_at.isoformat() if post.created_at else None
                    ),
                ),
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
