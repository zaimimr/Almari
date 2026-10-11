import { describe, expect, it, vi } from "vitest";
import {
  generateSeedream,
  seedreamModel,
  seedreamPrompt,
  seedreamCorrectionPrompt,
} from "./seedream";
import { maxImageBytes } from "./request";

const output = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00]);
const url =
  "https://ark-content-generation-v2-ap-southeast-1.tos-ap-southeast-1.volces.com/result.jpeg";
const image = (bytes = output) =>
  new File([bytes], "selection.jpg", { type: "image/jpeg" });

function setup(
  result: Record<string, unknown> = { result: { images: [url] } },
) {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const run = vi.fn().mockResolvedValue(result);
  const download = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(
      async () =>
        new Response(output, { headers: { "content-type": "image/jpeg" } }),
    );
  const controller = new AbortController();
  const signal = controller.signal;
  const generate = (original?: File, selection = image()) =>
    generateSeedream(
      { run } as unknown as Ai,
      { image: selection, original, category: "bottom", kind: "jeans" },
      signal,
    );
  return { run, download, controller, signal, generate };
}

describe("Seedream transport", () => {
  it("locates the selected fabric in the original using normalized coordinates", () => {
    const prompt = seedreamPrompt({
      original: image(),
      area: { x: 0.2, y: 0.3, width: 0.4, height: 0.2 },
    });
    expect(prompt).toContain("Image 2 <bbox>200 300 600 500</bbox>");
    expect(prompt).toContain("matches Image 1");
    expect(prompt).toContain("including parts outside the box");
  });

  it("clamps selection coordinates and omits boxes outside the original", () => {
    const area = { x: -0.2, y: -0.3, width: 1.4, height: 1.6 };
    expect(seedreamPrompt({ original: image(), area })).toContain(
      "<bbox>0 0 999 999</bbox>",
    );
    expect(seedreamPrompt({ area })).not.toContain("<bbox>");
    expect(
      seedreamPrompt({
        original: image(),
        area: { x: 2, y: 2, width: 1, height: 1 },
      }),
    ).not.toContain("<bbox>");
  });

  it("carries the owner's correction and confirmed details into the second pass", () => {
    const prompt = seedreamCorrectionPrompt({
      original: image(),
      area: { x: 0.2, y: 0.3, width: 0.4, height: 0.2 },
      category: "top",
      kind: "t-shirt",
      name: "Ivory hijab",
      note: "A rectangular hijab scarf with two free ends",
      details: "Plain border",
      colour: "ivory",
    });
    expect(prompt).toContain("<bbox>200 300 600 500</bbox>");
    expect(prompt).toContain("Ivory hijab");
    expect(prompt).toContain("A rectangular hijab scarf with two free ends");
    expect(prompt).toContain("Confirmed details: Plain border");
    expect(prompt).toContain("Confirmed colour: ivory");
    expect(prompt).toContain("disagrees with an automatic guess");
    expect(prompt).not.toContain("t-shirt");
  });

  it("keeps selection and original bytes in order and returns image bytes", async () => {
    const context = setup();
    const original = image(new Uint8Array([0xff, 0xd8, 0xff, 0xdb]));
    expect(await context.generate(original)).toEqual({
      bytes: output,
      type: "image/jpeg",
    });
    const [model, input, options] = context.run.mock.calls[0]!;
    expect(model).toBe(seedreamModel);
    expect(input.image).toEqual([
      `data:image/jpeg;base64,${btoa(String.fromCharCode(...output))}`,
      "data:image/jpeg;base64,/9j/2w==",
    ]);
    expect(input.prompt).toContain("Image 1 is the selected item's cutout");
    expect(input.prompt).toContain("Image 2 is the original uncut photo");
    expect(input.size).toBe("1024x1024");
    expect(input.watermark).toBe(false);
    expect(options.signal).toBe(context.signal);
    expect(context.download).toHaveBeenCalledWith(new URL(url), {
      signal: context.signal,
      redirect: "manual",
    });
    const correction = context.run.mock.calls[1]!;
    expect(correction[1].image).toEqual([
      ...input.image,
      `data:image/jpeg;base64,${btoa(String.fromCharCode(...output))}`,
    ]);
    expect(correction[1].prompt).toContain("Correct Image 3");
    expect(correction[1].prompt).toContain("Image 2 is the original photo");
    expect(correction[2].signal).toBe(context.signal);
  });

  it("sends one image when the original is unavailable", async () => {
    const context = setup();
    await context.generate();
    expect(context.run.mock.calls[0]![1].image).toHaveLength(1);
    expect(context.run.mock.calls[0]![1].prompt).toContain("partial crop");
    expect(context.run.mock.calls[1]![1].image).toHaveLength(2);
    expect(context.run.mock.calls[1]![1].prompt).toContain("Correct Image 2");
    expect(context.run.mock.calls[1]![1].prompt).not.toContain(
      "Image 2 is the original photo",
    );
  });

  it("returns the correction rather than the draft", async () => {
    const context = setup();
    const corrected = new Uint8Array([...output, 42]);
    context.download
      .mockResolvedValueOnce(new Response(output))
      .mockResolvedValueOnce(new Response(corrected));
    expect((await context.generate())?.bytes).toEqual(corrected);
    expect(context.run).toHaveBeenCalledTimes(2);
  });

  it("does not deliver the draft when correction returns no image", async () => {
    const context = setup();
    context.download
      .mockResolvedValueOnce(new Response(output))
      .mockResolvedValueOnce(new Response("<html>error</html>"));
    expect(await context.generate()).toBeNull();
    expect(context.run).toHaveBeenCalledTimes(2);
  });

  it("does not start correction when the shared deadline has expired", async () => {
    const context = setup();
    context.download.mockImplementationOnce(async () => {
      context.controller.abort();
      return new Response(output);
    });
    expect(await context.generate()).toBeNull();
    expect(context.run).toHaveBeenCalledOnce();
  });

  it("rejects redirects without following the location", async () => {
    const context = setup();
    context.download.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/private" },
      }),
    );
    await expect(context.generate()).rejects.toThrow("status code 302");
    expect(context.download).toHaveBeenCalledOnce();
    expect(context.download.mock.calls[0]?.[1]?.redirect).toBe("manual");
  });

  it("encodes larger references without exceeding the argument stack", async () => {
    const context = setup();
    const bytes = new Uint8Array(200000).fill(153);
    await context.generate(undefined, image(bytes));
    const encoded = context.run.mock.calls[0]![1].image[0].split(",")[1];
    const decoded = Uint8Array.from(atob(encoded), (char) =>
      char.charCodeAt(0),
    );
    expect(decoded).toEqual(bytes);
  });

  it("returns no image for missing or malformed output lists", async () => {
    for (const result of [
      {},
      { result: null },
      { result: {} },
      { result: { images: [] } },
      { result: { images: [42] } },
    ]) {
      const context = setup(result);
      expect(await context.generate()).toBeNull();
      expect(context.download).not.toHaveBeenCalled();
    }
  });

  it("rejects untrusted hosts, credentials, ports and insecure URLs", async () => {
    for (const address of [
      "https://attacker.example/image.jpg",
      "http://images.volces.com/image.jpg",
      "https://images.volces.com:8000/image.jpg",
      "https://name:password@images.volces.com/image.jpg",
      "https://127.0.0.1/image.jpg",
      "https://notvolces.com/image.jpg",
      "not a URL",
    ]) {
      const context = setup({ result: { images: [address] } });
      await expect(context.generate()).rejects.toThrow();
      expect(context.download).not.toHaveBeenCalled();
    }
  });

  it("accepts BytePlus output storage", async () => {
    const address =
      "https://images.tos-ap-southeast-1.bytepluses.com/image.jpg";
    const context = setup({ result: { images: [address] } });
    expect(await context.generate()).toEqual({
      bytes: output,
      type: "image/jpeg",
    });
  });

  it("reports unsuccessful downloads for the Worker's retry handling", async () => {
    const context = setup();
    context.download.mockResolvedValue(new Response(null, { status: 503 }));
    await expect(context.generate()).rejects.toThrow("status code 503");
  });

  it("rejects a declared oversized image before reading it", async () => {
    const context = setup();
    context.download.mockResolvedValue(
      new Response(output, {
        headers: { "content-length": String(maxImageBytes + 1) },
      }),
    );
    await expect(context.generate()).rejects.toThrow("image size limit");
  });

  it("bounds downloads when the provider omits content length", async () => {
    const context = setup();
    const cancel = vi.fn();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(maxImageBytes + 1));
      },
      cancel,
    });
    context.download.mockResolvedValue(new Response(body));
    await expect(context.generate()).rejects.toThrow("image size limit");
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("does not accept HTML or an empty response as a generated image", async () => {
    for (const body of ["<html>error</html>", null]) {
      const context = setup();
      context.download.mockResolvedValue(new Response(body));
      expect(await context.generate()).toBeNull();
    }
  });

  it("rejects WebP even when the response claims JPEG", async () => {
    const context = setup();
    context.download.mockResolvedValue(
      new Response(new TextEncoder().encode("RIFF0000WEBP"), {
        headers: { "content-type": "image/jpeg" },
      }),
    );
    expect(await context.generate()).toBeNull();
  });
});
