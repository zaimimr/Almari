# Studio photos

Updated 2 October 2026. Studio no longer runs on the phone. The on-device FLUX.2 [klein] MLX spike was dropped, and the photo is now made by a Cloudflare Worker.

## How it works

1. On the phone, the Enhanced cutout is repaired (small holes filled, ragged edges smoothed) and placed on white at up to 500 px on the long edge.
2. The phone sends it to the Worker in `worker/studio`, with the category, the subcategory and the main colour.
3. The Worker runs Workers AI FLUX.2 [klein] 4B. The prompt picks a pose from the category and subcategory, and names the main colour.
4. The phone whitens the background of the result and saves it as the Studio variant. The original photo is always kept.

## Limits and cost

- One global cap of 1000 photos a day. There is no per phone limit.
- Workers Paid plan. About $0.0012 per photo.
- When the cap or the Workers AI allocation is used up, the app says so. It only says offline when the phone is actually offline.

## What we tried

- FLUX.2 [klein] 9B kept texture more faithfully, but the owner preferred the 4B results.
- Matching the output colour to the cutout was rejected, because it turned black items grey.
