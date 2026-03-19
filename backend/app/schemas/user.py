"""Pydantic schemas for user-related requests and responses."""

import re

from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 100:
            raise ValueError("Name must be 1-100 characters")
        if not re.match(r"^[a-zA-Z0-9\s\-'.]+$", v):
            raise ValueError("Name may only contain letters, numbers, spaces, hyphens, apostrophes, and periods")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 128:
            raise ValueError("Password must not exceed 128 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    free_scans_left: int
    is_premium: bool = False


class ProfileResponse(BaseModel):
    """Full user profile for the account dashboard."""
    id: int
    name: str
    email: str
    is_premium: bool = False
    free_scans_left: int = 0
    season: str | None = None
    palette: list | None = None
    stripe_subscription_id: str | None = None
    created_at: str | None = None


class AuthResponse(BaseModel):
    """Login/register response with JWT tokens."""
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class GoogleAuthRequest(BaseModel):
    """Google OAuth sign-in request — no password required."""
    name: str
    email: EmailStr


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
