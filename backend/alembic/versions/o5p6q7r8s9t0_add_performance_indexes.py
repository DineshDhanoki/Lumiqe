"""Add performance indexes for scaling.

Adds indexes on:
- products.color_embedding (ivfflat for pgvector cosine distance)
- analysis_results.created_at (query history pages)
- users.stripe_customer_id (webhook lookups)
- products compound (season, gender, vibe, is_active) for filtered queries

Revision ID: o5p6q7r8s9t0
Revises: n4o5p6q7r8s9
Create Date: 2026-03-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "o5p6q7r8s9t0"
down_revision: Union[str, None] = "n4o5p6q7r8s9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # pgvector IVFFlat index for cosine similarity search on color_embedding
    # Uses raw SQL because Alembic doesn't natively support pgvector index types.
    # Lists=100 is appropriate for up to ~100k products; increase for larger catalogs.
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_products_color_embedding
        ON products
        USING ivfflat (color_embedding vector_cosine_ops)
        WITH (lists = 100);
        """
    )

    # Index on analysis_results.created_at for history queries sorted by date
    op.create_index(
        "ix_analysis_results_created_at",
        "analysis_results",
        ["created_at"],
    )

    # Index on users.stripe_customer_id for webhook customer lookups
    op.create_index(
        "ix_users_stripe_customer_id",
        "users",
        ["stripe_customer_id"],
    )

    # Compound index on products for the most common filtered query pattern
    op.create_index(
        "ix_products_season_gender_vibe_active",
        "products",
        ["season", "gender", "vibe", "is_active"],
    )


def downgrade() -> None:
    op.drop_index("ix_products_season_gender_vibe_active", table_name="products")
    op.drop_index("ix_users_stripe_customer_id", table_name="users")
    op.drop_index("ix_analysis_results_created_at", table_name="analysis_results")
    op.execute("DROP INDEX IF EXISTS ix_products_color_embedding;")
