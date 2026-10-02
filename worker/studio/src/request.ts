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
  category: Category;
  kind?: string;
  name?: string;
  colour?: string;
};

export const maxImageBytes = 8 * 1024 * 1024;
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
  if (!isCategory(category)) return { error: "category", status: 400 };
  const kind = form.get("kind");
  if (
    kind !== null &&
    (typeof kind !== "string" || !/^[a-z][a-z-]{0,31}$/.test(kind))
  )
    return { error: "kind", status: 400 };
  return {
    image,
    category,
    kind: kind ?? undefined,
    name: text(form, "name", 60),
    colour: text(form, "colour", 40),
  };
}
