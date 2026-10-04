#!/bin/sh
. "$(dirname "$0")/jobs.sh"
put "[
$(job hijab-1 mauve-hijab hijab "Mauve hijab" '{"checks":["uncertain"],"question":"subcategory","prepared":{"labels":[{"group":"kind","value":"hijab","score":0.5},{"group":"kind","value":"shawl","score":0.45}]}}'),
$(job hijab-2 ivory-hijab hijab "Ivory hijab" '{"checks":["uncertain"],"question":"subcategory","prepared":{"labels":[{"group":"kind","value":"hijab","score":0.5},{"group":"kind","value":"shawl","score":0.45}]}}'),
$(job hijab-3 chocolate-hijab hijab "Chocolate hijab" '{"checks":["uncertain"],"question":"subcategory","prepared":{"labels":[{"group":"kind","value":"hijab","score":0.5},{"group":"kind","value":"shawl","score":0.45}]}}'),
$(job hijab-4 mauve-hijab shawl "Mauve shawl" '{"checks":["uncertain"],"question":"subcategory","prepared":{"labels":[{"group":"kind","value":"shawl","score":0.5},{"group":"kind","value":"hijab","score":0.45}]}}')
]"
