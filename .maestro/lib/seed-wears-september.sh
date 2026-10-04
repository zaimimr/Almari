#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
db="$data/Documents/SQLite/ExpoSQLiteStorage"
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c '
  .feedback += [
    {id: "seed-wear-september", at: "2026-09-21T08:00:00.000Z", kind: "wore",
     pieceIds: ["seed-blouse", "seed-ankle-trousers", "seed-boots", "seed-hijab"],
     request: {occasion: "work", style: "western", garmentType: null, keptIds: [], excludedIds: [],
               weather: {source: "unknown"}, hijab: null, wardrobe: "owned"},
     engine: "rules"},
    {id: "seed-wear-july", at: "2026-07-20T08:00:00.000Z", kind: "wore",
     pieceIds: ["seed-dress", "seed-hijab"],
     request: {occasion: "everyday", style: "western", garmentType: null, keptIds: [], excludedIds: [],
               weather: {source: "unknown"}, hijab: null, wardrobe: "owned"},
     engine: "rules"}]')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
