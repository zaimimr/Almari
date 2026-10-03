#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
app="ios/build/Build/Products/Release-iphonesimulator/Almari.app"
if [ ! -d "$app" ] || [ "$REBUILD" = "1" ]; then
  xcodebuild -workspace ios/Almari.xcworkspace -scheme Almari -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet build
fi
xcrun simctl boot "$device" 2>/dev/null || true
xcrun simctl install "$device" "$app"
[ $# -gt 0 ] || set -- .maestro/*/
out=$(mktemp -d)
status=0
~/.maestro/bin/maestro --device "$(xcrun simctl list devices | grep "$device" | grep -oE '[0-9A-F-]{36}' | head -1)" test --test-output-dir "$out" "$@" || status=$?
find "$out" -type d -name takeScreenshot -exec cp -R {}/. . \;
exit $status
