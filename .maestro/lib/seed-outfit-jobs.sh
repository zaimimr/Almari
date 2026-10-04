#!/bin/sh
. "$(dirname "$0")/jobs.sh"
put "[
$(job outfit-tunic ivory-tunic tunic "Ivory tunic" '{"state":"ready","styles":["western"]}'),
$(job outfit-trousers charcoal-trousers trousers "Charcoal trousers" '{"state":"ready","styles":["western"]}'),
$(job outfit-loafers chocolate-loafers loafers "Chocolate loafers" '{"state":"ready","styles":["western"]}')
]"
