#!/bin/sh
set -e
date="${1:-2026-10-05}"
next=$(date -j -v+1d -f %Y-%m-%d "$date" +%Y-%m-%d)
day() {
  jq -cn --arg date "$1" '[range(0; 24) as $hour | {at: "\($date)T\($hour | tostring | if length == 1 then "0" + . else . end):00:00+02:00", celsius: (if $hour == 10 then 4 elif $hour == 14 then 9 elif $hour >= 17 then 3 else 6 end), precipitation: (if $hour >= 15 then "rain" else "none" end), chance: (if $hour >= 15 then 0.8 else 0 end), windMs: 2}]'
}
hours=$(jq -cn --argjson a "$(day "$date")" --argjson b "$(day "$next")" '$a + $b')
forecast=$(jq -cn --argjson hours "$hours" '{hours: $hours, attribution: {logo: "https://weatherkit.apple.com/assets/branding/en/Apple_Weather_blk_en_3X_090122.png", url: "https://weatherkit.apple.com/legal-attribution.html"}}')
DEVICE="${DEVICE:-Closet Development}" sh .maestro/lib/fixture.sh "forecast=$forecast"
