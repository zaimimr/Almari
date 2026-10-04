#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
DEVICE="$device" sh .maestro/lib/seed-owned-everyday.sh
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
db="$data/Documents/SQLite/ExpoSQLiteStorage"
keep="${1:-owned}"
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c --arg keep "$keep" '
  .pieces = (.pieces | map(select($keep == "samples" or ($keep == "owned" and .source == "owned"))) | map(
    if .id == "seed-tunic" then .colors = [{rgb: [230, 140, 170], share: 1}]
    elif .id == "seed-hijab" then .colors = [{rgb: [214, 198, 176], share: 1}]
    elif .id == "seed-chiffon-hijab" then .colors = [{rgb: [225, 185, 180], share: 1}]
    elif .id == "seed-blazer" then .colors = [{rgb: [35, 45, 75], share: 1}]
    else . end))
  | .sampleCatalog = (if $keep == "samples" then 0 else .sampleCatalog end)
  | .imports = []
  | .looks = []
  | .feedback = []')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
