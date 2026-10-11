#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
xcrun simctl terminate "$device" com.zaimimran.almari 2>/dev/null || true
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
mkdir -p "$data/Documents/SQLite"
database="$data/Documents/SQLite/ExpoSQLiteStorage"
sqlite3 "$database" "create table if not exists storage (key text primary key not null, value text)"
if [ "${1:-none}" = "backup" ]; then
  sqlite3 "$database" "insert or replace into storage (key, value) select 'closet.v3.backup', value from storage where key = 'closet.v3'"
else
  sqlite3 "$database" "delete from storage where key = 'closet.v3.backup'"
fi
sqlite3 "$database" "insert or replace into storage (key, value) values ('closet.v3', '{')"
