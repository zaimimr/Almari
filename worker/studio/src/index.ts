import { studioPrompt } from "./prompt";
import { isInstallId, maxBodyBytes, parseStudioRequest } from "./request";

export type Env = {
  GEMINI_API_KEY: string;
  APP_TOKEN: string;
  GEMINI_MODEL: string;
  DAILY_LIMIT: string;
  GLOBAL_DAILY_LIMIT: string;
  LIMITS: KVNamespace;
};

const fail = (error: string, status: number) =>
  Response.json({ error }, { status });

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (let start = 0; start < bytes.length; start += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  return btoa(binary);
}

const fromBase64 = (data: string) =>
  Uint8Array.from(atob(data), (char) => char.charCodeAt(0));

type GeminiPart = {
  inlineData?: { mimeType: string; data: string };
  inline_data?: { mime_type: string; data: string };
};

async function generate(env: Env, image: File, prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: image.type,
                  data: toBase64(new Uint8Array(await image.arrayBuffer())),
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
        },
      }),
    },
  );
  if (!response.ok) {
    console.error("gemini", response.status, await response.text());
    return null;
  }
  const result: {
    candidates?: { content?: { parts?: GeminiPart[] } }[];
  } = await response.json();
  const parts = result.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const data = part.inlineData?.data ?? part.inline_data?.data;
    const type = part.inlineData?.mimeType ?? part.inline_data?.mime_type;
    if (data && type?.startsWith("image/"))
      return { bytes: fromBase64(data), type };
  }
  console.error("gemini", "no image", JSON.stringify(result).slice(0, 500));
  return null;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.method !== "POST") return fail("method", 405);
    if (
      !env.APP_TOKEN ||
      request.headers.get("authorization") !== `Bearer ${env.APP_TOKEN}`
    )
      return fail("token", 401);
    const install = request.headers.get("x-install-id");
    if (!isInstallId(install)) return fail("install", 400);
    if (Number(request.headers.get("content-length") ?? 0) > maxBodyBytes)
      return fail("size", 413);

    const form = await request.formData().catch(() => null);
    if (!form) return fail("body", 400);
    const piece = parseStudioRequest(form);
    if ("error" in piece) return fail(piece.error, piece.status);

    const day = new Date().toISOString().slice(0, 10);
    const keys = [`install:${install}:${day}`, `all:${day}`];
    const counts = await Promise.all(
      keys.map(async (key) => Number((await env.LIMITS.get(key)) ?? 0)),
    );
    const [mine = 0, all = 0] = counts;
    if (
      mine >= Number(env.DAILY_LIMIT) ||
      all >= Number(env.GLOBAL_DAILY_LIMIT)
    )
      return fail("limit", 429);

    const shot = await generate(env, piece.image, studioPrompt(piece));
    if (!shot) return fail("generate", 502);
    ctx.waitUntil(
      Promise.all(
        keys.map((key, index) =>
          env.LIMITS.put(key, String((counts[index] ?? 0) + 1), {
            expirationTtl: 2 * 24 * 60 * 60,
          }),
        ),
      ),
    );
    return new Response(shot.bytes, {
      headers: { "content-type": shot.type },
    });
  },
} satisfies ExportedHandler<Env>;
