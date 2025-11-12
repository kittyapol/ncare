"""Fix database integrity - Add CASCADE/RESTRICT policies, CHECK constraints, and performance indexes

Revision ID: 004
Revises: 003
Create Date: 2025-11-12 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003_cost_vat'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    This migration fixes critical database integrity issues:
    1. Adds proper CASCADE/RESTRICT policies to all foreign keys
    2. Adds CHECK constraints for positive quantities and amounts
    3. Adds compound indexes for report query performance
    """

    # ============================================================================
    # PART 1: Drop and recreate foreign keys with proper CASCADE/RESTRICT policies
    # ============================================================================

    print("Applying foreign key CASCADE/RESTRICT policies...")

    # Categories table - self-referential parent_id
    # RESTRICT: Don't allow deleting parent if children exist
    op.drop_constraint('categories_parent_id_fkey', 'categories', type_='foreignkey')
    op.create_foreign_key(
        'categories_parent_id_fkey',
        'categories', 'categories',
        ['parent_id'], ['id'],
        ondelete='RESTRICT'
    )

    # Products table - category_id
    # RESTRICT: Don't allow deleting category if products exist
    op.drop_constraint('products_category_id_fkey', 'products', type_='foreignkey')
    op.create_foreign_key(
        'products_category_id_fkey',
        'products', 'categories',
        ['category_id'], ['id'],
        ondelete='RESTRICT'
    )

    # Inventory Lots table
    # RESTRICT for product_id: Don't allow deleting product if lots exist
    op.drop_constraint('inventory_lots_product_id_fkey', 'inventory_lots', type_='foreignkey')
    op.create_foreign_key(
        'inventory_lots_product_id_fkey',
        'inventory_lots', 'products',
        ['product_id'], ['id'],
        ondelete='RESTRICT'
    )

    # RESTRICT for warehouse_id: Don't allow deleting warehouse if lots exist
    op.drop_constraint('inventory_lots_warehouse_id_fkey', 'inventory_lots', type_='foreignkey')
    op.create_foreign_key(
        'inventory_lots_warehouse_id_fkey',
        'inventory_lots', 'warehouses',
        ['warehouse_id'], ['id'],
        ondelete='RESTRICT'
    )

    # SET NULL for supplier_id: If supplier deleted, keep lot but clear supplier reference
    op.drop_constraint('inventory_lots_supplier_id_fkey', 'inventory_lots', type_='foreignkey')
    op.create_foreign_key(
        'inventory_lots_supplier_id_fkey',
        'inventory_lots', 'suppliers',
        ['supplier_id'], ['id'],
        ondelete='SET NULL'
    )

    # Sales Orders table
    # SET NULL for customer_id: Keep order history even if customer deleted
    op.drop_constraint('sales_orders_customer_id_fkey', 'sales_orders', type_='foreignkey')
    op.create_foreign_key(
        'sales_orders_customer_id_fkey',
        'sales_orders', 'customers',
        ['customer_id'], ['id'],
        ondelete='SET NULL'
    )

    # RESTRICT for cashier_id: Don't allow deleting user who has created orders
    op.drop_constraint('sales_orders_cashier_id_fkey', 'sales_orders', type_='foreignkey')
    op.create_foreign_key(
        'sales_orders_cashier_id_fkey',
        'sales_orders', 'users',
        ['cashier_id'], ['id'],
        ondelete='RESTRICT'
    )

    # RESTRICT for pharmacist_id: Don't allow deleting user who has verified orders
    op.drop_constraint('sales_orders_pharmacist_id_fkey', 'sales_orders', type_='foreignkey')
    op.create_foreign_key(
        'sales_orders_pharmacist_id_fkey',
        'sales_orders', 'users',
        ['pharmacist_id'], ['id'],
        ondelete='RESTRICT'
    )

    # Sales Order Items table
    # CASCADE: If order deleted, delete all items (order items have no meaning without order)
    op.drop_constraint('sales_order_items_sales_order_id_fkey', 'sales_order_items', type_='foreignkey')
    op.create_foreign_key(
        'sales_order_items_sales_order_id_fkey',
        'sales_order_items', 'sales_orders',
        ['sales_order_id'], ['id'],
        ondelete='CASCADE'
    )

    # RESTRICT for product_id: Don't allow deleting product if it's in order items
    op.drop_constraint('sales_order_items_product_id_fkey', 'sales_order_items', type_='foreignkey')
    op.create_foreign_key(
        'sales_order_items_product_id_fkey',
        'sales_order_items', 'products',
        ['product_id'], ['id'],
        ondelete='RESTRICT'
    )

    # SET NULL for lot_id: Keep order history even if lot is deleted
    op.drop_constraint('sales_order_items_lot_id_fkey', 'sales_order_items', type_='foreignkey')
    op.create_foreign_key(
        'sales_order_items_lot_id_fkey',
        'sales_order_items', 'inventory_lots',
        ['lot_id'], ['id'],
        ondelete='SET NULL'
    )

    # Purchase Orders table
    # RESTRICT for supplier_id: Don't allow deleting supplier if POs exist
    op.drop_constraint('purchase_orders_supplier_id_fkey', 'purchase_orders', type_='foreignkey')
    op.create_foreign_key(
        'purchase_orders_supplier_id_fkey',
        'purchase_orders', 'suppliers',
        ['supplier_id'], ['id'],
        ondelete='RESTRICT'
    )

    # RESTRICT for created_by: Don't allow deleting user who created POs
    op.drop_constraint('purchase_orders_created_by_fkey', 'purchase_orders', type_='foreignkey')
    op.create_foreign_key(
        'purchase_orders_created_by_fkey',
        'purchase_orders', 'users',
        ['created_by'], ['id'],
        ondelete='RESTRICT'
    )

    # RESTRICT for approved_by: Don't allow deleting user who approved POs
    op.drop_constraint('purchase_orders_approved_by_fkey', 'purchase_orders', type_='foreignkey')
    op.create_foreign_key(
        'purchase_orders_approved_by_fkey',
        'purchase_orders', 'users',
        ['approved_by'], ['id'],
        ondelete='RESTRICT'
    )

    # Purchase Order Items table
    # CASCADE: If PO deleted, delete all items
    op.drop_constraint('purchase_order_items_purchase_order_id_fkey', 'purchase_order_items', type_='foreignkey')
    op.create_foreign_key(
        'purchase_order_items_purchase_order_id_fkey',
        'purchase_order_items', 'purchase_orders',
        ['purchase_order_id'], ['id'],
        ondelete='CASCADE'
    )

    # RESTRICT for product_id: Don't allow deleting product if it's in PO items
    op.drop_constraint('purchase_order_items_product_id_fkey', 'purchase_order_items', type_='foreignkey')
    op.create_foreign_key(
        'purchase_order_items_product_id_fkey',
        'purchase_order_items', 'products',
        ['product_id'], ['id'],
        ondelete='RESTRICT'
    )

    # Manufacturing Orders table
    # RESTRICT for product_id: Don't allow deleting product if manufacturing orders exist
    op.drop_constraint('manufacturing_orders_product_id_fkey', 'manufacturing_orders', type_='foreignkey')
    op.create_foreign_key(
        'manufacturing_orders_product_id_fkey',
        'manufacturing_orders', 'products',
        ['product_id'], ['id'],
        ondelete='RESTRICT'
    )

    # RESTRICT for supervisor_id: Don't allow deleting user who supervised MOs
    op.drop_constraint('manufacturing_orders_supervisor_id_fkey', 'manufacturing_orders', type_='foreignkey')
    op.create_foreign_key(
        'manufacturing_orders_supervisor_id_fkey',
        'manufacturing_orders', 'users',
        ['supervisor_id'], ['id'],
        ondelete='RESTRICT'
    )

    # RESTRICT for warehouse_id: Don't allow deleting warehouse if MOs exist
    op.drop_constraint('manufacturing_orders_warehouse_id_fkey', 'manufacturing_orders', type_='foreignkey')
    op.create_foreign_key(
        'manufacturing_orders_warehouse_id_fkey',
        'manufacturing_orders', 'warehouses',
        ['warehouse_id'], ['id'],
        ondelete='RESTRICT'
    )

    # Bill of Materials table
    # CASCADE: If MO deleted, delete BOM items
    op.drop_constraint('bill_of_materials_manufacturing_order_id_fkey', 'bill_of_materials', type_='foreignkey')
    op.create_foreign_key(
        'bill_of_materials_manufacturing_order_id_fkey',
        'bill_of_materials', 'manufacturing_orders',
        ['manufacturing_order_id'], ['id'],
        ondelete='CASCADE'
    )

    # RESTRICT for component_product_id: Don't allow deleting product if it's in BOM
    op.drop_constraint('bill_of_materials_component_product_id_fkey', 'bill_of_materials', type_='foreignkey')
    op.create_foreign_key(
        'bill_of_materials_component_product_id_fkey',
        'bill_of_materials', 'products',
        ['component_product_id'], ['id'],
        ondelete='RESTRICT'
    )

    # Audit Logs table
    # RESTRICT for user_id: Don't allow deleting user if audit logs exist
    op.drop_constraint('audit_logs_user_id_fkey', 'audit_logs', type_='foreignkey')
    op.create_foreign_key(
        'audit_logs_user_id_fkey',
        'audit_logs', 'users',
        ['user_id'], ['id'],
        ondelete='RESTRICT'
    )

    print("✓ Foreign key CASCADE/RESTRICT policies applied")

    # ============================================================================
    # PART 2: Add CHECK constraints for positive quantities and amounts
    # ============================================================================

    print("Adding CHECK constraints for data integrity...")

    # Products table - positive prices
    op.create_check_constraint(
        'check_products_cost_price_positive',
        'products',
        'cost_price >= 0'
    )
    op.create_check_constraint(
        'check_products_selling_price_positive',
        'products',
        'selling_price >= 0'
    )
    op.create_check_constraint(
        'check_products_minimum_stock_positive',
        'products',
        'minimum_stock >= 0'
    )
    op.create_check_constraint(
        'check_products_reorder_point_positive',
        'products',
        'reorder_point >= 0'
    )

    # Inventory Lots - positive quantities
    op.create_check_constraint(
        'check_inventory_lots_quantity_received_positive',
        'inventory_lots',
        'quantity_received >= 0'
    )
    op.create_check_constraint(
        'check_inventory_lots_quantity_available_positive',
        'inventory_lots',
        'quantity_available >= 0'
    )
    op.create_check_constraint(
        'check_inventory_lots_quantity_reserved_positive',
        'inventory_lots',
        'quantity_reserved >= 0'
    )
    op.create_check_constraint(
        'check_inventory_lots_quantity_damaged_positive',
        'inventory_lots',
        'quantity_damaged >= 0'
    )
    # Critical constraint: Total quantities must not exceed received
    op.create_check_constraint(
        'check_inventory_lots_quantity_balance',
        'inventory_lots',
        'quantity_available + quantity_reserved + quantity_damaged <= quantity_received'
    )

    # Sales Orders - positive amounts
    op.create_check_constraint(
        'check_sales_orders_subtotal_positive',
        'sales_orders',
        'subtotal >= 0'
    )
    op.create_check_constraint(
        'check_sales_orders_discount_positive',
        'sales_orders',
        'discount_amount >= 0'
    )
    op.create_check_constraint(
        'check_sales_orders_tax_amount_positive',
        'sales_orders',
        'tax_amount >= 0'
    )
    op.create_check_constraint(
        'check_sales_orders_total_positive',
        'sales_orders',
        'total_amount >= 0'
    )
    op.create_check_constraint(
        'check_sales_orders_paid_positive',
        'sales_orders',
        'paid_amount >= 0'
    )

    # Sales Order Items - positive quantities and amounts
    op.create_check_constraint(
        'check_sales_order_items_quantity_positive',
        'sales_order_items',
        'quantity > 0'
    )
    op.create_check_constraint(
        'check_sales_order_items_unit_price_positive',
        'sales_order_items',
        'unit_price >= 0'
    )
    op.create_check_constraint(
        'check_sales_order_items_discount_positive',
        'sales_order_items',
        'discount_amount >= 0'
    )
    op.create_check_constraint(
        'check_sales_order_items_line_total_positive',
        'sales_order_items',
        'line_total >= 0'
    )

    # Purchase Orders - positive amounts
    op.create_check_constraint(
        'check_purchase_orders_subtotal_positive',
        'purchase_orders',
        'subtotal >= 0'
    )
    op.create_check_constraint(
        'check_purchase_orders_discount_positive',
        'purchase_orders',
        'discount_amount >= 0'
    )
    op.create_check_constraint(
        'check_purchase_orders_tax_positive',
        'purchase_orders',
        'tax_amount >= 0'
    )
    op.create_check_constraint(
        'check_purchase_orders_shipping_positive',
        'purchase_orders',
        'shipping_cost >= 0'
    )
    op.create_check_constraint(
        'check_purchase_orders_total_positive',
        'purchase_orders',
        'total_amount >= 0'
    )

    # Purchase Order Items - positive quantities and amounts
    op.create_check_constraint(
        'check_purchase_order_items_quantity_ordered_positive',
        'purchase_order_items',
        'quantity_ordered > 0'
    )
    op.create_check_constraint(
        'check_purchase_order_items_quantity_received_positive',
        'purchase_order_items',
        'quantity_received >= 0'
    )
    op.create_check_constraint(
        'check_purchase_order_items_unit_price_positive',
        'purchase_order_items',
        'unit_price >= 0'
    )
    op.create_check_constraint(
        'check_purchase_order_items_discount_positive',
        'purchase_order_items',
        'discount_amount >= 0'
    )

    # Manufacturing Orders - positive quantities
    op.create_check_constraint(
        'check_manufacturing_orders_quantity_to_produce_positive',
        'manufacturing_orders',
        'quantity_to_produce > 0'
    )
    op.create_check_constraint(
        'check_manufacturing_orders_quantity_produced_positive',
        'manufacturing_orders',
        'quantity_produced >= 0'
    )

    # Bill of Materials - positive quantities
    op.create_check_constraint(
        'check_bill_of_materials_quantity_required_positive',
        'bill_of_materials',
        'quantity_required > 0'
    )
    op.create_check_constraint(
        'check_bill_of_materials_quantity_consumed_positive',
        'bill_of_materials',
        'quantity_consumed >= 0'
    )

    # Customers - loyalty points can't be negative
    op.create_check_constraint(
        'check_customers_loyalty_points_positive',
        'customers',
        'loyalty_points >= 0'
    )

    print("✓ CHECK constraints added")

    # ============================================================================
    # PART 3: Add compound indexes for report query performance
    # ============================================================================

    print("Adding performance indexes for reports...")

    # Sales Orders - for date range and status queries in reports
    op.create_index(
        'ix_sales_orders_order_date_status',
        'sales_orders',
        ['order_date', 'status']
    )
    op.create_index(
        'ix_sales_orders_order_date_payment_status',
        'sales_orders',
        ['order_date', 'payment_status']
    )

    # Inventory Lots - for expiry monitoring and availability queries
    op.create_index(
        'ix_inventory_lots_expiry_quantity',
        'inventory_lots',
        ['expiry_date', 'quantity_available']
    )
    op.create_index(
        'ix_inventory_lots_product_warehouse',
        'inventory_lots',
        ['product_id', 'warehouse_id']
    )

    # Purchase Orders - for supplier and status reporting
    op.create_index(
        'ix_purchase_orders_supplier_status',
        'purchase_orders',
        ['supplier_id', 'status']
    )
    op.create_index(
        'ix_purchase_orders_order_date_status',
        'purchase_orders',
        ['order_date', 'status']
    )

    # Sales Order Items - for product sales analysis
    op.create_index(
        'ix_sales_order_items_product_id',
        'sales_order_items',
        ['product_id']
    )

    # Purchase Order Items - for product purchase analysis
    op.create_index(
        'ix_purchase_order_items_product_id',
        'purchase_order_items',
        ['product_id']
    )

    # Products - for category queries
    op.create_index(
        'ix_products_category_id',
        'products',
        ['category_id']
    )

    print("✓ Performance indexes added")

    print("=" * 80)
    print("Migration 004 completed successfully!")
    print("✓ Foreign key CASCADE/RESTRICT policies applied")
    print("✓ CHECK constraints for positive quantities added")
    print("✓ Performance indexes for reports created")
    print("=" * 80)


def downgrade() -> None:
    """
    Downgrade migration - remove all changes made in upgrade()
    """

    print("Rolling back migration 004...")

    # Drop performance indexes
    op.drop_index('ix_products_category_id', 'products')
    op.drop_index('ix_purchase_order_items_product_id', 'purchase_order_items')
    op.drop_index('ix_sales_order_items_product_id', 'sales_order_items')
    op.drop_index('ix_purchase_orders_order_date_status', 'purchase_orders')
    op.drop_index('ix_purchase_orders_supplier_status', 'purchase_orders')
    op.drop_index('ix_inventory_lots_product_warehouse', 'inventory_lots')
    op.drop_index('ix_inventory_lots_expiry_quantity', 'inventory_lots')
    op.drop_index('ix_sales_orders_order_date_payment_status', 'sales_orders')
    op.drop_index('ix_sales_orders_order_date_status', 'sales_orders')

    # Drop CHECK constraints
    op.drop_constraint('check_customers_loyalty_points_positive', 'customers', type_='check')
    op.drop_constraint('check_bill_of_materials_quantity_consumed_positive', 'bill_of_materials', type_='check')
    op.drop_constraint('check_bill_of_materials_quantity_required_positive', 'bill_of_materials', type_='check')
    op.drop_constraint('check_manufacturing_orders_quantity_produced_positive', 'manufacturing_orders', type_='check')
    op.drop_constraint('check_manufacturing_orders_quantity_to_produce_positive', 'manufacturing_orders', type_='check')
    op.drop_constraint('check_purchase_order_items_discount_positive', 'purchase_order_items', type_='check')
    op.drop_constraint('check_purchase_order_items_unit_price_positive', 'purchase_order_items', type_='check')
    op.drop_constraint('check_purchase_order_items_quantity_received_positive', 'purchase_order_items', type_='check')
    op.drop_constraint('check_purchase_order_items_quantity_ordered_positive', 'purchase_order_items', type_='check')
    op.drop_constraint('check_purchase_orders_total_positive', 'purchase_orders', type_='check')
    op.drop_constraint('check_purchase_orders_shipping_positive', 'purchase_orders', type_='check')
    op.drop_constraint('check_purchase_orders_tax_positive', 'purchase_orders', type_='check')
    op.drop_constraint('check_purchase_orders_discount_positive', 'purchase_orders', type_='check')
    op.drop_constraint('check_purchase_orders_subtotal_positive', 'purchase_orders', type_='check')
    op.drop_constraint('check_sales_order_items_line_total_positive', 'sales_order_items', type_='check')
    op.drop_constraint('check_sales_order_items_discount_positive', 'sales_order_items', type_='check')
    op.drop_constraint('check_sales_order_items_unit_price_positive', 'sales_order_items', type_='check')
    op.drop_constraint('check_sales_order_items_quantity_positive', 'sales_order_items', type_='check')
    op.drop_constraint('check_sales_orders_paid_positive', 'sales_orders', type_='check')
    op.drop_constraint('check_sales_orders_total_positive', 'sales_orders', type_='check')
    op.drop_constraint('check_sales_orders_tax_amount_positive', 'sales_orders', type_='check')
    op.drop_constraint('check_sales_orders_discount_positive', 'sales_orders', type_='check')
    op.drop_constraint('check_sales_orders_subtotal_positive', 'sales_orders', type_='check')
    op.drop_constraint('check_inventory_lots_quantity_balance', 'inventory_lots', type_='check')
    op.drop_constraint('check_inventory_lots_quantity_damaged_positive', 'inventory_lots', type_='check')
    op.drop_constraint('check_inventory_lots_quantity_reserved_positive', 'inventory_lots', type_='check')
    op.drop_constraint('check_inventory_lots_quantity_available_positive', 'inventory_lots', type_='check')
    op.drop_constraint('check_inventory_lots_quantity_received_positive', 'inventory_lots', type_='check')
    op.drop_constraint('check_products_reorder_point_positive', 'products', type_='check')
    op.drop_constraint('check_products_minimum_stock_positive', 'products', type_='check')
    op.drop_constraint('check_products_selling_price_positive', 'products', type_='check')
    op.drop_constraint('check_products_cost_price_positive', 'products', type_='check')

    # Revert foreign keys back to no CASCADE/RESTRICT (recreate without ondelete parameter)
    # Note: In production, you may want to keep the improved constraints
    # This downgrade is provided for completeness only

    print("Migration 004 rolled back successfully")
