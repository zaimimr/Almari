export const categories = [
  "hijab",
  "top",
  "tunic",
  "bottom",
  "dress",
  "layer",
  "shoes",
  "bag",
  "accessory",
] as const;

export type Category = (typeof categories)[number];

export type StudioRequest = {
  image: File;
  category?: Category;
  kind?: string;
  name?: string;
  colour?: string;
};

export const maxImageBytes = 8 * 1024 * 1024;
export const maxImageSide = 512;
export const maxBodyBytes = maxImageBytes + 64 * 1024;

const imageTypes = ["image/png", "image/jpeg", "image/webp", "image/heic"];

const isCategory = (value: unknown): value is Category =>
  categories.includes(value as Category);

export const isInstallId = (value: string | null): value is string =>
  value !== null && /^[A-Za-z0-9-]{8,64}$/.test(value);

function text(form: FormData, key: string, length: number) {
  const value = form.get(key);
  if (typeof value !== "string") return undefined;
  const clean = value
    .replace(/[^\p{L}\p{N} '&,.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, length);
  return clean || undefined;
}

export function parseStudioRequest(
  form: FormData,
): StudioRequest | { error: string; status: number } {
  const image = form.get("image");
  if (!(image instanceof File) || !imageTypes.includes(image.type))
    return { error: "image", status: 400 };
  if (image.size === 0) return { error: "image", status: 400 };
  if (image.size > maxImageBytes) return { error: "size", status: 413 };
  const category = form.get("category");
  const kind = form.get("kind");
  if (
    kind !== null &&
    (typeof kind !== "string" || !/^[a-z][a-z-]{0,31}$/.test(kind))
  )
    return { error: "kind", status: 400 };
  return {
    image,
    category: isCategory(category) ? category : undefined,
    kind: kind ?? undefined,
    name: text(form, "name", 60),
    colour: text(form, "colour", 40),
  };
}

function jpegSize(bytes: Uint8Array) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1]!;
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
    const frame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (frame)
      return {
        height: (bytes[offset + 5]! << 8) | bytes[offset + 6]!,
        width: (bytes[offset + 7]! << 8) | bytes[offset + 8]!,
      };
    offset += 2 + length;
  }
  return null;
}

export function imageSize(
  bytes: Uint8Array,
): { width: number; height: number } | null {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return jpegSize(bytes);
  return null;
}

export const fitsModel = (bytes: Uint8Array) => {
  const size = imageSize(bytes);
  return !size || (size.width <= maxImageSide && size.height <= maxImageSide);
};

export function imageType(bytes: Uint8Array) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57)
    return "image/webp";
  return null;
}
