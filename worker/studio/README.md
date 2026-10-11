# Almari studio worker

Turns a selected piece into a studio photo with Workers AI (`STUDIO_MODEL` in `wrangler.jsonc`). The app posts multipart form data with `X-App-Token: <APP_TOKEN>` and `X-Install-Id`.

`image` is the selected cutout or crop. Optional `original` is the full photo used to recover parts missing from the selection. Each side must be between 64 and 512 pixels, and each file at most 8 MB. The app scales references to a 500-pixel maximum and centres narrow references on white padding to meet the minimum without stretching fabric. Invalid dimensions return HTTP 400 before inference. `area` is a JSON rectangle (`x`, `y`, `width`, `height`) locating the selection in the original, normalized from the top-left. Optional `category`, `kind`, `name`, `colour`, `details` and `note` describe the item. Owner notes override guessed item details and determine the arrangement. Without a cutout, the app sends the original as `image`.

Transient provider errors and missing image responses receive one retry with a fresh multipart body. Klein attempts each have a 40-second deadline within an 85-second request budget. The app waits up to 185 seconds. Quota and content rejections are not retried. The daily successful-image counter increments once after recovery. Provider attempts can still incur charges when no image is delivered. Klein prompt references use image 0 for the selection and image 1 for the original.

The Worker also supports `STUDIO_MODEL=bytedance/seedream-5-pro` through the existing AI binding and [Cloudflare Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/). It sends the selection followed by the optional original as inline image references, requests one 1024-by-1024 image without a watermark, and downloads the returned image within a shared 180-second request budget. A second paid edit compares this draft with the same source references to remove unsupported additions and restore visible details. The draft is the last reference and never replaces either source. Only the corrected image is delivered and counted; a failed correction does not return the draft. Both edits share the same deadline. Fast transient failures can retry within that budget; a timeout does not start another paid generation. Seedream prompt references use image 1 for the selection and image 2 for the original. When a selection area is provided, its normalized bounding box locates the fabric in the original without restricting the restored outline. Downloads accept only HTTPS ByteDance storage URLs and JPEG/PNG bytes, with the existing 8 MB image limit. Redirects are inspected manually and rejected; Workers does not support the `error` redirect mode. Gateway balance errors return HTTP 429 without a retry or a successful-image count. No additional provider key is required with funded Unified Billing.

Seedream transport tests pass. The twenty-case actual-Worker evaluation returned images for every case after two separate client-error recoveries; fidelity remains unproven. The correction candidate has eight returned images but the expanded comparison stopped when gateway credits depleted again. The initial insufficient-balance error was resolved by the user topping up the existing Cloudflare account. Production configuration still selects Klein 4B. Switch the model in `wrangler.jsonc` after the real-photo evaluation passes.

Run `npx tsx scripts/studio-eval.ts` from the repository root to prepare crop inputs, prompts and request hashes in `planning/build/studio/crop-eval/preview` without inference. Pass a case name to prepare one case, or `--output=<directory>` to isolate a run. Only `--live` loads Studio configuration from `.env` and calls the deployed Worker, which incurs inference usage; live results remain in `planning/build/studio/crop-eval` with output hashes and timing. Failed requests record their status and latency and allow the remaining cases to run; a batch with failures exits nonzero. `npm run test:offline` exercises the domain, app transport and Worker with network access disabled. `npm run test:vision` tests the production Swift mask and background algorithms locally on macOS. See `docs/qa/system-analysis.md` and `docs/qa/user-stories.md` for scope and visual-quality limitations.

## Deploy

```sh
cd worker/studio
npm install
npx wrangler login
openssl rand -hex 32 | tee /dev/stderr | npx wrangler secret put APP_TOKEN
npx wrangler deploy
```

`wrangler deploy` creates the `LIMITS` KV namespace on the first deploy. The daily limit for all phones together is `GLOBAL_DAILY_LIMIT` in `wrangler.jsonc`.

Then set these for the app build (`.env` at the repo root, and as EAS environment variables):

```sh
EXPO_PUBLIC_STUDIO_URL=https://almari-studio.<account>.workers.dev
EXPO_PUBLIC_STUDIO_TOKEN=<APP_TOKEN>
```

## Test

```sh
npm test
npm run typecheck
```
