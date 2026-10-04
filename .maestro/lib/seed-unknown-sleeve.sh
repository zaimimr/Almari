#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
db="$data/Documents/SQLite/ExpoSQLiteStorage"
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c '
  .pieces |= map(if .attributes.sleeve then .sources = ((.sources // {}) + {sleeve: "proposed"}) else . end)
  | .styling.today = null')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
