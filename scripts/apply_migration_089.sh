#!/bin/bash
# apply_migration_089.sh
# Applies migration 089 (add channel_id columns) directly to the running Postgres container.
# Use when you want to apply the migration without a full Docker rebuild.
# 
# Usage: bash apply_migration_089.sh

set -e

CONTAINER="alpha-postgres"
DB="${POSTGRES_DB:-onepa_playout}"
USER="${POSTGRES_USER:-onepa}"
MIGRATION="backend/migrations/089_add_channel_id_multi_channel.sql"

echo "📦 Applying migration 089 to $DB..."

docker exec -i "$CONTAINER" psql -U "$USER" -d "$DB" < "$MIGRATION"

echo "✅ Migration 089 applied. Verifying..."

docker exec -i "$CONTAINER" psql -U "$USER" -d "$DB" -c "
SELECT
  'playlists' AS tbl, COUNT(*) AS total, COUNT(channel_id) AS with_channel_id FROM playlists
UNION ALL
SELECT 'schedule', COUNT(*), COUNT(channel_id) FROM schedule
UNION ALL
SELECT 'graphics_layers', COUNT(*), COUNT(channel_id) FROM graphics_layers
UNION ALL
SELECT 'templates', COUNT(*), COUNT(channel_id) FROM templates
UNION ALL
SELECT 'channel_settings', COUNT(*), 0 FROM channel_settings;
"
