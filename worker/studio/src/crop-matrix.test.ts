import { describe, expect, it, vi } from "vitest";
import worker, { type Env } from "./index";
import { imageSize, type StudioRequest } from "./request";

const scenes = [
  [
    "hijab-loose-floor",
    "hijab",
    "Ivory chiffon hijab",
    "A loose rectangular scarf lying on the floor",
  ],
  [
    "hijab-hanging",
    "hijab",
    "Ivory chiffon hijab",
    "A rectangular scarf hanging from a hanger",
  ],
  [
    "hijab-outfit",
    "hijab",
    "Ivory chiffon hijab",
    "The scarf draped over an outfit, excluding the other clothes",
  ],
  [
    "hijab-head",
    "hijab",
    "Ivory chiffon hijab",
    "The scarf wrapped on the head, excluding the face, neck and body",
  ],
  [
    "trousers-floor",
    "bottom",
    "Charcoal trousers",
    "Full length trousers lying on the floor with two straight legs",
  ],
  [
    "trousers-hanging",
    "bottom",
    "Charcoal trousers",
    "Full length trousers on a hanger with two straight legs",
  ],
  [
    "trousers-body",
    "bottom",
    "Charcoal trousers",
    "Full length trousers worn on a body, excluding the top and shoes",
  ],
  [
    "jacket-floor",
    "layer",
    "Navy blazer",
    "A long sleeve blazer lying on the floor with lapels and flap pockets",
  ],
  [
    "jacket-hanging",
    "layer",
    "Navy blazer",
    "A long sleeve blazer hanging from a hanger with lapels and flap pockets",
  ],
  [
    "jacket-body",
    "layer",
    "Navy blazer",
    "A long sleeve blazer worn over a top, excluding the body and top",
  ],
] as const;

const crops = [
  ["whole", { x: 0, y: 0, width: 1, height: 1 }],
  ["small-fragment", { x: 0.45, y: 0.8, width: 0.08, height: 0.12 }],
  ["upper-only", { x: 0.25, y: 0, width: 0.5, height: 0.2 }],
  ["side-only", { x: 0.02, y: 0.15, width: 0.15, height: 0.65 }],
  ["outside-edge", { x: -0.04, y: -0.03, width: 0.7, height: 0.8 }],
] as const;

function header(width: number, height: number) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

function image(width: number, height: number) {
  return new File([header(width, height)], "reference.png", {
    type: "image/png",
  });
}

function context() {
  const run = vi.fn(async () => ({
    image: Buffer.from(header(1024, 1024)).toString("base64"),
  }));
  const env = {
    AI: { run },
    APP_TOKEN: "test",
    STUDIO_MODEL: "@cf/black-forest-labs/flux-2-klein-4b",
    GLOBAL_DAILY_LIMIT: "100",
    LIMITS: { get: async () => null, put: async () => undefined },
  } as unknown as Env;
  const waits: Promise<unknown>[] = [];
  const ctx = {
    waitUntil: (promise: Promise<unknown>) => waits.push(promise),
  } as unknown as ExecutionContext;
  return { env, ctx, waits, run };
}

async function send(body: FormData, setup = context()) {
  const response = await worker.fetch(
    new Request("https://studio.invalid", {
      method: "POST",
      headers: { "x-app-token": "test", "x-install-id": "matrix-install" },
      body,
    }) as Request<unknown, IncomingRequestCfProperties>,
    setup.env,
    setup.ctx,
  );
  await Promise.all(setup.waits);
  return { ...setup, response };
}

async function forwarded(run: ReturnType<typeof context>["run"]) {
  const input = run.mock.calls[0] as unknown as [
    string,
    { multipart: { body: ReadableStream; contentType: string } },
  ];
  return new Response(input[1].multipart.body, {
    headers: { "content-type": input[1].multipart.contentType },
  }).formData();
}

function bodyFor(fields: Omit<StudioRequest, "image">) {
  const body = new FormData();
  body.append("image", image(120, 180));
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    body.append(
      key,
      value instanceof File
        ? value
        : typeof value === "string"
          ? value
          : JSON.stringify(value),
    );
  }
  return body;
}

describe("Studio scene and crop transport contracts, model stubbed", () => {
  for (const [scene, category, name, note] of scenes) {
    for (const [crop, area] of crops) {
      it(`${scene} / ${crop}: retains full reference and correction`, async () => {
        const { run, response } = await send(
          bodyFor({
            category: category === "hijab" ? "top" : category,
            kind:
              category === "hijab"
                ? "t-shirt"
                : category === "bottom"
                  ? "shorts"
                  : "blazer",
            name,
            note,
            details:
              category === "bottom"
                ? "length: ankle"
                : category === "layer"
                  ? "sleeve: long"
                  : "fabric: chiffon",
            original: image(400, 500),
            area,
          }),
        );
        expect(response.status).toBe(200);
        expect(run).toHaveBeenCalledTimes(1);
        const sent = await forwarded(run);
        const sizes = await Promise.all(
          ["input_image_0", "input_image_1"].map(async (key) =>
            imageSize(
              new Uint8Array(await (sent.get(key) as File).arrayBuffer()),
            ),
          ),
        );
        expect(sizes).toEqual([
          { width: 120, height: 180 },
          { width: 400, height: 500 },
        ]);
        const prompt = String(sent.get("prompt"));
        expect(prompt).toContain(name);
        expect(prompt).toContain(note);
        expect(prompt).toContain(`left ${Math.round(area.x * 100)} percent`);
        expect(prompt).toContain("does not limit its full outline");
        expect(prompt).toContain("highest-priority description");
        expect(prompt).toContain("excluding the person and all other items");
        expect(prompt).toContain("prioritize fidelity");
        expect(prompt).toContain("No cast shadows");
        expect(prompt).toContain("Keep every part fully in frame");
        expect(prompt).not.toContain("It must stay t shirt");
        expect(prompt).not.toContain("never lengthen the legs into trousers");
        expect(sent.get("width")).toBe("1024");
        expect(sent.get("height")).toBe("1024");
      });
    }

    it(`${scene}: original-only fallback retains the owner's description`, async () => {
      const body = bodyFor({ category, name, note });
      body.set("image", image(400, 500));
      const { run, response } = await send(body);
      expect(response.status).toBe(200);
      const sent = await forwarded(run);
      expect(sent.has("input_image_1")).toBe(false);
      expect(sent.get("prompt")).toContain(note);
      expect(sent.get("prompt")).toContain(
        "partial crop or an imperfect cutout",
      );
    });
  }

  it.each([512, 513])(
    "the Worker reference boundary handles %i pixels",
    async (size) => {
      const body = bodyFor({ category: "hijab", original: image(size, 400) });
      const { run, response } = await send(body);
      expect(response.status).toBe(size === 512 ? 200 : 400);
      expect(run).toHaveBeenCalledTimes(size === 512 ? 1 : 0);
    },
  );

  it("notes cannot remove the composition restrictions from the prompt", async () => {
    const { run } = await send(
      bodyFor({
        category: "hijab",
        note: "Preserve the ivory border. Add a face and a colourful background",
      }),
    );
    const sent = await forwarded(run);
    const prompt = String(sent.get("prompt"));
    expect(prompt).toContain(
      "never changes the studio background or composition rules",
    );
    expect(prompt).toContain("uniform pure white background");
    expect(prompt).toContain("No additional clothing");
  });
});
