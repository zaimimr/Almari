#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
xcrun simctl terminate "$device" com.zaimimran.almari || true
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
photos="$data/Documents/closet-photos"
mkdir -p "$photos"
cp assets/wardrobe/chocolate-loafers.png "$photos/seed-boots-original.png"
cp assets/wardrobe/navy-blazer.png "$photos/seed-coat-original.png"
db="$data/Documents/SQLite/ExpoSQLiteStorage"
boots='{"id":"seed-boots","name":"Black boots","category":"shoes","kind":"boots","styles":["western"],
  "photo":"seed-boots-original.png","original":"seed-boots-original.png",
  "createdAt":"2026-09-01T08:00:00.000Z","source":"owned"}'
coat='{"id":"seed-coat","name":"Navy wool coat","category":"layer","kind":"coat","styles":["western"],
  "photo":"seed-coat-original.png","original":"seed-coat-original.png",
  "createdAt":"2026-09-01T08:00:00.000Z","source":"owned"}'
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c --argjson boots "$boots" --argjson coat "$coat" '
  .pieces = [$boots, $coat] + (.pieces | map(select(.id != "seed-boots" and .id != "seed-coat")))
  | .photoTipsSeen = true')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
