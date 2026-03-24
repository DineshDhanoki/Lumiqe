"""Add product indexes and columns.

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-03-24 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "i9j0k1l2m3n4"
down_revision: Union[str, Sequence[str], None] = "h8i9j0k1l2m3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add price_cents, currency, is_sponsored, sponsor_label columns and indexes."""
    op.add_column("products", sa.Column("price_cents", sa.Integer(), nullable=True))
    op.add_column(
        "products",
        sa.Column("currency", sa.String(3), nullable=False, server_default="INR"),
    )
    op.add_column(
        "products",
        sa.Column("is_sponsored", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "products",
        sa.Column("sponsor_label", sa.String(100), nullable=True),
    )
    op.create_index("ix_products_gender", "products", ["gender"])
    op.create_index("ix_products_vibe", "products", ["vibe"])
    op.create_index("ix_products_is_active", "products", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_products_is_active", "products")
    op.drop_index("ix_products_vibe", "products")
    op.drop_index("ix_products_gender", "products")
    op.drop_column("products", "sponsor_label")
    op.drop_column("products", "is_sponsored")
    op.drop_column("products", "currency")
    op.drop_column("products", "price_cents")
