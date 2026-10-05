import { botPage, imageExtension } from "../domain/link";
import {
  hasProduct,
  readProductPage,
  readShopifyProduct,
  shopifyJsonUrl,
  type ProductPage,
} from "../domain/productPage";
import { keepPhotoBytes } from "../storage/local";
import { isOffline } from "./studio";

const linkTimeout = 20000;

export async function download(url: string, accept: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), linkTimeout);
  try {
    const response = await fetch(url, {
      headers: { Accept: accept },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("failed");
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export type ShopRead =
  | { page: ProductPage }
  | { error: "link.blocked" | "link.failed" | "common.offline" };

export async function readShop(link: string): Promise<ShopRead> {
  let html: string | null = null;
  let pageUrl = link;
  try {
    const response = await download(link, "text/html");
    pageUrl = response.url || link;
    html = await response.text();
  } catch {
    html = null;
  }
  const read = readProductPage(html ?? "", pageUrl);
  const json = shopifyJsonUrl(html, pageUrl);
  const page = json
    ? await download(json, "application/json")
        .then((response) => response.json())
        .then((data: unknown) => readShopifyProduct(data, read))
        .catch(() => read)
    : read;
  if (hasProduct(page)) return { page };
  if (html === null && (await isOffline())) return { error: "common.offline" };
  return {
    error: html !== null && !botPage(html) ? "link.failed" : "link.blocked",
  };
}

export async function keepShopPhoto(url: string, name: string) {
  const image = await download(url, "image/*");
  const bytes = new Uint8Array(await image.arrayBuffer());
  if (!bytes.length) throw new Error("failed");
  return keepPhotoBytes(
    bytes,
    `${name}${imageExtension(image.headers.get("content-type"), url)}`,
  );
}
