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
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
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
        """Serialize to a safe dictionary — never exposes password_hash or Stripe IDs."""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "free_scans_left": self.free_scans_left,
            "is_admin": self.is_admin,
            "is_premium": self.is_premium,
            "email_verified": self.email_verified,
            "credits": self.credits,
            "referral_code": self.referral_code,
            "referral_count": self.referral_count,
            "trial_ends_at": self.trial_ends_at.isoformat() if self.trial_ends_at else None,
            "season": self.season,
            "palette": self.palette,
            "body_shape": self.body_shape,
            "style_personality": self.style_personality,
            "quiz_completed_at": self.quiz_completed_at.isoformat() if self.quiz_completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def to_admin_dict(self) -> dict:
        """Serialize with Stripe IDs — only for admin views."""
        d = self.to_dict()
        d["stripe_customer_id"] = self.stripe_customer_id
        d["stripe_subscription_id"] = self.stripe_subscription_id
        return d

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


class WishlistItem(Base):
    """User's wishlisted product."""

    __tablename__ = "wishlist_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_brand: Mapped[str] = mapped_column(String(255), nullable=False)
    product_price: Mapped[str] = mapped_column(String(50), nullable=False)
    product_image: Mapped[str] = mapped_column(String(512), nullable=False)
    product_url: Mapped[str] = mapped_column(String(512), nullable=False)
    match_score: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        """Serialize to dictionary for API responses."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "product_id": self.product_id,
            "product_name": self.product_name,
            "product_brand": self.product_brand,
            "product_price": self.product_price,
            "product_image": self.product_image,
            "product_url": self.product_url,
            "match_score": self.match_score,
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
    gender: Mapped[str] = mapped_column(String(20), nullable=False, default="unisex", server_default="unisex", index=True)
    vibe: Mapped[str] = mapped_column(String(50), nullable=False, default="Casual", server_default="Casual", index=True)
    tier: Mapped[str] = mapped_column(String(20), nullable=False, default="free", server_default="free")
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="manual", server_default="manual")
    source_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", index=True)
    match_score: Mapped[int] = mapped_column(Integer, default=0)
    price_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="INR", server_default="INR")
    is_sponsored: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    sponsor_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    color_hex: Mapped[str | None] = mapped_column(String(7), nullable=True)
    color_embedding = mapped_column(Vector(3), nullable=True)

    def to_dict(self) -> dict:
        """Serialize to the JSON format expected by the frontend."""
        return {
            "id": self.id,
            "name": self.name,
            "brand": self.brand,
            "price": self.price,
            "image": self.image,
            "url": self.url,
            "category": self.category,
            "season": self.season,
            "gender": self.gender,
            "vibe": self.vibe,
            "tier": self.tier,
            "is_active": self.is_active,
            "is_sponsored": self.is_sponsored,
            "sponsor_label": self.sponsor_label,
            "match_score": self.match_score,
            "color_hex": self.color_hex,
            "price_cents": self.price_cents,
            "currency": self.currency,
            "image_url": self.image,      # Frontend compat
            "purchase_link": self.url,    # Frontend compat
        }


class APIKey(Base):
    """B2B API key for metered partner access."""

    __tablename__ = "api_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    total_calls: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    created_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "key_hash": self.key_hash[:12] + "...",
            "is_active": self.is_active,
            "total_calls": self.total_calls,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CreatorProfile(Base):
    """Influencer/creator profile with tracking and earnings."""

    __tablename__ = "creator_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    tracking_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    clicks: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    signups: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    conversions: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    earnings_cents: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "tracking_code": self.tracking_code,
            "display_name": self.display_name,
            "clicks": self.clicks,
            "signups": self.signups,
            "conversions": self.conversions,
            "earnings_cents": self.earnings_cents,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PriceAlert(Base):
    """Price drop alert for a product."""

    __tablename__ = "price_alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[str] = mapped_column(String(255), nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_url: Mapped[str] = mapped_column(String(512), nullable=False)
    original_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    target_drop_percent: Mapped[int] = mapped_column(Integer, default=15, server_default="15")
    is_triggered: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "product_id": self.product_id,
            "product_name": self.product_name,
            "product_url": self.product_url,
            "original_price_cents": self.original_price_cents,
            "target_drop_percent": self.target_drop_percent,
            "is_triggered": self.is_triggered,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CommunityPost(Base):
    """User-submitted outfit post in the community gallery."""

    __tablename__ = "community_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    image_url: Mapped[str] = mapped_column(String(512), nullable=False)
    caption: Mapped[str] = mapped_column(String(500), nullable=False)
    season_tag: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    likes_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "image_url": self.image_url,
            "caption": self.caption,
            "season_tag": self.season_tag,
            "likes_count": self.likes_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class WardrobeItem(Base):
    """Item in a user's virtual wardrobe."""

    __tablename__ = "wardrobe_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    color_hex: Mapped[str | None] = mapped_column(String(7), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "category": self.category,
            "color_hex": self.color_hex,
            "image_url": self.image_url,
            "brand": self.brand,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class SavedOutfit(Base):
    """User's saved outfit combination."""

    __tablename__ = "saved_outfits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    items: Mapped[list] = mapped_column(JSON, nullable=False)
    occasion: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "items": self.items,
            "occasion": self.occasion,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CommunityLike(Base):
    """Tracks which users liked which community posts (prevents double-likes)."""

    __tablename__ = "community_likes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    post_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
