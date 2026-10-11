# Almari studio worker

Turns a selected piece into a studio photo with Workers AI (`STUDIO_MODEL` in `wrangler.jsonc`). The app posts multipart form data with `X-App-Token: <APP_TOKEN>` and `X-Install-Id`.

`image` is the selected cutout or crop. Optional `original` is the full photo used to recover parts missing from the selection. Both images must be at most 512x512 and 8 MB. `area` is a JSON rectangle (`x`, `y`, `width`, `height`) locating the selection in the original, normalized from the top-left. Optional `category`, `kind`, `name`, `colour`, `details` and `note` describe the item. Owner notes override guessed item details and determine the arrangement. Without a cutout, the app sends the original as `image`.

Transient provider errors and missing image responses receive one retry with a fresh multipart body. Each attempt has a 40-second deadline; the app waits up to 90 seconds. Quota and content rejections are not retried. The daily successful-image counter increments once after recovery. Provider attempts can still incur charges when no image is delivered. Prompt references use image 0 for the selection and image 1 for the original.

Run `npx tsx scripts/studio-eval.ts` from the repository root to prepare crop inputs, prompts and request hashes in `planning/build/studio/crop-eval/preview` without inference. Pass a case name to prepare one case. Only `--live` loads Studio configuration from `.env` and calls the deployed Worker, which incurs inference usage; live results remain in `planning/build/studio/crop-eval` with output hashes and timing. `npm run test:offline` exercises the domain, app transport and Worker with network access disabled. `npm run test:vision` tests the production Swift mask and background algorithms locally on macOS. See `docs/qa/system-analysis.md` and `docs/qa/user-stories.md` for scope and visual-quality limitations.

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
