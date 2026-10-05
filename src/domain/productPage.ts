import type { Fabric } from "./attributes";
import {
  fabricFromMaterials,
  parseCareText,
  type LabelMaterial,
} from "./careLabel";
import type { Price } from "./closet";
import { attribute, decode, productFromPage } from "./link";

export type ProductPage = {
  url: string;
  name: string | null;
  brand: string | null;
  colour: string | null;
  price: Price | null;
  images: string[];
  materials: LabelMaterial[];
  fabric: Fabric | null;
  sizes: string[];
  size: string | null;
  care: string[];
};

type Node = Record<string, unknown>;

const maxImages = 12;
const maxSizes = 30;
const maxCare = 6;

const isNode = (value: unknown): value is Node =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const list = (value: unknown): unknown[] =>
  value === undefined || value === null
    ? []
    : Array.isArray(value)
      ? value
      : [value];

const text = (value: unknown, max = 200): string | null => {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return null;
  const clean = decode(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean && clean.length <= max ? clean : null;
};

function unescapeJson(raw: string) {
  return raw
    .replace(/\\u([0-9a-f]{4})/gi, (_, code: string) =>
      String.fromCharCode(parseInt(code, 16)),
    )
    .replace(/\\\//g, "/");
}

function typesOf(node: Node): string[] {
  return list(node["@type"]).filter(
    (type): type is string => typeof type === "string",
  );
}

function nodesIn(value: unknown, found: Node[] = []): Node[] {
  for (const item of list(value)) {
    if (!isNode(item)) continue;
    found.push(item);
    if (item["@graph"]) nodesIn(item["@graph"], found);
  }
  return found;
}

function jsonLd(html: string): Node[] {
  const nodes: Node[] = [];
  for (const match of html.matchAll(
    /<script\b[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      nodesIn(JSON.parse(match[1]!.trim()), nodes);
    } catch {
      continue;
    }
  }
  return nodes;
}

function imagesOf(value: unknown): string[] {
  return list(value).flatMap((item) => {
    if (typeof item === "string") return [item];
    if (isNode(item))
      return [item.url, item.contentUrl].filter(
        (url): url is string => typeof url === "string",
      );
    return [];
  });
}

function nameOf(value: unknown): string | null {
  if (isNode(value)) return text(value.name, 60);
  return text(value, 60);
}

function priceOf(offers: unknown): Price | null {
  for (const offer of list(offers)) {
    if (!isNode(offer)) continue;
    const specs = list(offer.priceSpecification).filter(isNode);
    const spec = specs[0];
    const raw = offer.price ?? offer.lowPrice ?? spec?.price;
    const currency = offer.priceCurrency ?? spec?.priceCurrency;
    const amount = Number(String(raw ?? "").replace(",", "."));
    if (raw !== undefined && Number.isFinite(amount) && amount >= 0)
      return typeof currency === "string" && /^[A-Z]{3}$/.test(currency)
        ? { amount, currency }
        : null;
  }
  return null;
}

const withoutQuery = (url: string) => url.split(/[?#]/)[0]!.replace(/\/$/, "");

function urlOf(variant: Node): string | null {
  if (typeof variant.url === "string") return variant.url;
  const offer = list(variant.offers).find(isNode);
  return typeof offer?.url === "string" ? offer.url : null;
}

function variantFor(variants: Node[], pageUrl: string) {
  const exact = variants.filter(
    (variant) => urlOf(variant)?.split("#")[0] === pageUrl.split("#")[0],
  );
  if (exact.length === 1) return { variant: exact[0]!, exact: true };
  const near = variants.find((variant) => {
    const url = urlOf(variant);
    return url !== null && withoutQuery(url) === withoutQuery(pageUrl);
  });
  return { variant: exact[0] ?? near ?? variants[0], exact: false };
}

export function cleanSize(value: unknown): string | null {
  const size = text(value, 20);
  if (!size) return null;
  return /^[a-z0-9/ -]+$/i.test(size) && size.length <= 6
    ? size.toUpperCase()
    : size;
}

function unique<T>(items: (T | null | undefined)[]): T[] {
  return [
    ...new Set(
      items.filter((item): item is T => item !== null && item !== undefined),
    ),
  ];
}

type Draft = Omit<ProductPage, "url" | "fabric" | "materials"> & {
  material: string[];
  fabricText: string[];
};

function emptyDraft(): Draft {
  return {
    name: null,
    brand: null,
    colour: null,
    price: null,
    images: [],
    sizes: [],
    size: null,
    care: [],
    material: [],
    fabricText: [],
  };
}

function fromStructured(nodes: Node[], pageUrl: string, draft: Draft) {
  const product =
    nodes.find((node) => typesOf(node).includes("ProductGroup")) ??
    nodes.find((node) => typesOf(node).includes("Product"));
  if (!product) return;
  const variants = list(product.hasVariant).filter(isNode);
  const chosen = variants.length ? variantFor(variants, pageUrl) : null;
  const variant = chosen?.variant;
  const colour = text(variant?.color ?? product.color, 40);
  const sameColour = variants.filter(
    (item) => !colour || text(item.color, 40) === colour,
  );
  draft.name = text(product.name, 80) ?? text(variant?.name, 80);
  draft.brand = nameOf(product.brand) ?? nameOf(variant?.brand);
  draft.colour = colour;
  draft.price = priceOf(variant?.offers) ?? priceOf(product.offers);
  draft.images.push(
    ...imagesOf(variant?.image),
    ...sameColour.flatMap((item) => imagesOf(item.image)),
    ...imagesOf(product.image),
  );
  draft.sizes.push(
    ...unique(
      (sameColour.length ? sameColour : variants).map((item) =>
        cleanSize(item.size),
      ),
    ),
    ...list(product.size)
      .map(cleanSize)
      .filter((size) => size !== null),
  );
  if (chosen?.exact && variant?.size) draft.size = cleanSize(variant.size);
  for (const value of [...list(product.material), ...list(variant?.material)]) {
    const material = text(value);
    if (material) draft.material.push(material);
  }
  const description = text(product.description, 2000);
  if (description) draft.material.push(description);
}

function metaValues(html: string, keys: string[]): string[] {
  const values: string[] = [];
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (
      attribute(tag, "property") ??
      attribute(tag, "name") ??
      attribute(tag, "itemprop")
    )?.toLowerCase();
    if (!key || !keys.includes(key)) continue;
    const content = attribute(tag, "content");
    if (content) values.push(content);
  }
  return values;
}

function itemprop(html: string, key: string): string | null {
  for (const tag of html.match(
    new RegExp(`<[a-z]+\\b[^>]*itemprop\\s*=\\s*["']${key}["'][^>]*>`, "gi"),
  ) ?? []) {
    const value =
      attribute(tag, "content") ??
      attribute(tag, "src") ??
      attribute(tag, "href");
    if (value) return value;
  }
  return null;
}

function fromMeta(html: string, draft: Draft) {
  draft.brand ??=
    text(metaValues(html, ["product:brand", "og:brand"])[0], 60) ??
    text(itemprop(html, "brand"), 60);
  draft.colour ??=
    text(metaValues(html, ["product:color", "og:color"])[0], 40) ??
    text(itemprop(html, "color"), 40);
  if (!draft.price) {
    const amount = Number(
      (
        metaValues(html, ["product:price:amount", "og:price:amount"])[0] ??
        itemprop(html, "price") ??
        ""
      ).replace(",", "."),
    );
    const currency =
      metaValues(html, ["product:price:currency", "og:price:currency"])[0] ??
      itemprop(html, "priceCurrency");
    if (amount > 0 && currency && /^[A-Z]{3}$/.test(currency))
      draft.price = { amount, currency };
  }
  draft.images.push(
    ...metaValues(html, ["og:image:secure_url", "og:image", "og:image:url"]),
  );
  const material =
    metaValues(html, ["product:material", "og:material"])[0] ??
    itemprop(html, "material");
  if (material) draft.material.push(material);
}

const materialKey =
  /^(?:over|hoved|ytter|main |outer )?(?:materiale?|composition|sammensetning|fabric|stoff|kvalitet|innhold|shell|fibre|fiber)\b/i;
const careKey =
  /^(?:vedlikehold|vaskeråd|vaskeanvisning|care|pleie|washing|vask)/i;

function labelled(html: string): [string, string][] {
  const pairs: [string, string][] = [];
  const add = (key: unknown, value: unknown) => {
    const name = text(key, 40);
    const found = text(value, 300);
    if (name && found) pairs.push([name.replace(/:$/, ""), found]);
  };
  for (const match of html.matchAll(
    /"(?:key|label|name|title)"\s*:\s*"([^"]{2,40})"\s*,\s*"(?:value|text|values?)"\s*:\s*"([^"]{1,300})"/g,
  ))
    add(match[1], match[2]);
  for (const match of html.matchAll(
    /<(dt|th)\b[^>]*>([\s\S]{1,120}?)<\/\1>\s*<(dd|td)\b[^>]*>([\s\S]{1,400}?)<\/\3>/gi,
  ))
    add(match[2], match[4]);
  for (const match of html.matchAll(
    /(?:^|["\n>•])\s*((?:over|hoved)?materiale?|composition|sammensetning|fabric|kvalitet|vedlikehold|vaskeråd|care)\s*:\s*([^"\n<]{3,200})/gi,
  ))
    add(match[1], match[2]);
  return pairs;
}

function fromLabels(html: string, draft: Draft) {
  for (const [key, value] of labelled(html)) {
    if (materialKey.test(key)) draft.material.push(value);
    else if (careKey.test(key))
      draft.care.push(
        ...value
          .split(/[,;]\s*|\.\s+/)
          .map((item) => item.trim().replace(/\.$/, ""))
          .filter((item) => item.length > 2 && item.length <= 80),
      );
  }
}

const sizeField =
  /"(?:size_detail|sizeName|size_name|sizeLabel|size_label|displaySize)"\s*:\s*"([^"]{1,12})"/g;

const fabricWords: [RegExp, Fabric][] = [
  [/\b(?:jersey|jerseystoff)/i, "jersey"],
  [/\b(?:satin|sateng)/i, "satin"],
  [/\b(?:chiffon|chiffong)/i, "chiffon"],
  [/\b(?:organza)/i, "organza"],
  [/\b(?:velvet|velour|fløyel|fløyels)/i, "velvet"],
  [/\b(?:denim|jeans)/i, "denim"],
  [/\b(?:knit|knitted|strikk|strikket|strikke)/i, "knit"],
  [/\b(?:linen|lin)\b|\blinbland/i, "linen"],
  [/\b(?:silk|silke)/i, "silk"],
  [/\b(?:lawn)\b/i, "lawn"],
  [/\b(?:khaddar|khadar)\b/i, "khaddar"],
  [/\b(?:karandi)\b/i, "karandi"],
  [/\b(?:modal)\b/i, "modal"],
  [/\b(?:wool|ull|ullbland|merino)/i, "wool"],
  [/\b(?:cotton|bomull)/i, "cotton"],
];

export function fabricFromText(values: string[]): Fabric | null {
  for (const value of values)
    for (const [word, fabric] of fabricWords)
      if (word.test(value)) return fabric;
  return null;
}

const imageFile = /\.(?:jpe?g|png|webp|avif)(?:$|[?&#])/i;
const notImage = /\.(?:js|css|json|html?|svg|woff2?|mp4)(?:$|[?#])/i;

function widthOf(url: string) {
  const match = /[?&](?:imwidth|width|w|size)=w?(\d+)/i.exec(url);
  return match ? Number(match[1]) : 0;
}

function larger(url: string) {
  return url.replace(/([?&]imwidth=)(\d+)/i, (whole, key: string, width) =>
    Number(width) < 1000 ? `${key}1000` : whole,
  );
}

function stemOf(url: string) {
  const file = withoutQuery(url).split("/").pop() ?? "";
  return file.replace(/\.[a-z0-9]+$/i, "");
}

function related(html: string, primary: string): string[] {
  const stem = stemOf(primary);
  const token = /^[a-z]*\d[a-z0-9]*(?:_\d+)*/i.exec(stem)?.[0] ?? "";
  const urls = [
    ...unescapeJson(decode(html)).matchAll(/https?:\/\/[^"'\s<>()\\,]+/g),
  ]
    .map((match) => match[0])
    .filter((url) => !notImage.test(url));
  const pick = (needle: string) =>
    needle.length >= 6
      ? urls.filter(
          (url) =>
            withoutQuery(url).includes(needle) &&
            (imageFile.test(url) ||
              /image|img|media|amplience|scene7/i.test(url)),
        )
      : [];
  const exact = pick(stem);
  return new Set(exact.map(withoutQuery)).size >= 2 ? exact : pick(token);
}

function gallery(found: string[], pageUrl: string): string[] {
  const best = new Map<string, string>();
  for (const raw of found) {
    let url: string;
    try {
      url = new URL(decode(raw).trim(), pageUrl).toString();
    } catch {
      continue;
    }
    if (!/^https:/i.test(url)) continue;
    const key = withoutQuery(url);
    const kept = best.get(key);
    if (!kept || widthOf(url) > widthOf(kept)) best.set(key, larger(url));
  }
  return [...best.values()].slice(0, maxImages);
}

function finish(draft: Draft, pageUrl: string): ProductPage {
  const materials =
    draft.material
      .map((value) => parseCareText(value).materials)
      .find((found) => found.length) ?? [];
  const sizes = unique(draft.sizes.filter(Boolean)).slice(0, maxSizes);
  return {
    url: pageUrl,
    name: draft.name,
    brand: draft.brand,
    colour: draft.colour,
    price: draft.price,
    images: gallery(draft.images, pageUrl),
    materials,
    fabric:
      fabricFromText([...draft.fabricText, ...draft.material]) ??
      fabricFromMaterials(materials) ??
      fabricFromText(draft.name ? [draft.name] : []),
    sizes,
    size: draft.size,
    care: unique(draft.care).slice(0, maxCare),
  };
}

export function readProductPage(html: string, pageUrl: string): ProductPage {
  const draft = emptyDraft();
  fromStructured(jsonLd(html), pageUrl, draft);
  fromMeta(html, draft);
  const og = productFromPage(html, pageUrl);
  draft.name ??= og?.name ?? null;
  const raw = unescapeJson(html);
  fromLabels(raw, draft);
  draft.fabricText = labelled(raw)
    .filter(([key]) => materialKey.test(key))
    .map(([, value]) => value)
    .filter((value) => !/\d\s*%/.test(value));
  if (new Set(draft.images.map(withoutQuery)).size < 4) {
    const primary = draft.images[0] ?? og?.image;
    if (primary) draft.images.push(...related(html, primary));
  }
  if (!draft.sizes.length)
    for (const match of raw.matchAll(sizeField))
      draft.sizes.push(cleanSize(match[1]) ?? "");
  return finish(draft, pageUrl);
}

export function hasProduct(page: ProductPage): boolean {
  return page.images.length > 0;
}

export function shopifyJsonUrl(html: string | null, pageUrl: string) {
  let url: URL;
  try {
    url = new URL(pageUrl);
  } catch {
    return null;
  }
  const path = /^(.*\/products\/[^/?#]+)/.exec(url.pathname)?.[1];
  if (!path) return null;
  if (
    html !== null &&
    !/cdn\.shopify\.com|Shopify\.shop|shopify-section/i.test(html)
  )
    return null;
  return `${url.origin}${path.replace(/\.(?:json|js)$/, "")}.json`;
}

export function readShopifyProduct(
  json: unknown,
  page: ProductPage,
): ProductPage {
  const product = isNode(json) && isNode(json.product) ? json.product : null;
  if (!product) return page;
  const options = list(product.options).filter(isNode);
  const variants = list(product.variants).filter(isNode);
  const variantId = (() => {
    try {
      return new URL(page.url).searchParams.get("variant");
    } catch {
      return null;
    }
  })();
  const variant =
    variants.find((item) => String(item.id) === variantId) ?? variants[0];
  const optionAt = (pattern: RegExp) =>
    options.findIndex((option) => pattern.test(String(option.name ?? "")));
  const sizeAt = optionAt(/size|størrelse|str/i);
  const colourAt = optionAt(/colou?r|farge/i);
  const optionValue = (at: number) =>
    at >= 0 && variant ? variant[`option${at + 1}`] : undefined;
  const body = text(product.body_html, 5000);
  const images = list(product.images).flatMap((image) =>
    isNode(image) ? imagesOf(image.src) : imagesOf(image),
  );
  const draft: Draft = {
    ...emptyDraft(),
    name: text(product.title, 80) ?? page.name,
    brand: text(product.vendor, 60) ?? page.brand,
    colour: text(optionValue(colourAt), 40) ?? page.colour,
    price: page.price,
    images: images.length ? images : page.images,
    sizes:
      sizeAt >= 0
        ? list(options[sizeAt]!.values)
            .map(cleanSize)
            .filter((size) => size !== null)
        : page.sizes,
    size: variantId && sizeAt >= 0 ? cleanSize(optionValue(sizeAt)) : page.size,
    care: page.care,
    material: body ? [body] : [],
  };
  if (!draft.price && variant?.price !== undefined) {
    const amount = Number(variant.price);
    const currency = page.price?.currency;
    if (Number.isFinite(amount) && currency) draft.price = { amount, currency };
  }
  if (body) fromLabels(body, draft);
  const next = finish(draft, page.url);
  return {
    ...next,
    materials: next.materials.length ? next.materials : page.materials,
    fabric: next.fabric ?? page.fabric,
  };
}
