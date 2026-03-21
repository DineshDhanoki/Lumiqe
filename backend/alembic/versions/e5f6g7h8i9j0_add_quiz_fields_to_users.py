"""add_quiz_fields_to_users

Revision ID: e5f6g7h8i9j0
Revises: d4e5f6g7h8i9
Create Date: 2026-03-20 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e5f6g7h8i9j0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6g7h8i9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add body_shape, style_personality, quiz_completed_at to users."""
    op.add_column("users", sa.Column("body_shape", sa.String(30), nullable=True))
    op.add_column("users", sa.Column("style_personality", sa.String(30), nullable=True))
    op.add_column("users", sa.Column("quiz_completed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Remove quiz fields from users."""
    op.drop_column("users", "quiz_completed_at")
    op.drop_column("users", "style_personality")
    op.drop_column("users", "body_shape")
