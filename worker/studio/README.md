# Almari studio worker

Turns a piece cutout into a studio photo with Gemini. The app posts multipart form data (`image`, `category`, optional `kind`, `name`, `colour`) with `Authorization: Bearer <APP_TOKEN>` and `X-Install-Id`.

## Deploy

```sh
cd worker/studio
npm install
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
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
