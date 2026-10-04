#!/bin/sh
. "$(dirname "$0")/jobs.sh"
put "[
$(job ready-kurta sage-kurta kurta "Sage kurta" '{"state":"ready","styles":["desi"]}'),
$(job ready-blazer navy-blazer blazer "Navy blazer" '{"state":"ready","styles":["western"],"prepared":{"palette":[{"rgb":[40,50,80],"share":1}]}}')
]"
