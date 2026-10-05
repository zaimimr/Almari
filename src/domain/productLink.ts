import { fitAttributes, type Fabric } from "./attributes";
import type { LabelMaterial } from "./careLabel";
import type { Piece, Price } from "./closet";
import { colourNames, namedSwatch } from "./color";
import type { ProductPage } from "./productPage";

export type ProductLink = {
  url: string;
  at: string;
  brand?: string;
  colour?: string;
  price?: Price;
  materials?: LabelMaterial[];
  fabric?: Fabric;
  sizes?: string[];
  size?: string;
  care?: string[];
  photos?: string[];
};

const colourWords: [string, string][] = [
  ["off white", "Ivory"],
  ["off-white", "Ivory"],
  ["light grey", "Light grey"],
  ["light gray", "Light grey"],
  ["lysegrå", "Light grey"],
  ["dark grey", "Charcoal"],
  ["dark gray", "Charcoal"],
  ["mørkegrå", "Charcoal"],
  ["dark blue", "Navy"],
  ["mørkeblå", "Navy"],
  ["marineblå", "Navy"],
  ["light blue", "Sky blue"],
  ["lyseblå", "Sky blue"],
  ["sky blue", "Sky blue"],
  ["dark red", "Burgundy"],
  ["mørkerød", "Burgundy"],
  ["vinrød", "Burgundy"],
  ["dark green", "Green"],
  ["mørkegrønn", "Green"],
  ["dusty pink", "Blush"],
  ["støvete rosa", "Blush"],
  ["lys rosa", "Blush"],
  ["light pink", "Blush"],
  ["black", "Black"],
  ["svart", "Black"],
  ["sort", "Black"],
  ["charcoal", "Charcoal"],
  ["anthracite", "Charcoal"],
  ["antrasitt", "Charcoal"],
  ["grey", "Grey"],
  ["gray", "Grey"],
  ["grå", "Grey"],
  ["white", "White"],
  ["hvit", "White"],
  ["ivory", "Ivory"],
  ["cream", "Ivory"],
  ["ecru", "Ivory"],
  ["offwhite", "Ivory"],
  ["kremhvit", "Ivory"],
  ["beige", "Beige"],
  ["sand", "Beige"],
  ["nude", "Beige"],
  ["camel", "Camel"],
  ["kamel", "Camel"],
  ["tan", "Camel"],
  ["taupe", "Taupe"],
  ["chocolate", "Chocolate"],
  ["sjokolade", "Chocolate"],
  ["espresso", "Chocolate"],
  ["brown", "Brown"],
  ["brun", "Brown"],
  ["mocha", "Brown"],
  ["navy", "Navy"],
  ["blue", "Blue"],
  ["blå", "Blue"],
  ["denim", "Blue"],
  ["teal", "Teal"],
  ["petrol", "Teal"],
  ["sage", "Sage"],
  ["salvie", "Sage"],
  ["olive", "Olive"],
  ["oliven", "Olive"],
  ["khaki", "Olive"],
  ["green", "Green"],
  ["grønn", "Green"],
  ["mustard", "Mustard"],
  ["sennep", "Mustard"],
  ["yellow", "Yellow"],
  ["gul", "Yellow"],
  ["orange", "Orange"],
  ["oransje", "Orange"],
  ["rust", "Rust"],
  ["terracotta", "Rust"],
  ["burgundy", "Burgundy"],
  ["bordeaux", "Burgundy"],
  ["wine", "Burgundy"],
  ["maroon", "Burgundy"],
  ["red", "Red"],
  ["rød", "Red"],
  ["blush", "Blush"],
  ["pink", "Pink"],
  ["rosa", "Pink"],
  ["rose", "Pink"],
  ["mauve", "Mauve"],
  ["lavender", "Lavender"],
  ["lilac", "Lavender"],
  ["lavendel", "Lavender"],
  ["lilla", "Purple"],
  ["purple", "Purple"],
  ["plum", "Plum"],
  ["plomme", "Plum"],
];

export function colourName(text: string | undefined | null): string | null {
  if (!text) return null;
  const value = ` ${text.toLowerCase().replace(/[/,_|()-]+/g, " ")} `;
  let best: { at: number; name: string } | null = null;
  for (const [word, name] of colourWords) {
    const at = value.search(
      new RegExp(`(?<![a-zæøå])${word.replace("-", " ")}(?![a-zæøå])`),
    );
    if (at >= 0 && (!best || at < best.at)) best = { at, name };
  }
  return best && colourNames.includes(best.name) ? best.name : null;
}

export function linkFromPage(
  page: ProductPage,
  at: string,
  photos: string[] = [],
): ProductLink {
  return {
    url: page.url,
    at,
    ...(page.brand ? { brand: page.brand } : {}),
    ...(page.colour ? { colour: page.colour } : {}),
    ...(page.price ? { price: page.price } : {}),
    ...(page.materials.length ? { materials: page.materials } : {}),
    ...(page.fabric ? { fabric: page.fabric } : {}),
    ...(page.sizes.length ? { sizes: page.sizes } : {}),
    ...(page.size ? { size: page.size } : {}),
    ...(page.care.length ? { care: page.care } : {}),
    ...(photos.length ? { photos } : {}),
  };
}

export function withProductLink(piece: Piece, link: ProductLink): Piece {
  let next: Piece = { ...piece, link };
  const fabricSource = piece.sources?.fabric;
  const fabricOpen =
    piece.attributes?.fabric === undefined || fabricSource === "proposed";
  if (link.fabric && fabricOpen) {
    next.attributes = { ...next.attributes, fabric: link.fabric };
    next.sources = { ...next.sources, fabric: "proposed" };
    next = fitAttributes(next);
  }
  const colour = colourName(link.colour);
  if (colour && piece.sources?.colour !== "confirmed") {
    next.colors = [namedSwatch(colour), ...(piece.colors ?? []).slice(1)];
    next.sources = { ...next.sources, colour: "proposed" };
  }
  if (!piece.price && link.price) next.price = link.price;
  return next;
}

export function withoutProductLink(piece: Piece): Piece {
  const next = { ...piece };
  delete next.link;
  return next;
}

export function linkHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\d?\./, "");
  } catch {
    return url;
  }
}
