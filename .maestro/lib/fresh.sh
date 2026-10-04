#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
udid=$(xcrun simctl list devices | grep -F "$device (" | grep -oE '[0-9A-F-]{36}' | head -1)
~/.maestro/bin/maestro --device "$udid" test "$(dirname "$0")/sample-closet.yaml" >/dev/null
xcrun simctl terminate "$device" com.zaimimran.almari || true
