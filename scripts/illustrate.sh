#!/bin/sh
set -e
TOKEN=$(grep oauth_token ~/Library/Preferences/.wrangler/config/default.toml | head -1 | sed 's/.*= *"\(.*\)"/\1/')
ACC=7bcf12042794aad844dbe1365061b774
MODEL="${MODEL:-@cf/black-forest-labs/flux-2-dev}"
out="$1"; prompt="$2"
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACC/ai/run/$MODEL" \
  -H "Authorization: Bearer $TOKEN" \
  -F "prompt=$prompt" -F "width=768" -F "height=1024" -F "steps=${STEPS:-25}" ${SEED:+-F "seed=$SEED"} > "$out.json"
python3 -c "import json,base64,sys;d=json.load(open('$out.json'));r=d.get('result') or {};img=r.get('image');
open('$out','wb').write(base64.b64decode(img)) if img else sys.exit(json.dumps(d)[:600])"
