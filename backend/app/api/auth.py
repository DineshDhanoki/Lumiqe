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
from app.core.config import settings
from app.core.dependencies import get_db, get_current_user
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.rate_limiter import check_rate_limit
from app.services.email import send_welcome_email, send_email_verification
from app.core.token_utils import (
    generate_token,
    store_refresh_token,
    is_refresh_token_valid,
    revoke_refresh_token,
)

logger = logging.getLogger("lumiqe.api.auth")
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


async def _build_tokens(user: dict) -> dict:
    """Build access + refresh tokens for a user and store the refresh JTI."""
    token_data = {"sub": user["email"], "user_id": user["id"]}
    access_token = create_access_token(token_data)
    refresh_token_str = create_refresh_token(token_data)

    # Decode the refresh token to extract the JTI and store it
    refresh_payload = decode_token(refresh_token_str)
    if refresh_payload and refresh_payload.get("jti"):
        await store_refresh_token(user["id"], refresh_payload["jti"])

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
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
    tokens = await _build_tokens(new_user)
    logger.info(f"[SECURITY] User registered: {user.email} ip={client_ip} req={request_id}")

    # Fire-and-forget welcome email
    import asyncio
    asyncio.get_running_loop().call_soon(send_welcome_email, user.email, user.name)

    # Send email verification
    verify_token = await generate_token(user.email, "email_verify")
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verify_token}"
    send_email_verification(user.email, user.name, verify_url)

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

    user = await user_repo.get_by_email_for_auth(session, credentials.email)
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

    tokens = await _build_tokens(user)
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

    # Verify the Google ID token with Google's tokeninfo endpoint
    import aiohttp
    try:
        async with aiohttp.ClientSession() as http:
            async with http.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={body.google_id_token}"
            ) as resp:
                if resp.status != 200:
                    raise HTTPException(
                        status_code=401,
                        detail={"error": "INVALID_GOOGLE_TOKEN", "detail": "Google token verification failed.", "code": 401},
                    )
                token_data = await resp.json()
    except aiohttp.ClientError as exc:
        logger.warning(f"[SECURITY] Google token verification network error: {exc}")
        raise HTTPException(
            status_code=503,
            detail={"error": "GOOGLE_VERIFY_FAILED", "detail": "Could not reach Google to verify token.", "code": 503},
        )

    # Verify email matches
    if token_data.get("email") != body.email:
        logger.warning(f"[SECURITY] Google token email mismatch: claimed={body.email} actual={token_data.get('email')} ip={client_ip}")
        raise HTTPException(
            status_code=401,
            detail={"error": "INVALID_GOOGLE_TOKEN", "detail": "Token email does not match.", "code": 401},
        )

    # REQUIRE GOOGLE_CLIENT_ID to be configured for Google OAuth
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail={"error": "GOOGLE_NOT_CONFIGURED", "detail": "Google OAuth is not configured on this server.", "code": 503},
        )

    # Verify token audience matches our Google Client ID
    if token_data.get("aud") != settings.GOOGLE_CLIENT_ID:
        logger.warning(f"[SECURITY] Google token audience mismatch ip={client_ip}")
        raise HTTPException(
            status_code=401,
            detail={"error": "INVALID_GOOGLE_TOKEN", "detail": "Token audience mismatch.", "code": 401},
        )

    user = await user_repo.get_by_email(session, body.email)
    if not user:
        # Auto-register Google user (no password_hash)
        user = await user_repo.create(session, body.name, body.email, password_hash=None)
        logger.info(f"[SECURITY] Google user registered: {body.email} ip={client_ip} req={request_id}")
        import asyncio
        asyncio.get_running_loop().call_soon(send_welcome_email, body.email, body.name)
    else:
        logger.info(f"[SECURITY] Google login: {body.email} ip={client_ip} req={request_id}")

    tokens = await _build_tokens(user)
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
    user_id = payload.get("user_id")
    token_jti = payload.get("jti")
    if not user_email or not token_jti:
        raise HTTPException(
            status_code=401,
            detail={"error": "INVALID_REFRESH_TOKEN", "detail": "Token payload is malformed.", "code": 401},
        )

    # Verify the refresh token JTI is still valid (not revoked/rotated)
    if not await is_refresh_token_valid(user_id, token_jti):
        logger.warning(f"[SECURITY] Refresh token reuse detected for user_id={user_id}")
        # Revoke all refresh tokens for this user as a precaution
        await revoke_refresh_token(user_id)
        raise HTTPException(
            status_code=401,
            detail={"error": "TOKEN_REUSE", "detail": "Refresh token has been revoked.", "code": 401},
        )

    # Verify user still exists
    user = await user_repo.get_by_email(session, user_email)
    if not user:
        raise HTTPException(
            status_code=401,
            detail={"error": "USER_NOT_FOUND", "detail": "User no longer exists.", "code": 401},
        )

    # Revoke the old refresh token
    await revoke_refresh_token(user_id)

    # Issue new access + refresh tokens (rotation)
    token_data = {"sub": user["email"], "user_id": user["id"]}
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)

    # Store the new refresh token's JTI
    new_payload = decode_token(new_refresh)
    if new_payload and new_payload.get("jti"):
        await store_refresh_token(user["id"], new_payload["jti"])

    return TokenRefreshResponse(access_token=new_access, refresh_token=new_refresh)


@router.get("/me", response_model=ProfileResponse)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get the full profile of the currently authenticated user."""
    user = await user_repo.get_by_email(session, current_user["email"])
    if not user:
        raise HTTPException(status_code=404, detail={"error": "USER_NOT_FOUND", "detail": "User not found", "code": 404})
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
