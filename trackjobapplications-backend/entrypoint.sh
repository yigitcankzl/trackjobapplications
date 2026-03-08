#!/bin/sh

set -eu

echo "Waiting for database..."
until python manage.py migrate --noinput 2>&1; do
  echo "Migration failed, retrying in 5s..."
  sleep 5
done

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting server..."
exec "$@"
