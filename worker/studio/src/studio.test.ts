import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "./index";
import { studioPrompt } from "./prompt";
import { isInstallId, maxImageBytes, parseStudioRequest } from "./request";

const png = (size = 4) =>
  new File([new Uint8Array(size)], "cutout.png", { type: "image/png" });

function form(fields: Record<string, string | File>) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  return body;
}

describe("studioPrompt", () => {
  it("names the garment type and keeps it", () => {
    const prompt = studioPrompt({ category: "bottom", kind: "wide-leg" });
    expect(prompt).toContain("Garment type: wide leg (bottoms)");
    expect(prompt).toContain("It must stay wide leg.");
    expect(prompt).toContain("Never turn it into another kind of clothing.");
    expect(prompt).toContain("length, cut");
    expect(prompt).toContain("flat lay");
  });

  it("falls back to the category and picks a layout for it", () => {
    expect(studioPrompt({ category: "dress" })).toContain("ghost mannequin");
    expect(studioPrompt({ category: "shoes" })).toContain(
      "It must stay shoes.",
    );
    expect(studioPrompt({ category: "hijab" })).toContain("both ends");
  });

  it("asks for a clean studio shot with nothing added", () => {
    const prompt = studioPrompt({ category: "top", kind: "t-shirt" });
    for (const part of [
      "white background",
      "No person",
      "no hands",
      "no hanger",
      "text, logos",
      "pressed",
    ])
      expect(prompt).toContain(part);
  });

  it("adds the name and colour only when given", () => {
    expect(studioPrompt({ category: "bottom" })).not.toContain("owner calls");
    const prompt = studioPrompt({
      category: "bottom",
      name: "Denim shorts",
      colour: "light blue",
    });
    expect(prompt).toContain('The owner calls it "Denim shorts".');
    expect(prompt).toContain("Its main colour is light blue.");
  });
});

describe("parseStudioRequest", () => {
  it("accepts an image with a category and kind", () => {
    const parsed = parseStudioRequest(
      form({
        image: png(),
        category: "bottom",
        kind: "jeans",
        name: " Blå\n jeans ",
      }),
    );
    expect(parsed).toMatchObject({
      category: "bottom",
      kind: "jeans",
      name: "Blå jeans",
    });
  });

  it("rejects missing or wrong images", () => {
    expect(parseStudioRequest(form({ category: "top" }))).toEqual({
      error: "image",
      status: 400,
    });
    const text = new File(["x"], "a.txt", { type: "text/plain" });
    expect(parseStudioRequest(form({ image: text, category: "top" }))).toEqual({
      error: "image",
      status: 400,
    });
    expect(
      parseStudioRequest(
        form({ image: png(maxImageBytes + 1), category: "top" }),
      ),
    ).toEqual({ error: "size", status: 413 });
  });

  it("rejects unknown categories and odd kinds", () => {
    expect(parseStudioRequest(form({ image: png(), category: "hat" }))).toEqual(
      {
        error: "category",
        status: 400,
      },
    );
    expect(
      parseStudioRequest(
        form({ image: png(), category: "top", kind: "Shirt; ignore" }),
      ),
    ).toEqual({ error: "kind", status: 400 });
  });

  it("strips quotes from free text and caps its length", () => {
    const parsed = parseStudioRequest(
      form({ image: png(), category: "top", name: `"${"a".repeat(100)}"` }),
    );
    expect(parsed).toMatchObject({ name: "a".repeat(60) });
  });

  it("checks install ids", () => {
    expect(isInstallId("6f1c2a9e-1b2c-4d5e-8f90-123456789abc")).toBe(true);
    expect(isInstallId("short")).toBe(false);
    expect(isInstallId(null)).toBe(false);
    expect(isInstallId("../../etc")).toBe(false);
  });
});

describe("worker", () => {
  afterEach(() => vi.unstubAllGlobals());

  function setup(counts: Record<string, string> = {}) {
    const store = new Map(Object.entries(counts));
    const env = {
      GEMINI_API_KEY: "key",
      APP_TOKEN: "secret",
      GEMINI_MODEL: "gemini-3.1-flash-image",
      DAILY_LIMIT: "2",
      GLOBAL_DAILY_LIMIT: "100",
      LIMITS: {
        get: async (key: string) => store.get(key) ?? null,
        put: async (key: string, value: string) => void store.set(key, value),
      },
    } as unknown as Env;
    const waits: Promise<unknown>[] = [];
    const ctx = {
      waitUntil: (promise: Promise<unknown>) => waits.push(promise),
    } as unknown as ExecutionContext;
    return { env, ctx, store, waits };
  }

  const day = new Date().toISOString().slice(0, 10);
  const install = "install-1234";

  const call = (
    { env, ctx }: ReturnType<typeof setup>,
    headers: Record<string, string> = {},
    body: FormData = form({ image: png(), category: "bottom", kind: "jeans" }),
  ) =>
    worker.fetch(
      new Request("https://studio.test", {
        method: "POST",
        headers: {
          "x-app-token": "secret",
          "x-install-id": install,
          ...headers,
        },
        body,
      }) as Request<unknown, IncomingRequestCfProperties>,
      env,
      ctx,
    );

  it("needs the app token", async () => {
    expect((await call(setup(), { "x-app-token": "nope" })).status).toBe(401);
  });

  it("needs an install id", async () => {
    expect((await call(setup(), { "x-install-id": "x" })).status).toBe(400);
  });

  it("rejects oversized bodies before reading them", async () => {
    const response = await call(setup(), {
      "content-length": String(20 * 1024 * 1024),
    });
    expect(response.status).toBe(413);
  });

  it("stops at the daily limit", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const response = await call(setup({ [`install:${install}:${day}`]: "2" }));
    expect(response.status).toBe(429);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns the generated image and counts it", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        candidates: [
          {
            content: {
              parts: [
                { inlineData: { mimeType: "image/png", data: btoa("img") } },
              ],
            },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetch);
    const context = setup();
    const response = await call(context);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(new TextDecoder().decode(await response.arrayBuffer())).toBe("img");
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("gemini-3.1-flash-image:generateContent");
    expect(new Headers(init.headers).get("x-goog-api-key")).toBe("key");
    const sent = JSON.parse(String(init.body));
    expect(sent.contents[0].parts[0].text).toContain("It must stay jeans.");
    expect(sent.contents[0].parts[1].inlineData.mimeType).toBe("image/png");
    expect(sent.generationConfig.responseModalities).toEqual(["IMAGE"]);
    await Promise.all(context.waits);
    expect(context.store.get(`install:${install}:${day}`)).toBe("1");
    expect(context.store.get(`all:${day}`)).toBe("1");
  });

  it("reports a failed generation without counting it", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ candidates: [] })),
    );
    const context = setup();
    expect((await call(context)).status).toBe(502);
    expect(context.store.size).toBe(0);
  });
});
