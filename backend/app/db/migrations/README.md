# Database Migrations

This directory contains Alembic database migrations.

## Creating a Migration

```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

## Applying Migrations

```bash
alembic upgrade head
```

## Rolling Back

```bash
alembic downgrade -1
```

