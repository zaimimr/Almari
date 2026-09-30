import type { Closet, Piece, SampleTraits } from "./closet";

const createdAt = "2026-09-30T18:00:00.000Z";
const both = ["western", "desi"] as Piece["styles"];

type CatalogPiece = Piece & { catalog: number };

const catalog: CatalogPiece[] = [
  {
    id: "sample-mauve-hijab",
    name: "Mauve chiffon hijab",
    category: "hijab",
    kind: "hijab",
    styles: both,
    traits: {
      tone: "mid",
      occasions: ["work", "everyday", "dinner", "celebration"],
    },
  },
  {
    id: "sample-ivory-hijab",
    name: "Ivory modal hijab",
    category: "hijab",
    kind: "hijab",
    styles: both,
    traits: {
      tone: "light",
      occasions: ["work", "everyday", "dinner", "celebration"],
    },
  },
  {
    id: "sample-chocolate-hijab",
    name: "Chocolate jersey hijab",
    category: "hijab",
    kind: "hijab",
    styles: both,
    traits: { tone: "dark", occasions: ["work", "everyday"] },
  },
  {
    id: "sample-ivory-tunic",
    name: "Ivory longline tunic",
    category: "tunic",
    kind: "tunic",
    styles: ["western"],
    traits: { tone: "light", occasions: ["work", "everyday"] },
  },
  {
    id: "sample-sage-kurta",
    name: "Sage embroidered kurta",
    category: "tunic",
    kind: "kurta",
    styles: ["desi"],
    traits: {
      tone: "mid",
      occasions: ["work", "everyday", "dinner", "celebration"],
    },
  },
  {
    id: "sample-navy-blazer",
    name: "Navy longline blazer",
    category: "layer",
    kind: "blazer",
    styles: ["western"],
    traits: { tone: "dark", occasions: ["work", "dinner"], warmth: "medium" },
  },
  {
    id: "sample-taupe-abaya",
    name: "Taupe flowing abaya",
    category: "dress",
    kind: "abaya",
    styles: ["western"],
    traits: {
      tone: "mid",
      occasions: ["work", "everyday", "dinner"],
      warmth: "light",
      open: true,
    },
  },
  {
    id: "sample-ivory-trousers",
    name: "Ivory wide-leg trousers",
    category: "bottom",
    kind: "trousers",
    styles: both,
    traits: { tone: "light", occasions: ["work", "everyday", "dinner"] },
  },
  {
    id: "sample-charcoal-trousers",
    name: "Charcoal wide-leg trousers",
    category: "bottom",
    kind: "trousers",
    styles: both,
    traits: { tone: "dark", occasions: ["work", "everyday"] },
  },
  {
    id: "sample-ivory-salwar",
    name: "Ivory cotton shalwar",
    category: "bottom",
    kind: "shalwar",
    styles: ["desi"],
    traits: {
      tone: "light",
      occasions: ["everyday", "dinner", "celebration"],
    },
  },
  {
    id: "sample-chocolate-loafers",
    name: "Chocolate leather loafers",
    category: "shoes",
    kind: "shoes",
    styles: both,
    traits: { tone: "dark", occasions: ["work", "everyday", "dinner"] },
  },
  {
    id: "sample-taupe-bag",
    name: "Taupe everyday bag",
    category: "bag",
    kind: "bag",
    styles: both,
    traits: { tone: "mid", occasions: ["work", "everyday", "dinner"] },
  },
].map((piece) => ({
  ...piece,
  source: "sample" as const,
  photo: `sample:${piece.id.replace("sample-", "")}`,
  createdAt,
  catalog: 1,
})) as CatalogPiece[];

catalog.push({
  id: "sample-olive-maxi-dress",
  name: "Olive maxi dress",
  category: "dress",
  kind: "dress",
  styles: ["western"],
  traits: { tone: "mid", occasions: ["work", "everyday", "dinner"] },
  source: "sample",
  photo: "sample:olive-maxi-dress",
  createdAt: "2026-10-01T09:00:00.000Z",
  catalog: 2,
});

export const sampleCatalogVersion = 2;

export const samplePieces: Piece[] = catalog.map(
  ({ catalog: _catalog, ...piece }) => piece,
);

export const sampleTraits: Record<string, SampleTraits> = Object.fromEntries(
  samplePieces.map((piece) => [
    piece.id,
    {
      category: piece.category,
      kind: piece.kind,
      styles: piece.styles,
      traits: piece.traits,
    },
  ]),
);

export function isSamplePhoto(photo: string) {
  return photo.startsWith("sample:");
}

export function addSampleWardrobe(closet: Closet): Closet {
  if (closet.sampleCatalog >= sampleCatalogVersion) return closet;
  const existingIds = new Set(closet.pieces.map((piece) => piece.id));
  const additions = catalog
    .filter(
      (piece) =>
        piece.catalog > closet.sampleCatalog && !existingIds.has(piece.id),
    )
    .map(({ catalog: _catalog, ...piece }) => piece);
  return {
    ...closet,
    sampleCatalog: sampleCatalogVersion,
    pieces: [...closet.pieces, ...additions],
  };
}
