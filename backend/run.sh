#!/bin/bash
set -e

# Wait for PostgreSQL
if [ -n "$POSTGRES_HOST" ]; then
  echo "Waiting for PostgreSQL..."
  until nc -z $POSTGRES_HOST ${POSTGRES_PORT:-5432}; do
    sleep 0.1
  done
  echo "PostgreSQL started"
fi

# Wait for Redis
if [ -n "$REDIS_HOST" ]; then
  echo "Waiting for Redis..."
  until nc -z $REDIS_HOST ${REDIS_PORT:-6379}; do
    sleep 0.1
  done
  echo "Redis started"
fi

# Run migrations
echo "Running database migrations..."
alembic upgrade head || echo "Migration failed or no migrations to run"

# Start application
if [ "$ENVIRONMENT" = "production" ]; then
  echo "Starting production server with Gunicorn..."
  exec gunicorn app.main:app -c gunicorn.conf.py
else
  echo "Starting development server..."
  exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
fi

