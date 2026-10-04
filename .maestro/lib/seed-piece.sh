#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
DEVICE="$device" sh .maestro/lib/seed-owned-everyday.sh
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
photos="$data/Documents/closet-photos"
cp assets/wardrobe/olive-maxi-dress.png "$photos/seed-open-dress-original.png"
cp assets/wardrobe/ivory-tunic.png "$photos/seed-long-blouse-original.png"
db="$data/Documents/SQLite/ExpoSQLiteStorage"
extra='[
  {"id":"seed-open-dress","name":"Seed dress","category":"dress","kind":"dress","styles":["western"],
   "photo":"seed-open-dress-original.png","original":"seed-open-dress-original.png",
   "createdAt":"2026-09-02T08:00:00.000Z","source":"owned",
   "attributes":{"sheer":false},"sources":{"sheer":"confirmed"}},
  {"id":"seed-long-blouse","name":"Long blouse","category":"top","kind":"blouse","styles":["western"],
   "photo":"seed-long-blouse-original.png","original":"seed-long-blouse-original.png",
   "createdAt":"2026-09-02T08:00:00.000Z","source":"owned",
   "attributes":{"sleeve":"long","sheer":false,"fabric":"cotton"},"sources":{"sleeve":"proposed","sheer":"confirmed","fabric":"proposed"}}
]'
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c --argjson extra "$extra" '
  .pieces = (.pieces | map(
    if .id == "seed-tunic" then .styles = ["desi", "western"] | .colors = [{rgb: [214, 160, 160], share: 1}] | .setId = "seed-set"
    elif .id == "seed-trousers" then .setId = "seed-set"
    elif .id == "seed-hijab" then .colors = [{rgb: [214, 196, 168], share: 1}]
    else . end)) + $extra')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
