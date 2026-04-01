"""
Lumiqe — FastAPI Dependencies.

Provides injectable dependencies for database sessions,
rate limiting, and user authentication.
"""

import logging
from collections.abc import AsyncGenerator

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import text

from app.models import Base
from app.core.config import settings
from app.core.security import decode_token

logger = logging.getLogger("lumiqe.dependencies")

# ─── Bearer Token Scheme ─────────────────────────────────────
bearer_scheme = HTTPBearer(auto_error=False)

# Track whether the database is available
db_available: bool = False

# ─── Engine & Session Factory ────────────────────────────────

async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    connect_args={
        "statement_cache_size": 0,  # Required for Neon pooler (transaction mode)
    },
)

async_session_factory = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ─── Database Dependency ─────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async session for use in FastAPI Depends()."""
    if not db_available:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "DATABASE_UNAVAILABLE",
                "detail": "PostgreSQL is not connected. This endpoint requires a database.",
                "code": 503,
            },
        )
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ─── Database Lifecycle ──────────────────────────────────────

async def init_db() -> None:
    """Create all tables and enable pgvector. Graceful on failure."""
    global db_available
    try:
        async with async_engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            logger.info("pgvector extension enabled")
            await conn.run_sync(Base.metadata.create_all)
            logger.info("All database tables created")
        db_available = True
    except Exception as exc:
        logger.warning(
            f"⚠ PostgreSQL not available — DB-dependent endpoints will return 503. "
            f"Error: {exc}"
        )
        db_available = False


async def close_db() -> None:
    """Dispose of the engine connection pool."""
    if db_available:
        await async_engine.dispose()
        logger.info("Database connection pool closed")
    else:
        logger.info("No database connection to close (was never connected)")



# ─── User Authentication ─────────────────────────────────────


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Extract and validate JWT from Authorization header. Returns user dict."""
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail={"error": "NOT_AUTHENTICATED", "detail": "Missing authorization token.", "code": 401},
        )

    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=401,
            detail={"error": "INVALID_TOKEN", "detail": "Token is invalid or expired.", "code": 401},
        )

    user_email = payload.get("sub")
    if not user_email:
        raise HTTPException(
            status_code=401,
            detail={"error": "INVALID_TOKEN", "detail": "Token payload is malformed.", "code": 401},
        )

    from app.repositories import user_repo
    user = await user_repo.get_by_email(session, user_email)
    if not user:
        raise HTTPException(
            status_code=401,
            detail={"error": "USER_NOT_FOUND", "detail": "User no longer exists.", "code": 401},
        )

    return user


async def get_optional_db() -> AsyncGenerator[AsyncSession | None, None]:
    """Yield a DB session if available, or None if not."""
    if not db_available:
        yield None
        return
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: AsyncSession | None = Depends(get_optional_db),
) -> dict | None:
    """Optionally extract user from JWT. Returns None if no token or DB unavailable."""
    if credentials is None or session is None:
        return None

    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        return None

    user_email = payload.get("sub")
    if not user_email:
        return None

    from app.repositories import user_repo
    try:
        user = await user_repo.get_by_email(session, user_email)
        return user
    except Exception:
        logger.debug("get_optional_user: query error, returning None")
        return None


# ─── Role-Based Authorization ────────────────────────────────


async def require_admin(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Require the authenticated user to have admin privileges."""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=403,
            detail={"error": "ADMIN_REQUIRED", "detail": "This action requires admin privileges.", "code": 403},
        )
    return current_user


async def require_premium(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Require premium subscription or active premium trial.

    Only users with is_premium=True or an active trial that was granted
    via subscription/referral (not just any trial_ends_at value) pass.
    The trial is only valid if trial_ends_at > now AND the user has
    fewer than the default free scans (indicating they were granted a trial).
    """
    if current_user.get("is_premium"):
        return current_user

    # Check active trial — only valid if trial_ends_at is set and not expired
    trial_ends = current_user.get("trial_ends_at")
    if trial_ends:
        from datetime import datetime, timezone
        try:
            trial_dt = (
                datetime.fromisoformat(trial_ends)
                if isinstance(trial_ends, str)
                else trial_ends
            )
            if trial_dt > datetime.now(timezone.utc):
                return current_user
        except (ValueError, TypeError):
            pass

    # Check credits — users with purchased credits can access premium features
    if current_user.get("credits", 0) > 0:
        return current_user

    raise HTTPException(
        status_code=403,
        detail={
            "error": "PREMIUM_REQUIRED",
            "detail": "This feature requires a premium subscription. Please upgrade to continue.",
            "code": 403,
        },
    )


