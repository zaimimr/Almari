export type Product = { image: string; name: string | null };

const maxName = 80;

const entities: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
};

function decode(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (whole, code: string) => {
      if (code[0] === "#")
        return String.fromCodePoint(
          code[1]?.toLowerCase() === "x"
            ? parseInt(code.slice(2), 16)
            : parseInt(code.slice(1), 10),
        );
      return entities[code.toLowerCase()] ?? whole;
    },
  );
}

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(
    `\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  ).exec(tag);
  if (!match) return null;
  return decode(match[2] ?? match[3] ?? match[4] ?? "").trim();
}

function meta(html: string, keys: string[]): string | null {
  for (const key of keys)
    for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
      const name = attribute(tag, "property") ?? attribute(tag, "name");
      if (name?.toLowerCase() !== key) continue;
      const content = attribute(tag, "content");
      if (content) return content;
    }
  return null;
}

export function productLink(text: string): string | null {
  const trimmed = text.trim();
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function cleanTitle(title: string): string | null {
  const first = decode(title)
    .split(/\s[|–—-]\s/)[0]!
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(?:[A-Z0-9&'.]{2,} )+(?=[a-z])/, "")
    .replace(/^[a-z]/, (letter) => letter.toUpperCase());
  if (!first) return null;
  return first.length > maxName
    ? first.slice(0, maxName).replace(/\s+\S*$/, "")
    : first;
}

export function productFromPage(html: string, pageUrl: string): Product | null {
  const image = meta(html, [
    "og:image:secure_url",
    "og:image",
    "og:image:url",
    "twitter:image",
    "twitter:image:src",
  ]);
  if (!image) return null;
  let resolved: string;
  try {
    resolved = new URL(image, pageUrl).toString();
  } catch {
    return null;
  }
  if (!/^https?:/i.test(resolved)) return null;
  const title =
    meta(html, ["og:title", "twitter:title"]) ??
    /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ??
    null;
  return { image: resolved, name: title ? cleanTitle(title) : null };
}

export function imageExtension(contentType: string | null, url: string) {
  if (contentType?.includes("png") || /\.png(\?|$)/i.test(url)) return ".png";
  return ".jpg";
}
