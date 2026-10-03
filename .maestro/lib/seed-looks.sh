#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
DEVICE="$device" sh .maestro/lib/seed-owned.sh
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
db="$data/Documents/SQLite/ExpoSQLiteStorage"
looks='[
  {"id":"seed-look-eid","name":"Eid lunch","pieceIds":["seed-abaya","seed-chiffon-hijab","seed-boots"],"createdAt":"2026-09-20T08:00:00.000Z","occasion":"eid","plannedFor":"2026-10-11"},
  {"id":"seed-look-office","name":"Office navy","pieceIds":["seed-blazer","seed-blouse","seed-ankle-trousers","seed-hijab"],"createdAt":"2026-09-18T08:00:00.000Z","occasion":"work"}
]'
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c --argjson looks "$looks" '
  .looks = $looks + (.looks | map(select(.id | startswith("seed-") | not)))')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
