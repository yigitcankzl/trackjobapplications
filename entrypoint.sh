#!/bin/sh

set -e

echo "Waiting for PostgreSQL..."
while ! nc -z "$POSTGRES_HOST" "$POSTGRES_PORT"; do
  sleep 0.1
done
echo "PostgreSQL is up."

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting server..."
exec "$@"
