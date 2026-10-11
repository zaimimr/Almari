#!/bin/bash
set -e
device="${DEVICE:-Closet Development}"
app="ios/build/Build/Products/Release-iphonesimulator/Almari.app"
if [ ! -d "$app" ] || [ "$REBUILD" = "1" ]; then
  xcodebuild -workspace ios/Almari.xcworkspace -scheme Almari -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet build
fi
xcrun simctl boot "$device" 2>/dev/null || true
xcrun simctl install "$device" "$app"
udid=$(xcrun simctl list devices | grep -F "$device (" | grep -oE '[0-9A-F-]{36}' | head -1)
[ $# -gt 0 ] || set -- .maestro/*/
status=0
for folder in "$@"; do
  [ "$(basename "$folder")" = "lib" ] && continue
  if [ -f "$folder" ]; then
    flows=("$folder")
  else
    flows=("${folder%/}"/*.yaml)
  fi
  for flow in "${flows[@]}"; do
    DEVICE="$device" sh .maestro/lib/clear.sh
    grep -E '^# seed: ' "$flow" | sed -E 's/^# seed: //' | perl -pe 's/,(?=[\w-]+\.sh)/\n/g' | while read -r line; do
      read -ra seed <<< "$line"
      if [ ${#seed[@]} -gt 0 ]; then
        DEVICE="$device" sh ".maestro/lib/${seed[0]}" "${seed[@]:1}"
      fi
    done
    seed_file="${flow%.yaml}.seed"
    if [ -f "$seed_file" ]; then
      while read -r line; do
        read -ra seed <<< "$line"
        if [ ${#seed[@]} -gt 0 ]; then
          DEVICE="$device" sh ".maestro/lib/${seed[0]}" "${seed[@]:1}"
        fi
      done < "$seed_file"
    fi
    fixture_file="$(xcrun simctl getenv "$device" HOME)/almari-fixtures.json"
    fixture_studio="ok"
    if [ -f "$fixture_file" ]; then
      fixture_studio=$(jq -r '.studio // "ok"' "$fixture_file")
    fi
    case "$fixture_studio" in
      ok|offline|limit|fail) ;;
      *) fixture_studio="ok" ;;
    esac
    DEVICE="$device" sh .maestro/lib/fixture.sh "studio=$fixture_studio"
    out=$(mktemp -d)
    if ~/.maestro/bin/maestro --device "$udid" test --test-output-dir "$out" "$flow"; then
      printf 'PASS %s\n' "$flow"
    else
      status=$?
      printf 'FAIL %s\n' "$flow"
    fi
    find "$out" -type d -name takeScreenshot -exec cp -R {}/. . \;
  done
done
exit $status
