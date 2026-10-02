#!/bin/sh
set -e
device="Closet Development"
xcrun simctl terminate "$device" com.zaimimran.almari || true
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
mkdir -p "$data/Documents/closet-photos"
cp dist/enhance-check/sage-kurta.png "$data/Documents/closet-photos/fixture-plain.png"
cp dist/enhance-check/sage-kurta-enhanced.png "$data/Documents/closet-photos/fixture-enhanced.png"
db="$data/Documents/SQLite/ExpoSQLiteStorage"
piece='{"id":"fixture-kurta","name":"Fixture kurta","category":"tunic","kind":"kurta","styles":["desi"],"photo":"fixture-enhanced.png","createdAt":"2026-10-01T08:00:00Z","source":"owned","variants":{"enhanced":"fixture-enhanced.png","plain":"fixture-plain.png"}}'
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c --argjson piece "$piece" '.pieces = [$piece] + (.pieces | map(select(.id != "fixture-kurta")))')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
