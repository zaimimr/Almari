#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
xcrun simctl terminate "$device" com.zaimimran.almari || true
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
sqlite3 "$data/Documents/SQLite/ExpoSQLiteStorage" "update storage set value = '{' where key = 'closet.v3'"
