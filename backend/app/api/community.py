"""API — Season-tagged outfit gallery with community feed and likes."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.core.rate_limiter import check_rate_limit, get_rate_limit_key
from app.models import CommunityPost, CommunityLike

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



# ─── Helper Functions ────────────────────────────────────────


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
        posts=[_serialize_post(p) for p in posts],
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

    return _serialize_post(post)


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
        await session.flush()
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

    return [_serialize_post(p) for p in posts]
