#!/bin/bash
# Lumiqe — PostgreSQL backup script
# Run via cron: 0 3 * * * /path/to/backup_db.sh

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups/lumiqe}"
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/lumiqe_dev}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Parse DB URL for pg_dump
# Format: postgresql://user:pass@host:port/dbname
DB_USER=$(echo "$DB_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DB_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$DB_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DB_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

export PGPASSWORD="$DB_PASS"

pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=custom \
    --compress=9 \
    > "$BACKUP_DIR/lumiqe_${TIMESTAMP}.dump"

unset PGPASSWORD

# Prune old backups
find "$BACKUP_DIR" -name "lumiqe_*.dump" -mtime +"$RETENTION_DAYS" -delete

echo "[$(date)] Backup complete: lumiqe_${TIMESTAMP}.dump ($(du -h "$BACKUP_DIR/lumiqe_${TIMESTAMP}.dump" | cut -f1))"
