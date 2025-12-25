# Database Migration Guide

## Overview

SecureAI uses Alembic for database migrations. This guide explains how to create, test, and apply migrations.

## Migration Status

✅ **Initial migration created**: `2025_12_17_2157-6f650d08cf3d_initial_migration_create_all_tables.py`

This migration creates all required tables:
- `users` - User accounts and authentication
- `scans` - Security scan records
- `vulnerabilities` - Detected vulnerabilities
- `compliance_mappings` - Compliance framework mappings
- `audit_logs` - Audit trail

## Running Migrations

### Development

```bash
cd backend
.\venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac

# Apply all pending migrations
alembic upgrade head

# Check current migration status
alembic current

# View migration history
alembic history
```

### Production

```bash
# In Docker
docker-compose exec backend alembic upgrade head

# Or manually
cd backend
alembic upgrade head
```

## Testing Migrations

### Test on Fresh Database

```bash
cd backend
python scripts/test_migration.py
```

This script:
1. Creates a temporary database
2. Applies all migrations
3. Verifies all tables and columns exist
4. Reports success/failure

### Manual Testing

```bash
# Create test database
export DATABASE_URL="sqlite:///./test_migration.db"

# Run migration
alembic upgrade head

# Verify tables
python -c "from app.db.session import engine; from sqlalchemy import inspect; print(inspect(engine).get_table_names())"
```

## Creating New Migrations

### Auto-generate from Model Changes

```bash
# After modifying models in app/db/models.py
alembic revision --autogenerate -m "Description of changes"
```

### Manual Migration

```bash
# Create empty migration file
alembic revision -m "Description of changes"

# Edit the generated file in:
# backend/app/db/migrations/versions/
```

## Migration Best Practices

1. **Always test migrations** on a copy of production data
2. **Review auto-generated migrations** before applying
3. **Use transactions** for data migrations
4. **Provide rollback** in `downgrade()` function
5. **Document breaking changes** in migration comments

## Troubleshooting

### Migration Fails

```bash
# Check current state
alembic current

# View pending migrations
alembic heads

# Rollback if needed (CAREFUL!)
alembic downgrade -1

# Fix migration file and retry
alembic upgrade head
```

### Database Out of Sync

```bash
# Stamp database with current migration (if tables already exist)
alembic stamp head

# Then continue with normal migrations
alembic upgrade head
```

## Production Deployment

1. **Backup database** before migration
2. **Test migration** on staging first
3. **Schedule maintenance window** if needed
4. **Monitor logs** during migration
5. **Verify data integrity** after migration

## Migration Files

- Location: `backend/app/db/migrations/versions/`
- Format: `YYYY_MM_DD_HHMM-<revision>_<description>.py`
- Never edit existing migrations (create new ones instead)

## Current Migration

**Revision**: `6f650d08cf3d`  
**Description**: Initial migration - create all tables  
**Status**: ✅ Ready for production

This migration is idempotent and safe to run on existing databases (it checks for table existence).

