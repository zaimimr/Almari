#!/bin/sh
device="${DEVICE:-Closet Development}"
rm -f "$(xcrun simctl getenv "$device" HOME)/almari-fixtures.json"
xcrun simctl terminate "$device" com.zaimimran.almari 2>/dev/null || true
