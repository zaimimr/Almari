import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  renderStudio,
  studioFailure,
  studioTimeout,
} from "../src/state/studio";

const dependencies = vi.hoisted(() => {
  process.env.EXPO_PUBLIC_STUDIO_URL = "https://studio.invalid";
  process.env.EXPO_PUBLIC_STUDIO_TOKEN = "test-token";
  return {
    network: vi.fn(),
    prepare: vi.fn(),
    discard: vi.fn(),
    keepBytes: vi.fn(),
    clear: vi.fn(),
    available: vi.fn(),
    track: vi.fn(),
    fixtures: {} as { studio?: "ok" | "offline" | "limit" | "fail" },
  };
});

vi.mock("expo-network", () => ({
  getNetworkStateAsync: dependencies.network,
}));
vi.mock("../src/state/studioInput", () => ({
  prepareStudioInput: dependencies.prepare,
}));
vi.mock("../src/state/telemetry", () => ({ track: dependencies.track }));
vi.mock("../src/testing/fixtures", () => ({
  fixtures: dependencies.fixtures,
}));
vi.mock("../modules/closet-vision/src", () => ({
  default: {
    isAvailable: dependencies.available,
    clearBackground: dependencies.clear,
  },
}));
vi.mock("../src/storage/local", () => ({
  photoUri: (file: string) => `file:///${file}`,
  installId: async () => "test-install",
  discardPhoto: dependencies.discard,
  keepPhotoBytes: dependencies.keepBytes,
  keepPhotoAs: async (_source: string, name: string) => `${name}.jpg`,
  photoUpload: async (file: string) => new File([file], file),
}));

const image = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const fetchMock = vi.fn<typeof fetch>();
const area = { x: 0.2, y: 0.3, width: 0.1, height: 0.15 };

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(
    new Response(image, { headers: { "content-type": "image/jpeg" } }),
  );
  dependencies.network.mockResolvedValue({ isConnected: true });
  dependencies.prepare.mockImplementation(
    async (_source: string, id: string) => `${id}.jpg`,
  );
  dependencies.discard.mockResolvedValue(undefined);
  dependencies.keepBytes.mockImplementation(
    async (_bytes: Uint8Array, name: string) => name,
  );
  dependencies.available.mockReturnValue(false);
  dependencies.clear.mockResolvedValue("clear.png");
  delete dependencies.fixtures.studio;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Studio upload and recovery without inference", () => {
  it("sends the crop, original, location and owner's corrections together", async () => {
    await renderStudio("sleeve.png", "jacket", {
      category: "layer",
      kind: "blazer",
      name: "  Navy blazer  ",
      colour: "navy",
      original: "outfit.jpg",
      area,
      note: "Full sleeves, preserve lapels and pockets",
      details: "sleeve: long",
    });
    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://studio.invalid");
    expect(options?.headers).toEqual({
      "x-app-token": "test-token",
      "x-install-id": "test-install",
    });
    const body = options?.body as FormData;
    expect(await (body.get("image") as File).text()).toBe(
      "jacket-selection.jpg",
    );
    expect(await (body.get("original") as File).text()).toBe(
      "jacket-reference.jpg",
    );
    expect(JSON.parse(String(body.get("area")))).toEqual(area);
    expect(body.get("name")).toBe("Navy blazer");
    expect(body.get("details")).toBe("sleeve: long");
    expect(body.get("note")).toContain("lapels");
    expect(dependencies.prepare.mock.calls).toEqual([
      ["sleeve.png", "jacket-selection"],
      ["outfit.jpg", "jacket-reference"],
    ]);
    expect(
      dependencies.discard.mock.calls.map(([file]) => file).sort(),
    ).toEqual(["jacket-reference.jpg", "jacket-selection.jpg"]);
  });

  it("supports an original-only photo when subject selection failed", async () => {
    await renderStudio("head.jpg", "hijab", {
      category: "hijab",
      original: "head.jpg",
      area,
    });
    const body = fetchMock.mock.calls[0]![1]?.body as FormData;
    expect(body.has("original")).toBe(false);
    expect(body.has("area")).toBe(false);
    expect(dependencies.prepare).toHaveBeenCalledTimes(1);
  });

  it("keeps a raw result if local background cleanup fails", async () => {
    dependencies.available.mockReturnValue(true);
    dependencies.clear.mockRejectedValue(new Error("mask failed"));
    const file = await renderStudio("pants.png", "pants", {
      category: "bottom",
    });
    expect(file).toMatch(/-raw\.jpg$/);
    expect(dependencies.discard).not.toHaveBeenCalledWith(file);
  });

  it("discards only the temporary raw result after successful cleanup", async () => {
    dependencies.available.mockReturnValue(true);
    const file = await renderStudio("pants.png", "pants", {
      category: "bottom",
    });
    expect(file).toBe("clear.png");
    expect(dependencies.discard).toHaveBeenCalledWith(
      expect.stringMatching(/-raw\.jpg$/),
    );
    expect(dependencies.discard).not.toHaveBeenCalledWith("pants.png");
  });

  it.each([429, 400, 500, 502])(
    "rejects HTTP %i without saving a result and cleans both uploads",
    async (status) => {
      fetchMock.mockResolvedValue(new Response("failure", { status }));
      await expect(
        renderStudio("crop.png", "piece", {
          category: "bottom",
          original: "floor.jpg",
        }),
      ).rejects.toThrow(status === 429 ? "limit" : "failed");
      expect(dependencies.keepBytes).not.toHaveBeenCalled();
      expect(dependencies.discard).toHaveBeenCalledTimes(2);
    },
  );

  it("reports offline separately from a connected transport failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("network"));
    dependencies.network.mockResolvedValue({ isInternetReachable: false });
    await expect(
      renderStudio("crop.png", "piece", { category: "hijab" }),
    ).rejects.toThrow("offline");
    dependencies.network.mockResolvedValue({ isConnected: true });
    await expect(
      renderStudio("crop.png", "piece", { category: "hijab" }),
    ).rejects.toThrow("failed");
  });

  it("aborts a stalled generation at the app timeout and cleans the upload", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      async (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    const pending = expect(
      renderStudio("crop.png", "piece", { category: "layer" }),
    ).rejects.toThrow("failed");
    await vi.advanceTimersByTimeAsync(studioTimeout);
    await pending;
    expect(dependencies.network).not.toHaveBeenCalled();
    expect(dependencies.discard).toHaveBeenCalledWith("piece-selection.jpg");
  });

  it("cleans the selection if preparing the original fails", async () => {
    dependencies.prepare.mockImplementation(
      async (_source: string, id: string) => {
        if (id.endsWith("reference")) throw new Error("missing original");
        return `${id}.jpg`;
      },
    );
    await expect(
      renderStudio("crop.png", "piece", {
        category: "layer",
        original: "original.jpg",
      }),
    ).rejects.toThrow("missing original");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(dependencies.discard).toHaveBeenCalledWith("piece-selection.jpg");
  });

  it.each(["ok", "offline", "limit", "fail"] as const)(
    "fixture %s never prepares uploads or calls a provider",
    async (fixture) => {
      vi.useFakeTimers();
      dependencies.fixtures.studio = fixture;
      const result = renderStudio("crop.png", "piece", { category: "hijab" });
      const assertion =
        fixture === "ok"
          ? expect(result).resolves.toMatch(/studio.*\.jpg$/)
          : expect(result).rejects.toThrow(
              fixture === "fail" ? "failed" : fixture,
            );
      await vi.advanceTimersByTimeAsync(1500);
      await assertion;
      expect(fetchMock).not.toHaveBeenCalled();
      expect(dependencies.prepare).not.toHaveBeenCalled();
    },
  );

  it("classifies unknown errors as failure", () => {
    expect(studioFailure(new Error("limit"))).toBe("limit");
    expect(studioFailure(new Error("offline"))).toBe("offline");
    expect(studioFailure("offline")).toBe("failed");
  });

  it.each([
    ["text/html", "Service unavailable"],
    ["application/json", '{"error":"failed"}'],
    ["image/jpeg", ""],
  ])(
    "rejects a successful HTTP response with invalid image content: %s",
    async (type, body) => {
      fetchMock.mockResolvedValue(
        new Response(body, { headers: { "content-type": type } }),
      );
      await expect(
        renderStudio("crop.png", "piece", { category: "hijab" }),
      ).rejects.toThrow("failed");
      expect(dependencies.keepBytes).not.toHaveBeenCalled();
      expect(dependencies.discard).toHaveBeenCalledWith("piece-selection.jpg");
    },
  );
});
