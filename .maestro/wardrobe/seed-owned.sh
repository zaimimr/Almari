#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
xcrun simctl terminate "$device" com.zaimimran.almari || true
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
photos="$data/Documents/closet-photos"
mkdir -p "$photos"
cp assets/wardrobe/ivory-tunic.png "$photos/seed-tunic-original.png"
cp assets/wardrobe/charcoal-trousers.png "$photos/seed-trousers-original.png"
cp assets/wardrobe/chocolate-loafers.png "$photos/seed-boots-original.png"
cp assets/wardrobe/ivory-hijab.png "$photos/seed-hijab-original.png"
db="$data/Documents/SQLite/ExpoSQLiteStorage"
piece() {
  printf '{"id":"seed-%s","name":"%s","category":"%s","kind":"%s","styles":["western"],"photo":"seed-%s-original.png","original":"seed-%s-original.png","createdAt":"2026-09-01T08:00:00.000Z","source":"owned"}' "$1" "$2" "$3" "$4" "$1" "$1"
}
owned="[$(piece tunic "Rose tunic" tunic tunic),$(piece trousers "Grey trousers" bottom trousers),$(piece boots "Black boots" shoes boots),$(piece hijab "Sand hijab" hijab hijab)]"
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c --argjson owned "$owned" '
  .pieces = $owned + (.pieces | map(select(.id | startswith("seed-") | not)))
  | .photoTipsSeen = true')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
