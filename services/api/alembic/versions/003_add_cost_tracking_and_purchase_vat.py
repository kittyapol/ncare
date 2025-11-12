"""Add cost tracking and purchase VAT support

Revision ID: 003_cost_vat
Revises: 002_add_vat_support
Create Date: 2025-11-12

Changes:
1. Add unit_cost to inventory_lots for accurate COGS calculation
2. Add VAT breakdown fields to purchase_order_items for input VAT tracking
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '003_cost_vat'
down_revision = '002_add_vat_support'
branch_labels = None
depends_on = None


def upgrade():
    # Add unit_cost to inventory_lots
    op.add_column('inventory_lots', sa.Column('unit_cost', sa.Numeric(10, 2), nullable=False, server_default='0.00'))

    # Remove server_default after adding (we want explicit costs going forward)
    op.alter_column('inventory_lots', 'unit_cost', server_default=None)

    # Add VAT breakdown fields to purchase_order_items
    op.add_column('purchase_order_items', sa.Column('is_vat_included', sa.Boolean(), server_default='true'))
    op.add_column('purchase_order_items', sa.Column('vat_rate', sa.Numeric(5, 2), server_default='7.00'))
    op.add_column('purchase_order_items', sa.Column('vat_amount', sa.Numeric(10, 2), server_default='0.00'))
    op.add_column('purchase_order_items', sa.Column('price_before_vat', sa.Numeric(10, 2), server_default='0.00'))
    op.add_column('purchase_order_items', sa.Column('price_including_vat', sa.Numeric(10, 2), server_default='0.00'))

    # Remove server_defaults (we want explicit values)
    op.alter_column('purchase_order_items', 'is_vat_included', server_default=None)
    op.alter_column('purchase_order_items', 'vat_rate', server_default=None)
    op.alter_column('purchase_order_items', 'vat_amount', server_default=None)
    op.alter_column('purchase_order_items', 'price_before_vat', server_default=None)
    op.alter_column('purchase_order_items', 'price_including_vat', server_default=None)


def downgrade():
    # Remove VAT fields from purchase_order_items
    op.drop_column('purchase_order_items', 'price_including_vat')
    op.drop_column('purchase_order_items', 'price_before_vat')
    op.drop_column('purchase_order_items', 'vat_amount')
    op.drop_column('purchase_order_items', 'vat_rate')
    op.drop_column('purchase_order_items', 'is_vat_included')

    # Remove unit_cost from inventory_lots
    op.drop_column('inventory_lots', 'unit_cost')
