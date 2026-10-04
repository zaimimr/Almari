#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
xcrun simctl terminate "$device" com.zaimimran.almari 2>/dev/null || true
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
mkdir -p "$data/Documents/SQLite"
sqlite3 "$data/Documents/SQLite/ExpoSQLiteStorage" "create table if not exists storage (key text primary key not null, value text); insert or replace into storage (key, value) values ('closet.v3', '{')"
