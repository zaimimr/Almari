#!/bin/sh
set -e
device="Closet Development"
xcrun simctl terminate "$device" com.zaimimran.almari || true
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
photos="$data/Documents/closet-photos"
mkdir -p "$photos"
rm -f "$photos"/group*.png "$photos"/single*.png
sips -s format jpeg assets/wardrobe/taupe-abaya.png --out "$photos/group-original.jpg" >/dev/null
sips -s format jpeg assets/wardrobe/navy-blazer.png --out "$photos/single-original.jpg" >/dev/null
cp assets/wardrobe/mauve-hijab.png "$photos/group-region-1.png"
cp assets/wardrobe/ivory-tunic.png "$photos/group-region-2.png"
cp assets/wardrobe/charcoal-trousers.png "$photos/group-region-3.png"
db="$data/Documents/SQLite/ExpoSQLiteStorage"
jobs='[
  {"id":"group","source":"group-original.jpg","createdAt":"2026-10-01T08:00:00Z","state":"queued","attempts":0,"captureId":"group","people":2,
   "region":{"kind":"head","cutout":"group-region-1.png","frame":{"x":0.3,"y":0.02,"width":0.4,"height":0.22},"share":0.06,"partial":false}},
  {"id":"group-2","source":"group-original.jpg","createdAt":"2026-10-01T08:00:00Z","state":"queued","attempts":0,"captureId":"group","people":2,
   "region":{"kind":"upper","cutout":"group-region-2.png","frame":{"x":0.25,"y":0.2,"width":0.5,"height":0.35},"share":0.14,"partial":true}},
  {"id":"group-3","source":"group-original.jpg","createdAt":"2026-10-01T08:00:00Z","state":"queued","attempts":0,"captureId":"group","people":2,
   "region":{"kind":"pants","cutout":"group-region-3.png","frame":{"x":0.3,"y":0.55,"width":0.4,"height":0.43},"share":0.12,"partial":false}},
  {"id":"single","source":"single-original.jpg","createdAt":"2026-10-01T08:00:00Z","state":"queued","attempts":0}
]'
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c --argjson jobs "$jobs" '.imports = $jobs + (.imports | map(select((.id | startswith("group") or startswith("single")) | not)))')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
