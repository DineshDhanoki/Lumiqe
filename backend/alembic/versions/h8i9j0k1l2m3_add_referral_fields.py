"""Add referral fields to users.

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-03-21 16:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "h8i9j0k1l2m3"
down_revision = "g7h8i9j0k1l2"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("referral_code", sa.String(10), nullable=True))
    op.add_column("users", sa.Column("referred_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True))
    op.add_column("users", sa.Column("referral_count", sa.Integer(), server_default="0", nullable=False))
    op.create_unique_constraint("uq_users_referral_code", "users", ["referral_code"])
    op.create_index("ix_users_referral_code", "users", ["referral_code"])


def downgrade():
    op.drop_index("ix_users_referral_code", "users")
    op.drop_constraint("uq_users_referral_code", "users")
    op.drop_column("users", "referral_count")
    op.drop_column("users", "referred_by")
    op.drop_column("users", "referral_code")
