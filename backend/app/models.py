"""
Lumiqe — SQLAlchemy 2.0 ORM Models.

Defines the User and Product tables, including the pgvector
color_embedding column for vector similarity search.
"""

from datetime import datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
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
    free_scans_left: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    season: Mapped[str | None] = mapped_column(String(50), nullable=True)
    palette: Mapped[list | None] = mapped_column(JSON, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        """Serialize to a safe dictionary (no password_hash exposed)."""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "password_hash": self.password_hash,
            "free_scans_left": self.free_scans_left,
            "is_admin": self.is_admin,
            "is_premium": self.is_premium,
            "stripe_customer_id": self.stripe_customer_id,
            "season": self.season,
            "palette": self.palette,
            "stripe_subscription_id": self.stripe_subscription_id,
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
