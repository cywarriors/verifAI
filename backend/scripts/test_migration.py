#!/usr/bin/env python
"""Test database migration on fresh database"""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

import os
import tempfile
import shutil
from alembic import command
from alembic.config import Config
from app.db.session import engine, Base
from app.db.models import User, Scan, Vulnerability, ComplianceMapping, AuditLog
from sqlalchemy import inspect

def test_migration():
    """Test migration on a fresh database"""
    
    # Create temporary database
    temp_db = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
    temp_db_path = temp_db.name
    temp_db.close()
    
    try:
        # Set database URL to temp file
        os.environ['DATABASE_URL'] = f'sqlite:///{temp_db_path}'
        
        # Create new engine for temp database
        from sqlalchemy import create_engine
        test_engine = create_engine(f'sqlite:///{temp_db_path}')
        
        # Run migration
        alembic_cfg = Config(str(backend_dir / "alembic.ini"))
        alembic_cfg.set_main_option('sqlalchemy.url', f'sqlite:///{temp_db_path}')
        
        print("Running migration...")
        command.upgrade(alembic_cfg, "head")
        
        # Close connection before verifying
        test_engine.dispose()
        
        # Reconnect to verify
        verify_engine = create_engine(f'sqlite:///{temp_db_path}')
        verify_inspector = inspect(verify_engine)
        tables = verify_inspector.get_table_names()
        
        required_tables = ['users', 'scans', 'vulnerabilities', 'compliance_mappings', 'audit_logs']
        missing_tables = [t for t in required_tables if t not in tables]
        
        if missing_tables:
            print(f"❌ FAILED: Missing tables: {missing_tables}")
            verify_engine.dispose()
            return False
        
        # Verify columns
        scan_columns = [col['name'] for col in verify_inspector.get_columns('scans')]
        required_columns = ['id', 'name', 'model_name', 'model_type', 'scanner_type', 'status']
        missing_columns = [c for c in required_columns if c not in scan_columns]
        
        if missing_columns:
            print(f"❌ FAILED: Missing columns in scans table: {missing_columns}")
            verify_engine.dispose()
            return False
        
        print("✅ Migration test PASSED")
        print(f"   Tables created: {', '.join(tables)}")
        print(f"   Scanner type column: {'scanner_type' in scan_columns}")
        verify_engine.dispose()
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Cleanup
        if os.path.exists(temp_db_path):
            os.unlink(temp_db_path)

if __name__ == "__main__":
    success = test_migration()
    sys.exit(0 if success else 1)

