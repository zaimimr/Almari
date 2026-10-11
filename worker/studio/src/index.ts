import { studioPrompt } from "./prompt";
import {
  fitsModel,
  imageType,
  isInstallId,
  maxBodyBytes,
  parseStudioRequest,
  type StudioRequest,
} from "./request";

export type Env = {
  AI: Ai;
  APP_TOKEN: string;
  STUDIO_MODEL: "@cf/black-forest-labs/flux-2-klein-4b";
  GLOBAL_DAILY_LIMIT: string;
  LIMITS: KVNamespace;
};

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-app-token, x-install-id",
};

const fail = (error: string, status: number) =>
  Response.json({ error }, { status, headers: cors });

const isLimitError = (error: unknown) =>
  /4006|daily free allocation|rate limit/i.test(String(error));

const fromBase64 = (data: string) =>
  Uint8Array.from(atob(data), (char) => char.charCodeAt(0));

async function generateOnce(
  env: Env,
  piece: StudioRequest,
  signal: AbortSignal,
) {
  const form = new FormData();
  form.append("prompt", studioPrompt(piece));
  form.append("input_image_0", piece.image);
  if (piece.original) form.append("input_image_1", piece.original);
  form.append("width", "1024");
  form.append("height", "1024");
  const formResponse = new Response(form);
  try {
    const result = await env.AI.run(
      env.STUDIO_MODEL,
      {
        multipart: {
          body: formResponse.body!,
          contentType: formResponse.headers.get("content-type")!,
        },
      },
      { signal },
    );
    const bytes = result.image ? fromBase64(result.image) : null;
    const type = bytes && imageType(bytes);
    if (bytes && type) return { bytes, type };
    console.error("studio", "no image", JSON.stringify(result).slice(0, 500));
  } catch (error) {
    console.error("studio", String(error));
    if (isLimitError(error)) return "limit";
    if (/3030|output has been flagged|content rejection/i.test(String(error)))
      return "rejected";
    if (
      !/\b3043\b|internal server|(?:http|status(?: code)?)[ :]*(?:500|502|503|504)\b|timeout|timed out|overload|temporar|AbortError/i.test(
        String(error),
      )
    )
      return "rejected";
  }
  return null;
}

async function generate(env: Env, piece: StudioRequest) {
  const deadline = AbortSignal.timeout(85000);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const signal = AbortSignal.any([deadline, AbortSignal.timeout(40000)]);
    const result = await generateOnce(env, piece, signal);
    if (result !== null || deadline.aborted) return result;
  }
  return null;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return fail("method", 405);
    if (!env.APP_TOKEN || request.headers.get("x-app-token") !== env.APP_TOKEN)
      return fail("token", 401);
    const install = request.headers.get("x-install-id");
    if (!isInstallId(install)) return fail("install", 400);
    if (Number(request.headers.get("content-length") ?? 0) > maxBodyBytes)
      return fail("size", 413);

    const form = await request.formData().catch(() => null);
    if (!form) return fail("body", 400);
    const piece = parseStudioRequest(form);
    if ("error" in piece) return fail(piece.error, piece.status);

    const images = [piece.image, ...(piece.original ? [piece.original] : [])];
    const bytes = await Promise.all(
      images.map(async (image) => new Uint8Array(await image.arrayBuffer())),
    );
    if (bytes.some((image) => !fitsModel(image)))
      return fail("dimensions", 400);

    const key = `all:${new Date().toISOString().slice(0, 10)}`;
    const count = Number((await env.LIMITS.get(key)) ?? 0);
    if (count >= Number(env.GLOBAL_DAILY_LIMIT)) return fail("limit", 429);

    const shot = await generate(env, piece);
    if (shot === "limit") return fail("limit", 429);
    if (!shot || shot === "rejected") return fail("generate", 502);
    ctx.waitUntil(
      env.LIMITS.put(key, String(count + 1), {
        expirationTtl: 2 * 24 * 60 * 60,
      }),
    );
    return new Response(shot.bytes, {
      headers: { ...cors, "content-type": shot.type },
    });
  },
} satisfies ExportedHandler<Env>;
