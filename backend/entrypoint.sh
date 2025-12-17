#!/bin/bash
set -e

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
while ! nc -z $POSTGRES_HOST ${POSTGRES_PORT:-5432}; do
  sleep 0.1
done
echo "PostgreSQL started"

# Wait for Redis
echo "Waiting for Redis..."
while ! nc -z $REDIS_HOST ${REDIS_PORT:-6379}; do
  sleep 0.1
done
echo "Redis started"

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Start application
if [ "$ENVIRONMENT" = "production" ]; then
  echo "Starting production server..."
  exec gunicorn app.main:app -c gunicorn.conf.py
else
  echo "Starting development server..."
  exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
fi

