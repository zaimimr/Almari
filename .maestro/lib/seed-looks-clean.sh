#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
DEVICE="$device" sh .maestro/lib/seed-owned-everyday.sh
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
db="$data/Documents/SQLite/ExpoSQLiteStorage"
keep="${1:-pieces}"
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c --arg keep "$keep" '
  .pieces = (if $keep == "pieces" then (.pieces | map(select(.source == "owned"))) else [] end)
  | .imports = []
  | .looks = []
  | .feedback = []
  | .setNames = {}')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
