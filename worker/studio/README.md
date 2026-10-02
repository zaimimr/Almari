# Almari studio worker

Turns a piece cutout into a studio photo with Workers AI (`STUDIO_MODEL` in `wrangler.jsonc`). The app posts multipart form data (`image` as PNG or JPEG of at most 512x512, `category`, optional `kind`, `name`, `colour`) with `X-App-Token: <APP_TOKEN>` and `X-Install-Id`.

## Deploy

```sh
cd worker/studio
npm install
npx wrangler login
openssl rand -hex 32 | tee /dev/stderr | npx wrangler secret put APP_TOKEN
npx wrangler deploy
```

`wrangler deploy` creates the `LIMITS` KV namespace on the first deploy. Limits per day are in `wrangler.jsonc` (`DAILY_LIMIT` per install, `GLOBAL_DAILY_LIMIT` in total).

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
