#!/bin/sh
set -eu
device="${DEVICE:-Closet Development}"
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
db="$data/Documents/SQLite/ExpoSQLiteStorage"
closet=$(sqlite3 "$db" "select value from storage where key = 'closet.v3'")
next=$(printf '%s' "$closet" | jq -c '
  .pieces |= map(if .id == "seed-tunic" then .attributes = {sleeve:"long",length:"knee",volume:"voluminous",pattern:"solid"} | .sources = {sleeve:"confirmed",length:"confirmed"} | .colors = [{rgb:[238,228,211],share:1}] elif .id == "seed-trousers" then .attributes = {length:"ankle"} | .sources = {length:"confirmed"} | .colors = [{rgb:[65,64,70],share:1}] else . end)
  | .styling.today = null
  | .imports = []')
escaped=$(printf '%s' "$next" | sed "s/'/''/g")
sqlite3 "$db" "update storage set value = '$escaped' where key = 'closet.v3'"
analysis='{"people":1,"garments":[{"region":"upper","partial":false,"labels":[{"group":"kind","value":"tunic","score":0.3},{"group":"sleeve","value":"long","score":0.3},{"group":"length","value":"knee","score":0.3},{"group":"volume","value":"voluminous","score":0.3},{"group":"pattern","value":"solid","score":0.3}],"palette":[{"rgb":[238,228,211],"share":1}],"embedding":null},{"region":"pants","partial":false,"labels":[{"group":"kind","value":"trousers","score":0.3},{"group":"length","value":"ankle","score":0.3}],"palette":[{"rgb":[65,64,70],"share":1}],"embedding":null}]}'
cp tests/fixtures/vision/outfit-body.jpg "$data/Documents/inspiration-fixture.jpg"
DEVICE="$device" sh .maestro/lib/fixture.sh "inspiration=$analysis" "inspirationPhoto=file://$data/Documents/inspiration-fixture.jpg"
