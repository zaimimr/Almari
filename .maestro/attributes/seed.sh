#!/bin/sh
set -e
device="Closet Development"
xcrun simctl terminate "$device" com.zaimimran.almari || true
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
photos="$data/Documents/closet-photos"
mkdir -p "$photos"
cp assets/wardrobe/sage-kurta.png "$photos/seed-kurta-original.png"
cp assets/wardrobe/sage-kurta.png "$photos/seed-job-original.png"
db="$data/Documents/SQLite/ExpoSQLiteStorage"
piece='{"id":"seed-kurta","name":"Seed kurta","category":"tunic","kind":"kurta","styles":["desi"],
  "photo":"seed-kurta-original.png","original":"seed-kurta-original.png",
  "createdAt":"2026-09-01T08:00:00.000Z","source":"owned","attributes":{"length":"ankle"}}'
job='{"id":"seed-job","source":"seed-job-original.png","createdAt":"2026-10-01T08:00:00.000Z",
  "state":"review","attempts":1,
  "prepared":{"original":"seed-job-original.png","cutout":null,"thumbnail":null,"frame":null,
    "instances":0,"labels":[{"group":"kind","value":"kurta","score":0.2}],
    "palette":[{"rgb":[167,174,152],"share":1}],"embedding":null},
  "kind":"kurta","name":"Sage kurta","alternatives":["kurta"],
  "checks":["attribute"],"attributeCheck":"length",
  "attributes":{"length":"knee","formality":2},
  "attributeSources":{"length":"proposed","formality":"proposed"}}'
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c --argjson piece "$piece" --argjson job "$job" '
  .pieces = [$piece] + (.pieces | map(select(.id != "seed-kurta")))
  | .imports = (.imports | map(select(.id != "seed-job"))) + [$job]
  | .photoTipsSeen = true
  | del(.attributeRefresh)')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
