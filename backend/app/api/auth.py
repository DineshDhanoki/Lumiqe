"""API — Authentication endpoints (register, login, refresh, delete)."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.user import (
    AuthResponse,
    GoogleAuthRequest,
    TokenRefreshRequest,
    TokenRefreshResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    ProfileResponse,
)
from app.repositories import user_repo
from app.core.dependencies import get_db, get_current_user
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.rate_limiter import check_rate_limit

logger = logging.getLogger("lumiqe.api.auth")
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _build_tokens(user: dict) -> dict:
    """Build access + refresh tokens for a user."""
    token_data = {"sub": user["email"], "user_id": user["id"]}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
    }


@router.post("/register", response_model=AuthResponse)
async def register(user: UserCreate, request: Request, session: AsyncSession = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    request_id = getattr(request.state, "request_id", "none")

    # Check if email already exists
    existing = await user_repo.get_by_email(session, user.email)
    if existing:
        raise HTTPException(
            status_code=400,
            detail={"error": "REGISTRATION_FAILED", "detail": "Email already registered", "code": 400},
        )

    password_hash = hash_password(user.password)
    new_user = await user_repo.create(session, user.name, user.email, password_hash)
    tokens = _build_tokens(new_user)
    logger.info(f"[SECURITY] User registered: {user.email} ip={client_ip} req={request_id}")

    return AuthResponse(
        user=UserResponse(**new_user),
        **tokens,
    )


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin, request: Request, session: AsyncSession = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    request_id = getattr(request.state, "request_id", "none")

    # ── Brute-force protection ───────────────────────────────────────────
    # Per-email rate limit: 5 attempts per 15 minutes (900 seconds).
    # Keyed to the email so changing IP doesn't bypass the limit.
    brute_force_key = f"login:email:{credentials.email.lower()}"
    await check_rate_limit(brute_force_key, max_requests=5, window_seconds=900)
    # ────────────────────────────────────────────────────────────────────

    user = await user_repo.get_by_email(session, credentials.email)
    if not user:
        logger.warning(f"[SECURITY] Failed login: {credentials.email} ip={client_ip} req={request_id}")
        raise HTTPException(
            status_code=401,
            detail={"error": "INVALID_CREDENTIALS", "detail": "Invalid email or password", "code": 401},
        )

    # Google-only users have no password — they must use Google sign-in
    if not user.get("password_hash"):
        raise HTTPException(
            status_code=401,
            detail={"error": "GOOGLE_ACCOUNT", "detail": "This account uses Google sign-in. Please use the Google button.", "code": 401},
        )

    if not verify_password(credentials.password, user["password_hash"]):
        logger.warning(f"[SECURITY] Failed login: {credentials.email} ip={client_ip} req={request_id}")
        raise HTTPException(
            status_code=401,
            detail={"error": "INVALID_CREDENTIALS", "detail": "Invalid email or password", "code": 401},
        )

    tokens = _build_tokens(user)
    logger.info(f"[SECURITY] Successful login: {user['email']} ip={client_ip} req={request_id}")

    return AuthResponse(
        user=UserResponse(**user),
        **tokens,
    )


@router.post("/google", response_model=AuthResponse)
async def google_auth(body: GoogleAuthRequest, request: Request, session: AsyncSession = Depends(get_db)):
    """Auto-register or login a Google-authenticated user (no password)."""
    client_ip = request.client.host if request.client else "unknown"
    request_id = getattr(request.state, "request_id", "none")

    user = await user_repo.get_by_email(session, body.email)
    if not user:
        # Auto-register Google user (no password_hash)
        user = await user_repo.create(session, body.name, body.email, password_hash=None)
        logger.info(f"[SECURITY] Google user registered: {body.email} ip={client_ip} req={request_id}")
    else:
        logger.info(f"[SECURITY] Google login: {body.email} ip={client_ip} req={request_id}")

    tokens = _build_tokens(user)
    return AuthResponse(
        user=UserResponse(**user),
        **tokens,
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(body: TokenRefreshRequest, session: AsyncSession = Depends(get_db)):
    """Exchange a valid refresh token for a new access token."""
    payload = decode_token(body.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=401,
            detail={"error": "INVALID_REFRESH_TOKEN", "detail": "Refresh token is invalid or expired.", "code": 401},
        )

    user_email = payload.get("sub")
    if not user_email:
        raise HTTPException(
            status_code=401,
            detail={"error": "INVALID_REFRESH_TOKEN", "detail": "Token payload is malformed.", "code": 401},
        )

    # Verify user still exists
    user = await user_repo.get_by_email(session, user_email)
    if not user:
        raise HTTPException(
            status_code=401,
            detail={"error": "USER_NOT_FOUND", "detail": "User no longer exists.", "code": 401},
        )

    new_access = create_access_token({"sub": user["email"], "user_id": user["id"]})
    return TokenRefreshResponse(access_token=new_access)


@router.get("/me", response_model=ProfileResponse)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get the full profile of the currently authenticated user."""
    user = await user_repo.get_by_email(session, current_user["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ProfileResponse(**user)


@router.delete("/me")
async def delete_account(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """GDPR: permanently delete a user account and all associated data."""
    await user_repo.delete_by_email(session, current_user["email"])
    logger.info(f"[SECURITY] Account deleted: {current_user['email']} user_id={current_user['id']}")
    return {"message": "Account and all associated data permanently deleted."}
