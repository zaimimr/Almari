import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { download, keepShopPhoto, readShop } from "../src/state/productLink";

const storage = vi.hoisted(() => ({ keep: vi.fn(), offline: vi.fn() }));
vi.mock("../src/storage/local", () => ({ keepPhotoBytes: storage.keep }));
vi.mock("../src/state/studio", () => ({ isOffline: storage.offline }));

const fetchMock = vi.fn<typeof fetch>();
const productUrl = "https://shop.invalid/products/piece";

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  storage.offline.mockResolvedValue(false);
  storage.keep.mockResolvedValue("product.jpg");
});

describe("retailer import without external requests", () => {
  it("reads a recorded retailer response into usable image choices", async () => {
    const html = readFileSync(
      new URL("../src/domain/fixtures/shops/boozt.html", import.meta.url),
      "utf8",
    );
    fetchMock.mockResolvedValue(new Response(html));
    const result = await readShop(productUrl);
    expect("page" in result).toBe(true);
    if (!("page" in result)) throw new Error("No page returned");
    expect(result.page.images.length).toBeGreaterThan(0);
    expect(result.page.images.every((url) => url.startsWith("https://"))).toBe(
      true,
    );
    expect(storage.keep).not.toHaveBeenCalled();
  });

  it("distinguishes an anti-bot response from an ordinary page without a product", async () => {
    const html = readFileSync(
      new URL("../src/domain/fixtures/shops/blocked.html", import.meta.url),
      "utf8",
    );
    fetchMock.mockResolvedValueOnce(new Response(html));
    await expect(readShop(productUrl)).resolves.toEqual({
      error: "link.blocked",
    });
    fetchMock.mockResolvedValueOnce(new Response("<html>Nothing here</html>"));
    await expect(readShop(productUrl)).resolves.toEqual({
      error: "link.failed",
    });
  });

  it("returns an offline recovery state when no page can be downloaded", async () => {
    fetchMock.mockRejectedValue(new TypeError("network failed"));
    storage.offline.mockResolvedValue(true);
    await expect(readShop(productUrl)).resolves.toEqual({
      error: "common.offline",
    });
    expect(storage.keep).not.toHaveBeenCalled();
  });

  it("does not store a photo when the retailer rejects or returns an empty image", async () => {
    fetchMock.mockResolvedValueOnce(new Response("blocked", { status: 403 }));
    await expect(
      keepShopPhoto("https://shop.invalid/photo.jpg", "piece"),
    ).rejects.toThrow("failed");
    fetchMock.mockResolvedValueOnce(new Response(new Uint8Array()));
    await expect(
      keepShopPhoto("https://shop.invalid/photo.jpg", "piece"),
    ).rejects.toThrow("failed");
    expect(storage.keep).not.toHaveBeenCalled();
  });

  it("stores downloaded image bytes using their content type", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    fetchMock.mockResolvedValueOnce(
      new Response(bytes, { headers: { "content-type": "image/png" } }),
    );
    await keepShopPhoto("https://shop.invalid/photo?id=1", "piece");
    expect(storage.keep).toHaveBeenCalledWith(bytes, "piece.png");
  });

  it("keeps source data usable after a storage write failure", async () => {
    fetchMock.mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "image/jpeg" },
      }),
    );
    storage.keep.mockRejectedValueOnce(new Error("disk full"));
    await expect(
      keepShopPhoto("https://shop.invalid/photo.jpg", "piece"),
    ).rejects.toThrow("disk full");
  });

  it("passes a bounded abort signal to retailer downloads", async () => {
    fetchMock.mockResolvedValueOnce(new Response("page"));
    await download(productUrl, "text/html");
    const options = fetchMock.mock.calls[0]![1];
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(options?.headers).toEqual({ Accept: "text/html" });
  });
});
