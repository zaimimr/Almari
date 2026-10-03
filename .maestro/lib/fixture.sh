#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
xcrun simctl terminate "$device" com.zaimimran.almari || true
file="$(xcrun simctl getenv "$device" HOME)/almari-fixtures.json"
[ -f "$file" ] || echo '{}' > "$file"
for pair in "$@"; do
  key="${pair%%=*}"
  value="${pair#*=}"
  next=$(jq -c --arg key "$key" --arg value "$value" '.[$key] = ($value | try fromjson catch $value)' "$file")
  printf '%s' "$next" > "$file"
done
