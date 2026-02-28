#!/bin/sh

set -e

echo "Waiting for database..."
until python manage.py dbshell --command="SELECT 1;" > /dev/null 2>&1; do
  echo "Database is unavailable - waiting..."
  sleep 1
done
echo "Database is up!"

echo "Making migrations..."
python manage.py makemigrations --noinput

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting server..."
exec "$@"
