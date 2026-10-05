#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
xcrun simctl terminate "$device" com.zaimimran.almari || true
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
photos="$data/Documents/closet-photos"
mkdir -p "$photos"
flat() {
  magick "assets/wardrobe/$1.png" -background white -alpha remove -alpha off "$photos/$2.jpg"
  cp "assets/wardrobe/$1.png" "$photos/$2-cut.png"
}
flat sage-kurta studio-top
flat charcoal-trousers studio-bottom
flat chocolate-loafers studio-shoes
flat navy-blazer studio-layer
flat olive-maxi-dress studio-dress
flat ivory-hijab studio-hijab
db="$data/Documents/SQLite/ExpoSQLiteStorage"
piece() {
  printf '{"id":"studio-%s","name":"%s","category":"%s","kind":"%s","styles":["western"],"createdAt":"2026-09-01T08:00:00.000Z","source":"owned",%s}' "$1" "$2" "$3" "$4" "$5"
}
studio() {
  printf '"photo":"studio-%s.jpg","original":"studio-%s.jpg","variants":{"plain":"studio-%s-cut.png","studio":"studio-%s.jpg"}' "$1" "$1" "$1" "$1"
}
owned="[$(piece top "Sage blouse" top blouse "$(studio top)"),
$(piece bottom "Grey trousers" bottom trousers "$(studio bottom)"),
$(piece shoes "Brown loafers" shoes loafers "$(studio shoes)"),
$(piece hijab "Ivory hijab" hijab hijab "$(studio hijab)"),
$(piece layer "Navy blazer" layer blazer '"photo":"studio-layer.jpg","original":"studio-layer.jpg","variants":{"enhanced":"studio-layer-cut.png"}'),
$(piece dress "Olive maxi dress" dress dress '"photo":"studio-dress.jpg","original":"studio-dress.jpg"')]"
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c --argjson owned "$owned" '
  .pieces = $owned
  | .styling.today = null
  | .photoTipsSeen = true')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
