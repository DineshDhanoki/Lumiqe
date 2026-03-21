"""
Lumiqe — SQLAlchemy 2.0 ORM Models.

Defines the User, Product, and AnalysisResult tables, including the pgvector
color_embedding column for vector similarity search.
"""

import uuid
from datetime import datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """SQLAlchemy 2.0 declarative base for all Lumiqe models."""
    pass


class User(Base):
    """Registered user account with optional color analysis results."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    free_scans_left: Mapped[int] = mapped_column(Integer, default=3, server_default="3")
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    credits: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    referral_code: Mapped[str | None] = mapped_column(String(10), unique=True, index=True, nullable=True)
    referred_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    referral_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    season: Mapped[str | None] = mapped_column(String(50), nullable=True)
    palette: Mapped[list | None] = mapped_column(JSON, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    body_shape: Mapped[str | None] = mapped_column(String(30), nullable=True)
    style_personality: Mapped[str | None] = mapped_column(String(30), nullable=True)
    quiz_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        """Serialize to a safe dictionary — never exposes password_hash."""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "free_scans_left": self.free_scans_left,
            "is_admin": self.is_admin,
            "is_premium": self.is_premium,
            "credits": self.credits,
            "referral_code": self.referral_code,
            "referral_count": self.referral_count,
            "stripe_customer_id": self.stripe_customer_id,
            "trial_ends_at": self.trial_ends_at.isoformat() if self.trial_ends_at else None,
            "season": self.season,
            "palette": self.palette,
            "stripe_subscription_id": self.stripe_subscription_id,
            "body_shape": self.body_shape,
            "style_personality": self.style_personality,
            "quiz_completed_at": self.quiz_completed_at.isoformat() if self.quiz_completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def to_auth_dict(self) -> dict:
        """Serialize including password_hash — only for the auth login flow."""
        d = self.to_dict()
        d["password_hash"] = self.password_hash
        return d


def _generate_share_token() -> str:
    """Generate a short URL-safe share token (10 chars)."""
    return uuid.uuid4().hex[:10]


class AnalysisResult(Base):
    """Persisted color analysis result linked to a user."""

    __tablename__ = "analysis_results"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    share_token: Mapped[str] = mapped_column(
        String(10), unique=True, nullable=False, default=_generate_share_token, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    season: Mapped[str] = mapped_column(String(50), nullable=False)
    hex_color: Mapped[str] = mapped_column(String(7), nullable=False)
    undertone: Mapped[str] = mapped_column(String(20), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    contrast_level: Mapped[str] = mapped_column(String(20), nullable=False, server_default="")
    palette: Mapped[list] = mapped_column(JSON, nullable=False)
    avoid_colors: Mapped[list] = mapped_column(JSON, nullable=False, server_default="[]")
    metal: Mapped[str] = mapped_column(String(20), nullable=False, server_default="")
    full_result: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        """Serialize to a dictionary for API responses."""
        return {
            "id": self.id,
            "share_token": self.share_token,
            "user_id": self.user_id,
            "season": self.season,
            "hex_color": self.hex_color,
            "undertone": self.undertone,
            "confidence": self.confidence,
            "contrast_level": self.contrast_level,
            "palette": self.palette,
            "avoid_colors": self.avoid_colors,
            "metal": self.metal,
            "full_result": self.full_result,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Event(Base):
    """Analytics event for conversion tracking."""

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    event_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    properties: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "event_name": self.event_name,
            "properties": self.properties,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Product(Base):
    """Curated product with a pgvector color embedding for similarity search."""

    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    brand: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[str] = mapped_column(String(50), nullable=False)
    image: Mapped[str] = mapped_column(String(512), nullable=False)
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    season: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    gender: Mapped[str] = mapped_column(String(20), nullable=False, default="unisex", server_default="unisex")
    vibe: Mapped[str] = mapped_column(String(50), nullable=False, default="Casual", server_default="Casual")
    tier: Mapped[str] = mapped_column(String(20), nullable=False, default="free", server_default="free")
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="manual", server_default="manual")
    source_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    match_score: Mapped[int] = mapped_column(Integer, default=0)
    color_hex: Mapped[str | None] = mapped_column(String(7), nullable=True)
    color_embedding = mapped_column(Vector(3), nullable=True)

    def to_dict(self) -> dict:
        """Serialize to the JSON format expected by the frontend."""
        return {
            "id": self.id,
            "name": self.name,
            "brand": self.brand,
            "price": self.price,
            "image": self.image,       # Backend compat
            "image_url": self.image,   # Frontend compat
            "url": self.url,           # Backend compat
            "purchase_link": self.url, # Frontend compat
            "category": self.category,
            "season": self.season,
            "gender": self.gender,
            "vibe": self.vibe,
            "tier": self.tier,
            "is_active": self.is_active,
            "match_score": self.match_score,
            "color_hex": self.color_hex,
        }
