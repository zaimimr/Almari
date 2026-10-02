import { studioPrompt } from "./prompt";
import {
  fitsModel,
  imageType,
  isInstallId,
  maxBodyBytes,
  parseStudioRequest,
} from "./request";

export type Env = {
  AI: Ai;
  APP_TOKEN: string;
  STUDIO_MODEL: "@cf/black-forest-labs/flux-2-klein-4b";
  GLOBAL_DAILY_LIMIT: string;
  LIMITS: KVNamespace;
};

const fail = (error: string, status: number) =>
  Response.json({ error }, { status });

const isLimitError = (error: unknown) =>
  /4006|daily free allocation|rate limit/i.test(String(error));

const fromBase64 = (data: string) =>
  Uint8Array.from(atob(data), (char) => char.charCodeAt(0));

async function generate(env: Env, image: Blob, prompt: string) {
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("input_image_0", image);
  form.append("width", "1024");
  form.append("height", "1024");
  const formResponse = new Response(form);
  try {
    const result = await env.AI.run(env.STUDIO_MODEL, {
      multipart: {
        body: formResponse.body!,
        contentType: formResponse.headers.get("content-type")!,
      },
    });
    const bytes = result.image ? fromBase64(result.image) : null;
    const type = bytes && imageType(bytes);
    if (bytes && type) return { bytes, type };
    console.error("studio", "no image", JSON.stringify(result).slice(0, 500));
  } catch (error) {
    console.error("studio", String(error));
    if (isLimitError(error)) return "limit";
  }
  return null;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
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

    if (!fitsModel(new Uint8Array(await piece.image.arrayBuffer())))
      return fail("dimensions", 400);

    const key = `all:${new Date().toISOString().slice(0, 10)}`;
    const count = Number((await env.LIMITS.get(key)) ?? 0);
    if (count >= Number(env.GLOBAL_DAILY_LIMIT)) return fail("limit", 429);

    const shot = await generate(env, piece.image, studioPrompt(piece));
    if (shot === "limit") return fail("limit", 429);
    if (!shot) return fail("generate", 502);
    ctx.waitUntil(
      env.LIMITS.put(key, String(count + 1), {
        expirationTtl: 2 * 24 * 60 * 60,
      }),
    );
    return new Response(shot.bytes, {
      headers: { "content-type": shot.type },
    });
  },
} satisfies ExportedHandler<Env>;
