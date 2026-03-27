"""API — Password reset and email verification endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.core.token_utils import generate_token, validate_token
from app.core.security import hash_password
from app.core.rate_limiter import check_rate_limit
from app.repositories import user_repo

logger = logging.getLogger("lumiqe.api.password_reset")
router = APIRouter(prefix="/api/auth", tags=["Password Reset"])


# ─── Request Models ─────────────────────────────────────────


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., max_length=256)
    new_password: str


class SendVerificationRequest(BaseModel):
    email: EmailStr


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., max_length=256)


# ─── Email Senders (lazy imports to avoid circular deps) ────


def send_password_reset_email(to: str, token: str) -> bool:
    """Send a password reset email with the reset link."""
    from app.core.config import settings

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    from app.services.email import _send, _BASE_STYLE, _FOOTER
    html = f"""<!DOCTYPE html><html><head>{_BASE_STYLE}</head><body>
    <div class="container">
        <div class="header">
            <div class="logo">LUMI<span class="accent">QE</span></div>
        </div>
        <div class="card">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to choose a new one.</p>
            <p>This link expires in 30 minutes.</p>
            <div style="text-align: center; margin-top: 24px;">
                <a href="{reset_url}" class="btn">Reset Password</a>
            </div>
            <p style="margin-top: 24px; font-size: 13px; color: #71717a;">
                If you didn't request this, you can safely ignore this email.
            </p>
        </div>
        {_FOOTER}
    </div>
    </body></html>"""
    return _send(to, "Reset Your Lumiqe Password", html)


def send_email_verification(to: str, token: str) -> bool:
    """Send an email verification link."""
    from app.core.config import settings

    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    from app.services.email import _send, _BASE_STYLE, _FOOTER
    html = f"""<!DOCTYPE html><html><head>{_BASE_STYLE}</head><body>
    <div class="container">
        <div class="header">
            <div class="logo">LUMI<span class="accent">QE</span></div>
        </div>
        <div class="card">
            <h2>Verify Your Email</h2>
            <p>Please verify your email address by clicking the button below.</p>
            <p>This link expires in 30 minutes.</p>
            <div style="text-align: center; margin-top: 24px;">
                <a href="{verify_url}" class="btn">Verify Email</a>
            </div>
        </div>
        {_FOOTER}
    </div>
    </body></html>"""
    return _send(to, "Verify Your Lumiqe Email", html)


# ─── Endpoints ──────────────────────────────────────────────


@router.post("/forgot-password")
async def forgot_password(
    body: ForgotPasswordRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    """
    Initiate a password reset flow.

    Anti-enumeration: always returns 200 regardless of whether
    the email exists. This prevents attackers from probing for
    registered accounts.
    """
    client_ip = request.client.host if request.client else "unknown"

    # Rate limit: 5 requests per 15 minutes per email
    rate_key = f"forgot_password:email:{body.email.lower()}"
    await check_rate_limit(rate_key, max_requests=5, window_seconds=900)

    user = await user_repo.get_by_email(session, body.email)
    if user:
        token = await generate_token(body.email, "password_reset")
        send_password_reset_email(body.email.lower(), token)
        logger.info(
            f"[SECURITY] Password reset requested for {body.email} ip={client_ip}"
        )
    else:
        # Log but don't reveal to the caller
        logger.info(
            f"[SECURITY] Password reset for non-existent email {body.email} ip={client_ip}"
        )

    # Always return success (anti-enumeration)
    return {
        "message": "If an account exists with this email, a password reset link has been sent."
    }


@router.post("/reset-password")
async def reset_password(
    body: ResetPasswordRequest,
    session: AsyncSession = Depends(get_db),
):
    """
    Complete the password reset by validating the token and setting
    a new password.
    """
    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "WEAK_PASSWORD",
                "detail": "Password must be at least 8 characters long.",
                "code": 422,
            },
        )

    email = await validate_token(body.token, "password_reset")
    if not email:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_TOKEN",
                "detail": "Reset token is invalid or has expired. Please request a new one.",
                "code": 400,
            },
        )

    # Verify user still exists
    user = await user_repo.get_by_email(session, email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "USER_NOT_FOUND",
                "detail": "Account not found.",
                "code": 404,
            },
        )

    # Update password
    new_hash = hash_password(body.new_password)
    from sqlalchemy import update
    from app.models import User

    await session.execute(
        update(User)
        .where(User.email == email)
        .values(password_hash=new_hash)
    )

    logger.info(f"[SECURITY] Password reset completed for {email}")
    return {"message": "Password has been reset successfully. You can now log in."}


@router.post("/send-verification")
async def send_verification_email(
    body: SendVerificationRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Send a verification email to the authenticated user.

    Rate limited: 3 requests per 15 minutes.
    """
    client_ip = request.client.host if request.client else "unknown"

    # Rate limit: 3 requests per 15 minutes per user
    rate_key = f"email_verify:user:{current_user['id']}"
    await check_rate_limit(rate_key, max_requests=3, window_seconds=900)

    # Ensure the requested email matches the authenticated user
    if body.email.lower() != current_user["email"].lower():
        raise HTTPException(
            status_code=400,
            detail={
                "error": "EMAIL_MISMATCH",
                "detail": "Email does not match your account.",
                "code": 400,
            },
        )

    token = await generate_token(body.email, "email_verify")
    send_email_verification(body.email.lower(), token)

    logger.info(
        f"[SECURITY] Verification email sent to {body.email} ip={client_ip}"
    )

    return {"message": "Verification email sent. Check your inbox."}


@router.post("/verify-email")
async def verify_email(
    body: VerifyEmailRequest,
    session: AsyncSession = Depends(get_db),
):
    """
    Verify a user's email address using the token from the verification email.
    """
    email = await validate_token(body.token, "email_verify")
    if not email:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_TOKEN",
                "detail": "Verification token is invalid or has expired. Please request a new one.",
                "code": 400,
            },
        )

    # Verify user exists
    user = await user_repo.get_by_email(session, email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "USER_NOT_FOUND",
                "detail": "Account not found.",
                "code": 404,
            },
        )

    await user_repo.verify_email(session, user["id"])

    logger.info(f"[SECURITY] Email verified for {email}")
    return {"message": "Email verified successfully."}
