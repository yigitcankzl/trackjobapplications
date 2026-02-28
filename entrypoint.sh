#!/bin/sh

set -e


echo "Making migrations..."
python manage.py makemigrations --noinput

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting server..."
exec "$@"
