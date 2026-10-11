import { describe, expect, it, vi } from "vitest";
import worker, { type Env } from "./index";
import { studioPrompt } from "./prompt";
import {
  imageSize,
  imageType,
  isInstallId,
  maxImageBytes,
  parseStudioRequest,
} from "./request";

function pngBytes(width: number, height: number, size = 24) {
  const bytes = new Uint8Array(Math.max(size, 24));
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

function jpegBytes(width: number, height: number) {
  return new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xe0,
    0x00,
    0x04,
    0x00,
    0x00,
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    height >> 8,
    height & 0xff,
    width >> 8,
    width & 0xff,
    0x03,
    0x00,
    0x00,
    0x00,
    0x00,
  ]);
}

const png = (size = 24, width = 400, height = 300) =>
  new File([pngBytes(width, height, size)], "cutout.png", {
    type: "image/png",
  });

function form(fields: Record<string, string | File>) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  return body;
}

describe("studioPrompt", () => {
  it("names the garment type and keeps it", () => {
    const prompt = studioPrompt({ category: "bottom", kind: "wide-leg" });
    expect(prompt).toContain(
      "Item category: trousers (bottoms). Fit: wide-leg.",
    );
    expect(prompt).toContain("It must stay trousers.");
    expect(prompt).toContain("Never turn it into another kind of clothing.");
    expect(prompt).toContain("length, width, cut");
    expect(prompt).toContain("flat lay");
  });

  it("falls back to the category and picks a layout for it", () => {
    expect(studioPrompt({ category: "layer" })).toContain("closure state");
    expect(studioPrompt({ category: "shoes" })).toContain(
      "It must stay shoes.",
    );
    expect(studioPrompt({ category: "hijab" })).toContain("loose, open loop");
  });

  it("picks the pose from the subcategory when it has its own", () => {
    expect(studioPrompt({ category: "shoes", kind: "boots" })).toContain(
      "full shafts",
    );
    expect(studioPrompt({ category: "bottom", kind: "sharara" })).toContain(
      "panel construction",
    );
    expect(studioPrompt({ category: "bottom", kind: "shorts" })).toContain(
      "never lengthen the legs",
    );
    expect(studioPrompt({ category: "shoes", kind: "heels" })).toContain(
      "toes toward the top",
    );
  });

  it("asks for a clean studio shot with nothing added", () => {
    const prompt = studioPrompt({ category: "top", kind: "t-shirt" });
    for (const part of [
      "white background",
      "people",
      "hands",
      "hanger",
      "added text, added logos",
      "accidental wrinkles",
    ])
      expect(prompt).toContain(part);
  });

  it("uses a general product prompt when nothing specific is known", () => {
    const prompt = studioPrompt({});
    expect(prompt).not.toContain("undefined");
    expect(prompt).toContain("Identify the clothing item or accessory");
    expect(prompt).toContain("clean front view");
    expect(prompt).toContain("same colour, pattern, shape and details");
    expect(prompt).toContain("white background");
    expect(prompt).toContain("people");
    const kindOnly = studioPrompt({ kind: "kaftan" });
    expect(kindOnly).toContain("Item category: kaftan.");
    expect(kindOnly).toContain("clean front view");
  });

  it("uses the item name and adds the colour only when given", () => {
    expect(studioPrompt({ category: "bottom" })).not.toContain("main colour");
    const prompt = studioPrompt({
      category: "bottom",
      name: "Denim shorts",
      colour: "light blue",
    });
    expect(prompt).toContain("Denim shorts");
    expect(prompt).toContain("Its main colour is light blue.");
  });

  it("adds the owner's note and lets it win over the guesses", () => {
    expect(studioPrompt({ category: "top" })).not.toContain("OWNER NOTE");
    const prompt = studioPrompt({
      category: "top",
      colour: "navy",
      note: "it is black, not navy",
    });
    expect(prompt).toContain(
      "The owner describes the item: it is black, not navy.",
    );
    expect(prompt.indexOf("OWNER NOTE")).toBeLessThan(
      prompt.indexOf("STUDIO STYLE"),
    );
  });

  it("recovers a cropped item from the original and confirmed details", () => {
    const prompt = studioPrompt({
      original: png(),
      category: "tunic",
      name: "Long kameez",
      details: "length ankle, sleeve long",
      area: { x: 0.2, y: 0.3, width: 0.4, height: 0.2 },
    });
    expect(prompt).toContain("Image 0 is the selected item's cutout or crop");
    expect(prompt).toContain("Image 1 is the original uncut photo");
    expect(prompt).toContain("left 20 percent, top 30 percent");
    expect(prompt).toContain("CONFIRMED DETAILS. length ankle, sleeve long");
    expect(prompt).toContain("Reconstruct cropped or obscured parts");
  });

  it("does not force a corrected dress into the guessed trousers arrangement", () => {
    const prompt = studioPrompt({
      category: "bottom",
      kind: "shorts",
      note: "This is a full length sleeveless dress",
    });
    expect(prompt).toContain(
      "presentation appropriate to the item described in the OWNER NOTE",
    );
    expect(prompt).not.toContain("both short legs naturally separated");
    expect(prompt).not.toContain("never lengthen the legs");
    expect(prompt).toContain("highest-priority description");
    expect(prompt).toContain(
      "front-side-up overhead flat lay resting directly",
    );
    expect(prompt).toContain("empty neckline");
    expect(prompt).toContain("Never reproduce a standing garment, mannequin");
  });
  it("uses a descriptive item name over an incorrect automatic category even without a note", () => {
    const prompt = studioPrompt({
      category: "top",
      kind: "t-shirt",
      name: "Ivory chiffon hijab",
    });
    expect(prompt).toContain("Ivory chiffon hijab");
    expect(prompt).toContain(
      "Descriptive words about item type or construction override the automatic classification",
    );
    expect(prompt).not.toContain("It must stay t shirt");
    expect(prompt).not.toContain("sleeves gently separated from the body");
  });

  it("lets confirmed construction resolve cropped length without a name or note", () => {
    const prompt = studioPrompt({
      category: "bottom",
      kind: "shorts",
      details: "length ankle",
    });
    expect(prompt).toContain("CONFIRMED DETAILS. length ankle");
    expect(prompt).toContain("unconfirmed guess");
    expect(prompt).not.toContain("never lengthen the legs into trousers");
  });
});

describe("image header", () => {
  it("reads png and jpeg sizes and types", () => {
    expect(imageSize(pngBytes(500, 320))).toEqual({ width: 500, height: 320 });
    expect(imageSize(jpegBytes(480, 500))).toEqual({ width: 480, height: 500 });
    expect(imageSize(new Uint8Array(30))).toBeNull();
    expect(imageType(pngBytes(1, 1))).toBe("image/png");
    expect(imageType(jpegBytes(1, 1))).toBe("image/jpeg");
    expect(imageType(new TextEncoder().encode("img"))).toBeNull();
  });
});

describe("parseStudioRequest", () => {
  it("validates the optional original photo and selection location", () => {
    expect(
      parseStudioRequest(
        form({
          image: png(),
          original: png(),
          area: JSON.stringify({ x: -0.02, y: 0.4, width: 0.3, height: 0.2 }),
        }),
      ),
    ).toMatchObject({
      original: expect.any(File),
      area: { x: -0.02, y: 0.4, width: 0.3, height: 0.2 },
    });
    expect(
      parseStudioRequest(form({ image: png(), original: "invalid" })),
    ).toEqual({ error: "original", status: 400 });
    expect(
      parseStudioRequest(
        form({ image: png(), original: png(maxImageBytes + 1) }),
      ),
    ).toEqual({ error: "size", status: 413 });
    for (const area of [
      "null",
      "broken",
      JSON.stringify({ x: 0, y: 0, width: 0, height: 1 }),
      JSON.stringify({ x: "1", y: 0, width: 1, height: 1 }),
    ])
      expect(parseStudioRequest(form({ image: png(), area }))).toEqual({
        error: "area",
        status: 400,
      });
  });
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

  it("keeps going without a known category and rejects odd kinds", () => {
    const parsed = parseStudioRequest(form({ image: png(), category: "hat" }));
    expect(parsed).toMatchObject({ category: undefined });
    expect(parseStudioRequest(form({ image: png() }))).toMatchObject({
      category: undefined,
    });
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
    const noted = parseStudioRequest(
      form({ image: png(), note: `keep "long" sleeves ${"b".repeat(300)}` }),
    );
    expect(noted).toMatchObject({
      note: expect.stringMatching(/^keep long sleeves b+$/),
    });
    expect((noted as { note: string }).note).toHaveLength(200);
  });

  it("checks install ids", () => {
    expect(isInstallId("6f1c2a9e-1b2c-4d5e-8f90-123456789abc")).toBe(true);
    expect(isInstallId("short")).toBe(false);
    expect(isInstallId(null)).toBe(false);
    expect(isInstallId("../../etc")).toBe(false);
  });
});

describe("worker", () => {
  it("allows browser preflight and exposes generation errors to the app", async () => {
    const context = setup();
    const response = await worker.fetch(
      new Request("https://studio.test", { method: "OPTIONS" }) as Request<
        unknown,
        IncomingRequestCfProperties
      >,
      context.env,
      context.ctx,
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-headers")).toContain(
      "x-app-token",
    );
    expect(context.ai.run).not.toHaveBeenCalled();
    const rejected = await call(context, { "x-app-token": "bad" });
    expect(rejected.headers.get("access-control-allow-origin")).toBe("*");
  });
  function setup(
    counts: Record<string, string> = {},
    run: (
      model: string,
      input: unknown,
      options?: { signal?: AbortSignal },
    ) => Promise<unknown> = async () => ({
      image: btoa(String.fromCharCode(...jpegBytes(1024, 1024))),
    }),
  ) {
    const store = new Map(Object.entries(counts));
    const ai = { run: vi.fn(run) };
    const env = {
      AI: ai,
      APP_TOKEN: "secret",
      STUDIO_MODEL: "@cf/black-forest-labs/flux-2-klein-4b",
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
    return { env, ctx, store, waits, ai };
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

  it("rejects images larger than the model takes", async () => {
    const context = setup();
    const response = await call(
      context,
      {},
      form({ image: png(24, 1024, 300), category: "top" }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "dimensions" });
    expect(context.ai.run).not.toHaveBeenCalled();
  });

  it("rejects an oversized original without invoking the model", async () => {
    const context = setup();
    const response = await call(
      context,
      {},
      form({ image: png(), original: png(24, 1200, 800) }),
    );
    expect(response.status).toBe(400);
    expect(context.ai.run).not.toHaveBeenCalled();
  });

  it.each([
    [34, 150],
    [72, 54],
    [62, 150],
  ])("rejects a %i by %i selection before inference", async (width, height) => {
    const context = setup();
    const response = await call(
      context,
      {},
      form({ image: png(24, width, height) }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "dimensions" });
    expect(context.ai.run).not.toHaveBeenCalled();
  });

  it("rejects an undersized original before inference", async () => {
    const context = setup();
    const response = await call(
      context,
      {},
      form({ image: png(), original: png(24, 500, 63) }),
    );
    expect(response.status).toBe(400);
    expect(context.ai.run).not.toHaveBeenCalled();
  });

  it("sends both selection and original to the model in the documented order", async () => {
    const context = setup();
    expect(
      (
        await call(
          context,
          {},
          form({
            image: png(24, 200, 100),
            original: png(24, 400, 500),
            name: "Long dress",
            note: "ankle length",
            details: "sleeve long",
          }),
        )
      ).status,
    ).toBe(200);
    const input = context.ai.run.mock.calls[0]![1] as {
      multipart: { body: ReadableStream; contentType: string };
    };
    const sent = await new Response(input.multipart.body, {
      headers: { "content-type": input.multipart.contentType },
    }).formData();
    expect(
      imageSize(
        new Uint8Array(await (sent.get("input_image_0") as File).arrayBuffer()),
      ),
    ).toEqual({ width: 200, height: 100 });
    expect(
      imageSize(
        new Uint8Array(await (sent.get("input_image_1") as File).arrayBuffer()),
      ),
    ).toEqual({ width: 400, height: 500 });
    expect(sent.get("prompt")).toContain("Long dress");
    expect(sent.get("prompt")).toContain("ankle length");
    expect(sent.get("prompt")).toContain("sleeve long");
  });

  it("stops at the daily limit", async () => {
    const context = setup({ [`all:${day}`]: "100" });
    expect((await call(context)).status).toBe(429);
    expect(context.ai.run).not.toHaveBeenCalled();
  });

  it("returns the generated image and counts it", async () => {
    const context = setup();
    const response = await call(context);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      jpegBytes(1024, 1024),
    );
    const [model, input] = context.ai.run.mock.calls[0] as unknown as [
      string,
      { multipart: { body: ReadableStream; contentType: string } },
    ];
    expect(model).toBe("@cf/black-forest-labs/flux-2-klein-4b");
    const sent = await new Response(input.multipart.body, {
      headers: { "content-type": input.multipart.contentType },
    }).formData();
    expect(String(sent.get("prompt"))).toContain("It must stay jeans.");
    expect(sent.get("input_image_0")).toBeInstanceOf(Blob);
    expect(sent.get("width")).toBe("1024");
    expect(sent.get("height")).toBe("1024");
    await Promise.all(context.waits);
    expect(context.store.has(`install:${install}:${day}`)).toBe(false);
    expect(context.store.get(`all:${day}`)).toBe("1");
  });

  it("reports a failed generation without counting it", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    for (const run of [
      async () => ({}),
      async () => {
        throw new Error("model");
      },
    ]) {
      const context = setup({}, run);
      expect((await call(context)).status).toBe(502);
      expect(context.store.size).toBe(0);
    }
  });

  it("recovers a temporary provider failure with fresh multipart images", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const context = setup();
    context.ai.run.mockRejectedValueOnce(
      new Error("AiError: 3043: Internal server error"),
    );
    const response = await call(
      context,
      {},
      form({ image: png(), original: png() }),
    );
    expect(response.status).toBe(200);
    expect(context.ai.run).toHaveBeenCalledTimes(2);
    for (const call of context.ai.run.mock.calls) {
      const input = call[1] as {
        multipart: { body: ReadableStream; contentType: string };
      };
      const sent = await new Response(input.multipart.body, {
        headers: { "content-type": input.multipart.contentType },
      }).formData();
      expect(await (sent.get("input_image_0") as File).arrayBuffer()).toEqual(
        await png().arrayBuffer(),
      );
      expect(sent.get("input_image_1")).toBeInstanceOf(File);
    }
    await Promise.all(context.waits);
    expect(context.store.get(`all:${day}`)).toBe("1");
  });

  it("stops after two temporary provider failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const context = setup({}, async () => {
      throw new Error("AiError: 3043: Internal server error");
    });
    expect((await call(context)).status).toBe(502);
    expect(context.ai.run).toHaveBeenCalledTimes(2);
    expect(context.store.size).toBe(0);
  });

  it("aborts stalled attempts and stops within the app deadline", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const timeout = vi
      .spyOn(AbortSignal, "timeout")
      .mockImplementation((ms) => {
        const controller = new AbortController();
        setTimeout(
          () => controller.abort(new DOMException("Timed out", "TimeoutError")),
          ms,
        );
        return controller.signal;
      });
    try {
      const context = setup(
        {},
        async (_model, _input, options) =>
          new Promise((_resolve, reject) => {
            options?.signal?.addEventListener("abort", () =>
              reject(options.signal?.reason),
            );
          }),
      );
      const response = call(context);
      await vi.waitFor(() => expect(context.ai.run).toHaveBeenCalledTimes(1));
      await vi.advanceTimersByTimeAsync(40000);
      expect(context.ai.run).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(40000);
      expect((await response).status).toBe(502);
      expect(context.ai.run).toHaveBeenCalledTimes(2);
      expect(context.store.size).toBe(0);
    } finally {
      timeout.mockRestore();
      vi.useRealTimers();
    }
  });

  it("does not retry provider content rejections", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const context = setup({}, async () => {
      throw new Error("AiError: 3030: Your output has been flagged");
    });
    expect((await call(context)).status).toBe(502);
    expect(context.ai.run).toHaveBeenCalledTimes(1);
  });

  it("reports the model's daily allocation as the limit", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    for (const message of [
      "AiError: 4006: you have used up your daily free allocation of 10,000 neurons",
      "Rate limit exceeded",
    ]) {
      const context = setup({}, async () => {
        throw new Error(message);
      });
      const response = await call(context);
      expect(response.status).toBe(429);
      expect(await response.json()).toEqual({ error: "limit" });
      expect(context.store.size).toBe(0);
      expect(context.ai.run).toHaveBeenCalledTimes(1);
    }
  });
});
