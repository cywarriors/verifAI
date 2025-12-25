"""Initial migration - create all tables

Revision ID: 6f650d08cf3d
Revises: 
Create Date: 2025-12-17 21:57:08.859212

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '6f650d08cf3d'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types (SQLite doesn't support enums, so we use VARCHAR)
    # For PostgreSQL, these would be proper ENUMs
    
    # Check if tables already exist (for idempotency)
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()
    
    # Create users table
    if 'users' not in existing_tables:
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('username', sa.String(length=50), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('hashed_password', sa.String(length=255), nullable=False),
            sa.Column('full_name', sa.String(length=100), nullable=True),
            sa.Column('role', sa.String(length=20), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
        op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    
    # Create scans table
    if 'scans' not in existing_tables:
        op.create_table(
            'scans',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=200), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('model_name', sa.String(length=100), nullable=False),
            sa.Column('model_type', sa.String(length=50), nullable=False),
            sa.Column('model_config', sa.JSON(), nullable=True),
            sa.Column('scanner_type', sa.String(length=50), nullable=False, server_default='BUILTIN'),
            sa.Column('status', sa.String(length=20), nullable=True),
            sa.Column('progress', sa.Float(), nullable=True),
            sa.Column('results', sa.JSON(), nullable=True),
            sa.Column('vulnerability_count', sa.Integer(), nullable=True),
            sa.Column('risk_score', sa.Float(), nullable=True),
            sa.Column('started_at', sa.DateTime(), nullable=True),
            sa.Column('completed_at', sa.DateTime(), nullable=True),
            sa.Column('duration', sa.Integer(), nullable=True),
            sa.Column('created_by', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_scans_id'), 'scans', ['id'], unique=False)
        op.create_index(op.f('ix_scans_status'), 'scans', ['status'], unique=False)
    
    # Add scanner_type column if it doesn't exist (for existing databases)
    if 'scans' in existing_tables:
        scans_columns = [col['name'] for col in inspector.get_columns('scans')]
        if 'scanner_type' not in scans_columns:
            op.add_column('scans', sa.Column('scanner_type', sa.String(length=50), nullable=False, server_default='BUILTIN'))
    
    # Create vulnerabilities table
    if 'vulnerabilities' not in existing_tables:
        op.create_table(
            'vulnerabilities',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('scan_id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=200), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('severity', sa.String(length=20), nullable=True),
            sa.Column('probe_name', sa.String(length=100), nullable=True),
            sa.Column('probe_category', sa.String(length=100), nullable=True),
            sa.Column('evidence', sa.Text(), nullable=True),
            sa.Column('remediation', sa.Text(), nullable=True),
            sa.Column('cvss_score', sa.Float(), nullable=True),
            sa.Column('extra_data', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['scan_id'], ['scans.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_vulnerabilities_id'), 'vulnerabilities', ['id'], unique=False)
    
    # Create compliance_mappings table
    if 'compliance_mappings' not in existing_tables:
        op.create_table(
            'compliance_mappings',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('scan_id', sa.Integer(), nullable=False),
            sa.Column('framework', sa.String(length=50), nullable=False),
            sa.Column('requirement_id', sa.String(length=50), nullable=False),
            sa.Column('requirement_name', sa.String(length=200), nullable=False),
            sa.Column('compliance_status', sa.String(length=20), nullable=True),
            sa.Column('evidence', sa.Text(), nullable=True),
            sa.Column('vulnerability_ids', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['scan_id'], ['scans.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_compliance_mappings_id'), 'compliance_mappings', ['id'], unique=False)
        op.create_index(op.f('ix_compliance_mappings_framework'), 'compliance_mappings', ['framework'], unique=False)
    
    # Create audit_logs table
    if 'audit_logs' not in existing_tables:
        op.create_table(
            'audit_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('action', sa.String(length=50), nullable=False),
            sa.Column('resource_type', sa.String(length=50), nullable=True),
            sa.Column('resource_id', sa.Integer(), nullable=True),
            sa.Column('details', sa.JSON(), nullable=True),
            sa.Column('ip_address', sa.String(length=45), nullable=True),
            sa.Column('user_agent', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)


def downgrade() -> None:
    # Check if tables exist before dropping
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()
    
    if 'audit_logs' in existing_tables:
        op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
        op.drop_table('audit_logs')
    
    if 'compliance_mappings' in existing_tables:
        op.drop_index(op.f('ix_compliance_mappings_framework'), table_name='compliance_mappings')
        op.drop_index(op.f('ix_compliance_mappings_id'), table_name='compliance_mappings')
        op.drop_table('compliance_mappings')
    
    if 'vulnerabilities' in existing_tables:
        op.drop_index(op.f('ix_vulnerabilities_id'), table_name='vulnerabilities')
        op.drop_table('vulnerabilities')
    
    if 'scans' in existing_tables:
        op.drop_index(op.f('ix_scans_status'), table_name='scans')
        op.drop_index(op.f('ix_scans_id'), table_name='scans')
        op.drop_table('scans')
    
    if 'users' in existing_tables:
        op.drop_index(op.f('ix_users_username'), table_name='users')
        op.drop_index(op.f('ix_users_id'), table_name='users')
        op.drop_table('users')
