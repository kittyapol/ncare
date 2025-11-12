"""Add VAT/Non-VAT support

Revision ID: 002
Revises: 001
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_vat_support'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add VAT fields to products table
    op.add_column('products', sa.Column('is_vat_applicable', sa.Boolean, server_default='true'))
    op.add_column('products', sa.Column('vat_rate', sa.Numeric(5, 2), server_default='7.00'))
    op.add_column('products', sa.Column('vat_category', sa.String(50), server_default='standard'))

    # Add VAT breakdown to sales_order_items
    op.add_column('sales_order_items', sa.Column('vat_amount', sa.Numeric(10, 2), server_default='0.00'))
    op.add_column('sales_order_items', sa.Column('price_before_vat', sa.Numeric(10, 2), server_default='0.00'))
    op.add_column('sales_order_items', sa.Column('price_including_vat', sa.Numeric(10, 2), server_default='0.00'))

    # Add separate VAT totals to sales_orders
    op.add_column('sales_orders', sa.Column('vat_total', sa.Numeric(10, 2), server_default='0.00'))
    op.add_column('sales_orders', sa.Column('non_vat_total', sa.Numeric(10, 2), server_default='0.00'))

    # Add OEM/custom order support fields to manufacturing_orders
    op.add_column('manufacturing_orders', sa.Column('is_custom_order', sa.Boolean, server_default='false'))
    op.add_column('manufacturing_orders', sa.Column('custom_formula', sa.Text))
    op.add_column('manufacturing_orders', sa.Column('customer_id', sa.dialects.postgresql.UUID(as_uuid=True)))
    op.add_column('manufacturing_orders', sa.Column('special_instructions', sa.Text))

    # Add component reservation tracking
    op.add_column('bill_of_materials', sa.Column('quantity_reserved', sa.Numeric(10, 2), server_default='0.00'))
    op.add_column('bill_of_materials', sa.Column('reservation_status', sa.String(50), server_default='pending'))

    # Add transfer support for inventory
    op.create_table('inventory_transfers',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('transfer_number', sa.String(100), unique=True, nullable=False),
        sa.Column('from_warehouse_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('warehouses.id'), nullable=False),
        sa.Column('to_warehouse_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('warehouses.id'), nullable=False),
        sa.Column('product_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=False),
        sa.Column('lot_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('inventory_lots.id')),
        sa.Column('quantity', sa.Integer, nullable=False),
        sa.Column('status', sa.String(50), server_default='pending'),
        sa.Column('initiated_by', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('approved_by', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('transfer_date', sa.DateTime(timezone=True)),
        sa.Column('notes', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )

    # Add auto-reorder configuration
    op.create_table('auto_reorder_rules',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('product_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=False, unique=True),
        sa.Column('supplier_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('suppliers.id'), nullable=False),
        sa.Column('warehouse_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('warehouses.id'), nullable=False),
        sa.Column('reorder_quantity', sa.Integer, nullable=False),
        sa.Column('lead_time_days', sa.Integer, default=7),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('last_ordered_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )


def downgrade() -> None:
    # Drop new tables
    op.drop_table('auto_reorder_rules')
    op.drop_table('inventory_transfers')

    # Remove VAT fields from products
    op.drop_column('products', 'vat_category')
    op.drop_column('products', 'vat_rate')
    op.drop_column('products', 'is_vat_applicable')

    # Remove VAT fields from sales_order_items
    op.drop_column('sales_order_items', 'price_including_vat')
    op.drop_column('sales_order_items', 'price_before_vat')
    op.drop_column('sales_order_items', 'vat_amount')

    # Remove VAT totals from sales_orders
    op.drop_column('sales_orders', 'non_vat_total')
    op.drop_column('sales_orders', 'vat_total')

    # Remove OEM fields
    op.drop_column('manufacturing_orders', 'special_instructions')
    op.drop_column('manufacturing_orders', 'customer_id')
    op.drop_column('manufacturing_orders', 'custom_formula')
    op.drop_column('manufacturing_orders', 'is_custom_order')

    # Remove BOM reservation fields
    op.drop_column('bill_of_materials', 'reservation_status')
    op.drop_column('bill_of_materials', 'quantity_reserved')
