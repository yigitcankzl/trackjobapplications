#!/bin/sh

set -eu

if [ "${ROLE:-web}" = "web" ]; then
  echo "Waiting for database..."
  until python manage.py migrate --noinput 2>&1; do
    echo "Migration failed, retrying in 5s..."
    sleep 5
  done

  # Skip collectstatic in dev (runserver serves static files directly)
  case "$*" in
    *runserver*) ;;
    *)
      echo "Collecting static files..."
      python manage.py collectstatic --noinput
      ;;
  esac
fi

echo "Starting: $*"
exec "$@"
