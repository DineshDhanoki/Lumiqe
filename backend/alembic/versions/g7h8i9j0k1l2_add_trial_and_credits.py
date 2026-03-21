"""add_trial_and_credits_to_users

Revision ID: g7h8i9j0k1l2
Revises: f6g7h8i9j0k1
Create Date: 2026-03-21 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "g7h8i9j0k1l2"
down_revision: Union[str, Sequence[str], None] = "f6g7h8i9j0k1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add trial_ends_at and credits to users, update free_scans_left default."""
    op.add_column("users", sa.Column("trial_ends_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("credits", sa.Integer(), nullable=False, server_default="0"))
    # Update default for free_scans_left from 1 to 3
    op.alter_column("users", "free_scans_left", server_default="3")


def downgrade() -> None:
    op.alter_column("users", "free_scans_left", server_default="1")
    op.drop_column("users", "credits")
    op.drop_column("users", "trial_ends_at")
