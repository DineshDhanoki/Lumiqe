"""Add wishlist_items table.

Revision ID: k1l2m3n4o5p6
Revises: j0k1l2m3n4o5
Create Date: 2026-03-24 10:02:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "k1l2m3n4o5p6"
down_revision: Union[str, Sequence[str], None] = "j0k1l2m3n4o5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the wishlist_items table."""
    op.create_table(
        "wishlist_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("product_id", sa.String(50), nullable=False, index=True),
        sa.Column("product_name", sa.String(255), nullable=False),
        sa.Column("product_brand", sa.String(255), nullable=False),
        sa.Column("product_price", sa.String(50), nullable=False),
        sa.Column("product_image", sa.String(512), nullable=False),
        sa.Column("product_url", sa.String(512), nullable=False),
        sa.Column("match_score", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("wishlist_items")
