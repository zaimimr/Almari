set -e
device="${DEVICE:-Closet Development}"
xcrun simctl terminate "$device" com.zaimimran.almari || true
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
photos="$data/Documents/closet-photos"
db="$data/Documents/SQLite/ExpoSQLiteStorage"
mkdir -p "$photos"
job() {
  extra=${5:-}
  [ -n "$extra" ] || extra="{}"
  cp "assets/wardrobe/$2.png" "$photos/$1.png"
  jq -nc --arg id "$1" --arg kind "$3" --arg name "$4" --argjson extra "$extra" '{
    id: $id, source: ($id + ".png"), createdAt: "2026-10-01T08:00:00.000Z", state: "review", attempts: 1,
    prepared: { original: ($id + ".png"), cutout: ($id + ".png"), thumbnail: null, frame: null, instances: 1,
      labels: [{ group: "kind", value: $kind, score: 0.9 }], palette: [{ rgb: [150, 150, 150], share: 1 }], embedding: null },
    kind: $kind, name: $name, checks: []
  } * $extra'
}
put() {
  closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
  next=$(printf '%s' "$closet" | jq -c --argjson jobs "$1" '.imports = $jobs | .photoTipsSeen = true')
  escaped=$(printf '%s' "$next" | sed "s/'/''/g")
  sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
}
