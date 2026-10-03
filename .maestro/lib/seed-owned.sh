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
cp assets/wardrobe/navy-blazer.png "$photos/seed-blazer-original.png"
cp assets/wardrobe/ivory-trousers.png "$photos/seed-ankle-trousers-original.png"
cp assets/wardrobe/ivory-salwar.png "$photos/seed-knee-skirt-original.png"
cp assets/wardrobe/taupe-abaya.png "$photos/seed-abaya-original.png"
cp assets/wardrobe/sage-kurta.png "$photos/seed-blouse-original.png"
cp assets/wardrobe/mauve-hijab.png "$photos/seed-chiffon-hijab-original.png"
cp assets/wardrobe/olive-maxi-dress.png "$photos/seed-dress-original.png"
db="$data/Documents/SQLite/ExpoSQLiteStorage"
piece() {
  printf '{"id":"seed-%s","name":"%s","category":"%s","kind":"%s","styles":["western"],"photo":"seed-%s-original.png","original":"seed-%s-original.png","createdAt":"2026-09-01T08:00:00.000Z","source":"owned"%s}' "$1" "$2" "$3" "$4" "$1" "$1" "${5:-}"
}
owned="[$(piece tunic "Rose tunic" tunic tunic),$(piece trousers "Grey trousers" bottom trousers),$(piece boots "Black boots" shoes boots),$(piece hijab "Sand hijab" hijab hijab),
$(piece blazer "Navy blazer" layer blazer ',"attributes":{"sleeve":"long","fabric":"wool"},"sources":{"sleeve":"confirmed","fabric":"confirmed"}'),
$(piece ankle-trousers "Ivory trousers" bottom trousers ',"attributes":{"length":"ankle"},"sources":{"length":"confirmed"}'),
$(piece knee-skirt "Knee skirt" bottom skirt ',"attributes":{"length":"knee"},"sources":{"length":"confirmed"}'),
$(piece abaya "Taupe abaya" dress abaya ',"attributes":{"sleeve":"long","length":"ankle"},"sources":{"sleeve":"confirmed","length":"confirmed"}'),
$(piece blouse "Sage blouse" top blouse ',"attributes":{"sleeve":"long","length":"hip"},"sources":{"sleeve":"confirmed","length":"confirmed"}'),
$(piece chiffon-hijab "Chiffon hijab" hijab hijab ',"attributes":{"fabric":"chiffon"},"sources":{"fabric":"confirmed"}'),
$(piece dress "Olive maxi dress" dress dress)]"
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c --argjson owned "$owned" '
  .pieces = $owned + (.pieces | map(select(.id | startswith("seed-") | not)))
  | .photoTipsSeen = true')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
