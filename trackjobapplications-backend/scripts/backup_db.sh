#!/usr/bin/env bash
set -euo pipefail

# Database backup script — run via cron or manually
# Usage: ./scripts/backup_db.sh [backup_dir]

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="trackjobs_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

PGPASSWORD="${POSTGRES_PASSWORD:?}" pg_dump \
  -h "${POSTGRES_HOST:-localhost}" \
  -p "${POSTGRES_PORT:-5432}" \
  -U "${POSTGRES_USER:?}" \
  -d "${POSTGRES_DB:?}" \
  --no-owner \
  --no-privileges \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "Backup created: ${BACKUP_DIR}/${FILENAME}"

# Retain only the last 30 backups
ls -1t "${BACKUP_DIR}"/trackjobs_*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm --
