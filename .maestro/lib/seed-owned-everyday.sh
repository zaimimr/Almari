#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
DEVICE="$device" sh .maestro/lib/seed-owned.sh
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
db="$data/Documents/SQLite/ExpoSQLiteStorage"
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c '
  .styling.everyday = {version: ((.styling.everyday.version // 0) + 1), occasion: "everyday", style: "western", hijab: "always", sample: false}
  | .styling.profile.coverageLevel = "moderate"
  | .styling.wardrobe = "owned"
  | .styling.today = null
  | .styling.onboarded = true
  | .styling.name = "Sara"')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
