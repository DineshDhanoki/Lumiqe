"""add_analysis_results_table

Revision ID: d4e5f6g7h8i9
Revises: c53073369b71
Create Date: 2026-03-20 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d4e5f6g7h8i9"
down_revision: Union[str, Sequence[str], None] = "c53073369b71"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the analysis_results table."""
    op.create_table(
        "analysis_results",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("share_token", sa.String(10), nullable=False, unique=True, index=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("season", sa.String(50), nullable=False),
        sa.Column("hex_color", sa.String(7), nullable=False),
        sa.Column("undertone", sa.String(20), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("contrast_level", sa.String(20), nullable=False, server_default=""),
        sa.Column("palette", sa.JSON(), nullable=False),
        sa.Column("avoid_colors", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("metal", sa.String(20), nullable=False, server_default=""),
        sa.Column("full_result", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Drop the analysis_results table."""
    op.drop_table("analysis_results")
