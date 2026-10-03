#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
xcrun simctl terminate "$device" com.zaimimran.almari || true
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
db="$data/Documents/SQLite/ExpoSQLiteStorage"
wears='[
  ["seed-wear-1", "2026-10-01T09:00:00.000Z", ["seed-blazer"], "piece"],
  ["seed-wear-2", "2026-10-01T09:00:00.000Z", ["seed-ankle-trousers"], "piece"],
  ["seed-wear-3", "2026-10-01T09:00:00.000Z", ["seed-knee-skirt"], "piece"],
  ["seed-wear-4", "2026-10-01T09:00:00.000Z", ["seed-blouse"], "piece"],
  ["seed-wear-5", "2026-10-01T09:00:00.000Z", ["seed-chiffon-hijab"], "piece"],
  ["seed-wear-6", "2026-10-02T08:00:00.000Z", ["seed-tunic", "seed-trousers", "seed-boots", "seed-hijab"], null],
  ["seed-wear-7", "2026-09-12T08:00:00.000Z", ["seed-abaya", "seed-boots", "seed-chiffon-hijab"], null],
  ["seed-wear-8", "2026-03-14T08:00:00.000Z", ["seed-dress"], "piece"]
]'
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c --argjson wears "$wears" '
  .feedback = (.feedback | map(select(.id | startswith("seed-") | not))) + ($wears | map(
    {id: .[0], at: .[1], kind: "wore", pieceIds: .[2],
     request: {occasion: "everyday", style: "western", garmentType: null, keptIds: [], excludedIds: [],
               weather: {source: "unknown"}, hijab: null, wardrobe: "owned"},
     engine: "rules"} + (if .[3] then {scope: .[3]} else {} end)))')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
