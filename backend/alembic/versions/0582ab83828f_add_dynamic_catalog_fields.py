"""add_dynamic_catalog_fields

Revision ID: 0582ab83828f
Revises: 
Create Date: 2026-02-23 14:55:59.733964

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0582ab83828f'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add dynamic catalog fields to products and gender to users."""
    # Products table — new columns
    op.add_column('products', sa.Column('gender', sa.String(20), nullable=False, server_default='unisex'))
    op.add_column('products', sa.Column('vibe', sa.String(50), nullable=False, server_default='Casual'))
    op.add_column('products', sa.Column('tier', sa.String(20), nullable=False, server_default='free'))
    op.add_column('products', sa.Column('source', sa.String(50), nullable=False, server_default='manual'))
    op.add_column('products', sa.Column('source_id', sa.String(255), nullable=True))
    op.add_column('products', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    op.create_unique_constraint('uq_products_source_id', 'products', ['source_id'])

    # Widen product ID column (from 20 to 50 chars for hash IDs)
    op.alter_column('products', 'id', type_=sa.String(50), existing_type=sa.String(20))

    # Users table — add gender
    op.add_column('users', sa.Column('gender', sa.String(20), nullable=True))


def downgrade() -> None:
    """Remove dynamic catalog fields."""
    op.drop_column('users', 'gender')
    op.drop_constraint('uq_products_source_id', 'products', type_='unique')
    op.drop_column('products', 'is_active')
    op.drop_column('products', 'source_id')
    op.drop_column('products', 'source')
    op.drop_column('products', 'tier')
    op.drop_column('products', 'vibe')
    op.drop_column('products', 'gender')
    op.alter_column('products', 'id', type_=sa.String(20), existing_type=sa.String(50))
