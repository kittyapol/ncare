"""Initial migration - Create all tables

Revision ID: 001
Revises:
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable UUID extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # Create enum types
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE user_role AS ENUM ('admin', 'manager', 'pharmacist', 'staff', 'cashier');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE dosage_form AS ENUM ('tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'powder', 'suppository');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE drug_type AS ENUM ('prescription', 'otc', 'controlled', 'dangerous');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE quality_status AS ENUM ('passed', 'failed', 'quarantine', 'pending');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE warehouse_type AS ENUM ('main', 'branch', 'cold_storage', 'quarantine');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE order_status AS ENUM ('draft', 'confirmed', 'completed', 'cancelled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'promptpay', 'credit');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'refunded');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE po_status AS ENUM ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE manufacturing_status AS ENUM ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('role', postgresql.ENUM('admin', 'manager', 'pharmacist', 'staff', 'cashier', name='user_role', create_type=False), nullable=False),
        sa.Column('phone', sa.String(20)),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # Categories table
    op.create_table('categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('code', sa.String(50), nullable=False, unique=True),
        sa.Column('name_th', sa.String(255), nullable=False),
        sa.Column('name_en', sa.String(255)),
        sa.Column('description', sa.Text),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id')),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # Suppliers table
    op.create_table('suppliers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('code', sa.String(50), nullable=False, unique=True),
        sa.Column('name_th', sa.String(255), nullable=False),
        sa.Column('name_en', sa.String(255)),
        sa.Column('tax_id', sa.String(20), unique=True),
        sa.Column('contact_person', sa.String(255)),
        sa.Column('email', sa.String(255)),
        sa.Column('phone', sa.String(20)),
        sa.Column('fax', sa.String(20)),
        sa.Column('mobile', sa.String(20)),
        sa.Column('address', sa.Text),
        sa.Column('city', sa.String(100)),
        sa.Column('province', sa.String(100)),
        sa.Column('postal_code', sa.String(10)),
        sa.Column('country', sa.String(100), default='Thailand'),
        sa.Column('payment_terms', sa.String(100)),
        sa.Column('credit_limit', sa.String(100)),
        sa.Column('discount_terms', sa.String(100)),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('rating', sa.String(10)),
        sa.Column('notes', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )

    # Customers table
    op.create_table('customers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('code', sa.String(50), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('national_id', sa.String(20)),
        sa.Column('date_of_birth', sa.Date),
        sa.Column('gender', sa.String(10)),
        sa.Column('email', sa.String(255)),
        sa.Column('phone', sa.String(20)),
        sa.Column('mobile', sa.String(20)),
        sa.Column('address', sa.Text),
        sa.Column('city', sa.String(100)),
        sa.Column('province', sa.String(100)),
        sa.Column('postal_code', sa.String(10)),
        sa.Column('loyalty_points', sa.Integer, default=0),
        sa.Column('member_since', sa.Date),
        sa.Column('membership_tier', sa.String(50)),
        sa.Column('allergies', sa.Text),
        sa.Column('chronic_conditions', sa.Text),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('notes', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )

    # Warehouses table
    op.create_table('warehouses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('code', sa.String(50), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('type', postgresql.ENUM('main', 'branch', 'cold_storage', 'quarantine', name='warehouse_type', create_type=False)),
        sa.Column('address', sa.String(500)),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # Products table
    op.create_table('products',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('sku', sa.String(100), nullable=False, unique=True),
        sa.Column('barcode', sa.String(100), unique=True),
        sa.Column('name_th', sa.String(255), nullable=False),
        sa.Column('name_en', sa.String(255)),
        sa.Column('generic_name', sa.String(255)),
        sa.Column('description', sa.Text),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id')),
        sa.Column('active_ingredient', sa.String(500)),
        sa.Column('dosage_form', postgresql.ENUM('tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'powder', 'suppository', name='dosage_form', create_type=False)),
        sa.Column('strength', sa.String(100)),
        sa.Column('drug_type', postgresql.ENUM('prescription', 'otc', 'controlled', 'dangerous', name='drug_type', create_type=False)),
        sa.Column('fda_number', sa.String(100)),
        sa.Column('manufacturer', sa.String(255)),
        sa.Column('cost_price', sa.Numeric(10, 2), default=0),
        sa.Column('selling_price', sa.Numeric(10, 2), default=0),
        sa.Column('unit_of_measure', sa.String(50), default='unit'),
        sa.Column('minimum_stock', sa.Integer, default=0),
        sa.Column('reorder_point', sa.Integer, default=0),
        sa.Column('is_prescription_required', sa.Boolean, default=False),
        sa.Column('is_controlled_substance', sa.Boolean, default=False),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('is_serialized', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )
    op.create_index('ix_products_sku', 'products', ['sku'])
    op.create_index('ix_products_barcode', 'products', ['barcode'])

    # Inventory Lots table
    op.create_table('inventory_lots',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=False),
        sa.Column('warehouse_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('warehouses.id'), nullable=False),
        sa.Column('supplier_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('suppliers.id')),
        sa.Column('lot_number', sa.String(100), nullable=False),
        sa.Column('batch_number', sa.String(100)),
        sa.Column('quantity_received', sa.Integer, nullable=False),
        sa.Column('quantity_available', sa.Integer, nullable=False),
        sa.Column('quantity_reserved', sa.Integer, default=0),
        sa.Column('quantity_damaged', sa.Integer, default=0),
        sa.Column('manufacture_date', sa.Date),
        sa.Column('expiry_date', sa.Date, nullable=False),
        sa.Column('received_date', sa.Date, nullable=False),
        sa.Column('quality_status', postgresql.ENUM('passed', 'failed', 'quarantine', 'pending', name='quality_status', create_type=False)),
        sa.Column('quality_checked_at', sa.DateTime(timezone=True)),
        sa.Column('quality_notes', sa.String(500)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )
    op.create_index('ix_inventory_lots_lot_number', 'inventory_lots', ['lot_number'])
    op.create_index('ix_inventory_lots_expiry_date', 'inventory_lots', ['expiry_date'])

    # Sales Orders table
    op.create_table('sales_orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('order_number', sa.String(100), nullable=False, unique=True),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('customers.id')),
        sa.Column('prescription_number', sa.String(100)),
        sa.Column('subtotal', sa.Numeric(10, 2), default=0),
        sa.Column('discount_amount', sa.Numeric(10, 2), default=0),
        sa.Column('tax_rate', sa.Numeric(5, 2), default=7.0),
        sa.Column('tax_amount', sa.Numeric(10, 2), default=0),
        sa.Column('total_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('payment_method', postgresql.ENUM('cash', 'credit_card', 'debit_card', 'bank_transfer', 'promptpay', 'credit', name='payment_method', create_type=False)),
        sa.Column('payment_status', postgresql.ENUM('pending', 'paid', 'partial', 'refunded', name='payment_status', create_type=False)),
        sa.Column('paid_amount', sa.Numeric(10, 2), default=0),
        sa.Column('change_amount', sa.Numeric(10, 2), default=0),
        sa.Column('status', postgresql.ENUM('draft', 'confirmed', 'completed', 'cancelled', name='order_status', create_type=False)),
        sa.Column('cashier_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('pharmacist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('notes', sa.String(500)),
        sa.Column('order_date', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )
    op.create_index('ix_sales_orders_order_number', 'sales_orders', ['order_number'])

    # Sales Order Items table
    op.create_table('sales_order_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('sales_order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sales_orders.id'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=False),
        sa.Column('lot_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('inventory_lots.id')),
        sa.Column('quantity', sa.Integer, nullable=False),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('discount_amount', sa.Numeric(10, 2), default=0),
        sa.Column('line_total', sa.Numeric(10, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # Purchase Orders table
    op.create_table('purchase_orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('po_number', sa.String(100), nullable=False, unique=True),
        sa.Column('supplier_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('suppliers.id'), nullable=False),
        sa.Column('subtotal', sa.Numeric(12, 2), default=0),
        sa.Column('discount_amount', sa.Numeric(12, 2), default=0),
        sa.Column('tax_amount', sa.Numeric(12, 2), default=0),
        sa.Column('shipping_cost', sa.Numeric(10, 2), default=0),
        sa.Column('total_amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('status', postgresql.ENUM('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled', name='po_status', create_type=False)),
        sa.Column('order_date', sa.Date, nullable=False),
        sa.Column('expected_delivery_date', sa.Date),
        sa.Column('actual_delivery_date', sa.Date),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('notes', sa.Text),
        sa.Column('terms_and_conditions', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )
    op.create_index('ix_purchase_orders_po_number', 'purchase_orders', ['po_number'])

    # Purchase Order Items table
    op.create_table('purchase_order_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('purchase_order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('purchase_orders.id'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=False),
        sa.Column('quantity_ordered', sa.Integer, nullable=False),
        sa.Column('quantity_received', sa.Integer, default=0),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('discount_amount', sa.Numeric(10, 2), default=0),
        sa.Column('line_total', sa.Numeric(12, 2), nullable=False),
        sa.Column('notes', sa.String(500)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # Manufacturing Orders table
    op.create_table('manufacturing_orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('mo_number', sa.String(100), nullable=False, unique=True),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=False),
        sa.Column('quantity_to_produce', sa.Integer, nullable=False),
        sa.Column('quantity_produced', sa.Integer, default=0),
        sa.Column('batch_number', sa.String(100), unique=True),
        sa.Column('lot_number', sa.String(100)),
        sa.Column('status', postgresql.ENUM('draft', 'confirmed', 'in_progress', 'completed', 'cancelled', name='manufacturing_status', create_type=False)),
        sa.Column('quality_status', sa.String(50)),
        sa.Column('supervisor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('warehouse_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('warehouses.id')),
        sa.Column('scheduled_start_date', sa.DateTime(timezone=True)),
        sa.Column('scheduled_end_date', sa.DateTime(timezone=True)),
        sa.Column('actual_start_date', sa.DateTime(timezone=True)),
        sa.Column('actual_end_date', sa.DateTime(timezone=True)),
        sa.Column('notes', sa.Text),
        sa.Column('quality_notes', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )
    op.create_index('ix_manufacturing_orders_mo_number', 'manufacturing_orders', ['mo_number'])

    # Bill of Materials table
    op.create_table('bill_of_materials',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('manufacturing_order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('manufacturing_orders.id')),
        sa.Column('component_product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=False),
        sa.Column('quantity_required', sa.Numeric(10, 2), nullable=False),
        sa.Column('quantity_consumed', sa.Numeric(10, 2), default=0),
        sa.Column('unit_of_measure', sa.String(50)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # Audit Logs table
    op.create_table('audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('table_name', sa.String(100), nullable=False),
        sa.Column('record_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('old_values', postgresql.JSONB),
        sa.Column('new_values', postgresql.JSONB),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('user_agent', sa.String(500)),
        sa.Column('description', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    op.create_index('ix_audit_logs_table_name', 'audit_logs', ['table_name'])
    op.create_index('ix_audit_logs_record_id', 'audit_logs', ['record_id'])
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('audit_logs')
    op.drop_table('bill_of_materials')
    op.drop_table('manufacturing_orders')
    op.drop_table('purchase_order_items')
    op.drop_table('purchase_orders')
    op.drop_table('sales_order_items')
    op.drop_table('sales_orders')
    op.drop_table('inventory_lots')
    op.drop_table('products')
    op.drop_table('warehouses')
    op.drop_table('customers')
    op.drop_table('suppliers')
    op.drop_table('categories')
    op.drop_table('users')

    # Drop enum types
    op.execute('DROP TYPE IF EXISTS manufacturing_status')
    op.execute('DROP TYPE IF EXISTS po_status')
    op.execute('DROP TYPE IF EXISTS payment_status')
    op.execute('DROP TYPE IF EXISTS payment_method')
    op.execute('DROP TYPE IF EXISTS order_status')
    op.execute('DROP TYPE IF EXISTS warehouse_type')
    op.execute('DROP TYPE IF EXISTS quality_status')
    op.execute('DROP TYPE IF EXISTS drug_type')
    op.execute('DROP TYPE IF EXISTS dosage_form')
    op.execute('DROP TYPE IF EXISTS user_role')
