#!/bin/sh
. "$(dirname "$0")/jobs.sh"
put "[
$(job review-kurta sage-kurta kurta "Sage kurta" '{"checks":["uncertain"],"question":"category","prepared":{"labels":[{"group":"kind","value":"kurta","score":0.5},{"group":"kind","value":"blouse","score":0.45}],"palette":[{"rgb":[167,174,152],"share":1}]}}'),
$(job review-blazer navy-blazer blazer "Navy blazer" '{"checks":["uncertain"],"question":"subcategory","prepared":{"labels":[{"group":"kind","value":"blazer","score":0.5},{"group":"kind","value":"jacket","score":0.45}],"palette":[{"rgb":[40,50,80],"share":1}]}}')
]"
