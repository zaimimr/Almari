set -eu
device="${DEVICE:-Closet Development}"
data=$(xcrun simctl get_app_container "$device" com.zaimimran.almari data)
python3 - "$data/Documents/SQLite/ExpoSQLiteStorage" <<'PY'
import json
import sqlite3
import sys
with sqlite3.connect(sys.argv[1]) as connection:
    row = connection.execute("select value from storage where key = ?", ("closet.v3",)).fetchone()
    closet = json.loads(row[0])
    closet["lists"] = {"colours": [], "fabrics": [{"id": "own-fabric-1", "name": "Soft weave"}], "kinds": []}
    connection.execute("update storage set value = ? where key = ?", (json.dumps(closet), "closet.v3"))
PY
