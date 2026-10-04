#!/bin/sh
set -e
date="${1:-2026-10-05}"
hours=$(jq -cn --arg date "$date" '[range(0; 24) as $hour | {at: "\($date)T\($hour | tostring | if length == 1 then "0" + . else . end):00:00+02:00", celsius: (if $hour == 10 then 4 elif $hour == 14 then 9 else 6 end), precipitation: "none", chance: 0, windMs: 2}]')
forecast=$(jq -cn --argjson hours "$hours" '{hours: $hours, attribution: {logo: "https://weatherkit.apple.com/assets/branding/en/Apple_Weather_blk_en_3X_090122.png", url: "https://weatherkit.apple.com/legal-attribution.html"}}')
DEVICE="${DEVICE:-Closet Development}" sh .maestro/lib/fixture.sh "forecast=$forecast"
