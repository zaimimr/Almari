#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
db="$data/Documents/SQLite/ExpoSQLiteStorage"
look='{"id":"seed-look-weekday","name":"Weekday sage","pieceIds":["seed-blouse","seed-ankle-trousers","seed-hijab","seed-boots"],"createdAt":"2026-09-22T08:00:00.000Z","occasion":"everyday"}'
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c --argjson look "$look" '
  .looks = [$look] + (.looks | map(select(.id != $look.id)))')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
