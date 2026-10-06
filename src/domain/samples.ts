import type { Closet, Occasion, Piece, SampleTraits } from "./closet";

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
      occasions: ["everyday", "work", "dinner", "eid", "party", "wedding"],
    },
    attributes: { pattern: "solid", fabric: "chiffon", formality: 3 },
    colors: [{ rgb: [153, 108, 115], share: 1 }],
  },
  {
    id: "sample-ivory-hijab",
    name: "Ivory modal hijab",
    category: "hijab",
    kind: "hijab",
    styles: both,
    traits: {
      tone: "light",
      occasions: ["everyday", "work", "dinner", "eid", "party", "wedding"],
    },
    attributes: { pattern: "solid", fabric: "modal", formality: 2 },
    colors: [{ rgb: [236, 231, 218], share: 1 }],
  },
  {
    id: "sample-chocolate-hijab",
    name: "Chocolate jersey hijab",
    category: "hijab",
    kind: "hijab",
    styles: both,
    traits: { tone: "dark", occasions: ["everyday", "work"] },
    attributes: { pattern: "solid", fabric: "jersey", formality: 1 },
    colors: [{ rgb: [78, 52, 42], share: 1 }],
  },
  {
    id: "sample-ivory-tunic",
    name: "Ivory longline tunic",
    category: "tunic",
    kind: "tunic",
    styles: ["western"],
    traits: { tone: "light", occasions: ["everyday", "work"] },
    attributes: {
      length: "thigh",
      sleeve: "long",
      volume: "straight",
      pattern: "solid",
      fabric: "cotton",
      embellishment: "none",
      formality: 2,
    },
    colors: [{ rgb: [236, 231, 218], share: 1 }],
  },
  {
    id: "sample-sage-kurta",
    name: "Sage embroidered kurta",
    category: "tunic",
    kind: "kurta",
    styles: ["desi"],
    traits: {
      tone: "mid",
      occasions: ["everyday", "work", "dinner", "eid", "party"],
    },
    attributes: {
      length: "knee",
      sleeve: "long",
      volume: "straight",
      pattern: "embroidered",
      fabric: "cotton",
      embellishment: "light",
      formality: 3,
    },
    colors: [
      { rgb: [160, 170, 145], share: 0.8 },
      { rgb: [236, 231, 218], share: 0.2 },
    ],
  },
  {
    id: "sample-navy-blazer",
    name: "Navy longline blazer",
    category: "layer",
    kind: "blazer",
    styles: ["western"],
    traits: {
      tone: "dark",
      occasions: ["work", "dinner"],
      warmth: "medium",
    },
    attributes: {
      length: "thigh",
      sleeve: "long",
      volume: "straight",
      pattern: "solid",
      fabric: "wool",
      embellishment: "none",
      formality: 3,
    },
    colors: [{ rgb: [35, 45, 75], share: 1 }],
  },
  {
    id: "sample-taupe-abaya",
    name: "Taupe flowing abaya",
    category: "dress",
    kind: "abaya",
    styles: ["western"],
    traits: {
      tone: "mid",
      occasions: ["everyday", "work", "dinner"],
      warmth: "light",
      open: true,
    },
    attributes: {
      length: "ankle",
      sleeve: "long",
      volume: "voluminous",
      pattern: "solid",
      fabric: "chiffon",
      embellishment: "none",
      formality: 2,
    },
    colors: [{ rgb: [142, 120, 106], share: 1 }],
  },
  {
    id: "sample-ivory-trousers",
    name: "Ivory wide-leg trousers",
    category: "bottom",
    kind: "trousers",
    styles: both,
    traits: { tone: "light", occasions: ["everyday", "work", "dinner"] },
    attributes: {
      length: "ankle",
      volume: "voluminous",
      pattern: "solid",
      fabric: "linen",
      embellishment: "none",
      formality: 2,
    },
    colors: [{ rgb: [236, 231, 218], share: 1 }],
  },
  {
    id: "sample-charcoal-trousers",
    name: "Charcoal wide-leg trousers",
    category: "bottom",
    kind: "trousers",
    styles: both,
    traits: { tone: "dark", occasions: ["everyday", "work"] },
    attributes: {
      length: "ankle",
      volume: "voluminous",
      pattern: "solid",
      fabric: "wool",
      embellishment: "none",
      formality: 2,
    },
    colors: [{ rgb: [62, 62, 64], share: 1 }],
  },
  {
    id: "sample-ivory-salwar",
    name: "Ivory cotton shalwar",
    category: "bottom",
    kind: "shalwar",
    styles: ["desi"],
    traits: {
      tone: "light",
      occasions: ["everyday", "dinner", "eid", "party"],
    },
    attributes: {
      length: "ankle",
      volume: "voluminous",
      pattern: "solid",
      fabric: "cotton",
      embellishment: "none",
      formality: 2,
    },
    colors: [{ rgb: [236, 231, 218], share: 1 }],
  },
  {
    id: "sample-chocolate-loafers",
    name: "Chocolate leather loafers",
    category: "shoes",
    kind: "loafers",
    styles: both,
    traits: { tone: "dark", occasions: ["everyday", "work", "dinner"] },
    attributes: { formality: 2 },
    colors: [{ rgb: [78, 52, 42], share: 1 }],
  },
  {
    id: "sample-taupe-bag",
    name: "Taupe everyday bag",
    category: "bag",
    kind: "handbag",
    styles: both,
    traits: { tone: "mid", occasions: ["everyday", "work", "dinner"] },
    attributes: { formality: 2 },
    colors: [{ rgb: [142, 120, 106], share: 1 }],
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
  traits: { tone: "mid", occasions: ["everyday", "work", "dinner"] },
  attributes: {
    length: "ankle",
    sleeve: "long",
    volume: "straight",
    pattern: "solid",
    fabric: "cotton",
    embellishment: "none",
    formality: 2,
  },
  colors: [{ rgb: [107, 108, 78], share: 1 }],
  source: "sample",
  photo: "sample:olive-maxi-dress",
  createdAt: "2026-10-01T09:00:00.000Z",
  catalog: 2,
});

const dressy: Occasion[] = ["dinner", "eid", "party", "wedding", "barat"];

catalog.push(
  ...(
    [
      {
        id: "sample-black-hijab",
        name: "Black jersey hijab",
        category: "hijab",
        kind: "hijab",
        styles: both,
        traits: { tone: "dark", occasions: ["everyday", "work", "dinner"] },
        attributes: { pattern: "solid", fabric: "jersey", formality: 1 },
        colors: [{ rgb: [30, 30, 33], share: 1 }],
      },
      {
        id: "sample-champagne-hijab",
        name: "Champagne satin hijab",
        category: "hijab",
        kind: "hijab",
        styles: both,
        traits: { tone: "light", occasions: dressy },
        attributes: { pattern: "solid", fabric: "satin", formality: 4 },
        colors: [{ rgb: [214, 190, 150], share: 1 }],
      },
      {
        id: "sample-blue-tunic",
        name: "Dusty blue tunic",
        category: "tunic",
        kind: "tunic",
        styles: ["western"],
        traits: { tone: "mid", occasions: ["everyday", "work"] },
        attributes: {
          length: "thigh",
          sleeve: "long",
          volume: "straight",
          pattern: "solid",
          fabric: "cotton",
          embellishment: "none",
          formality: 2,
        },
        colors: [{ rgb: [120, 140, 170], share: 1 }],
      },
      {
        id: "sample-rose-kurta",
        name: "Rose embroidered kurta",
        category: "tunic",
        kind: "kurta",
        styles: ["desi"],
        traits: {
          tone: "mid",
          occasions: ["everyday", "work", "dinner", "eid"],
        },
        attributes: {
          length: "knee",
          sleeve: "long",
          volume: "straight",
          pattern: "embroidered",
          fabric: "cotton",
          embellishment: "light",
          formality: 3,
        },
        colors: [{ rgb: [190, 130, 135], share: 1 }],
      },
      {
        id: "sample-maroon-kameez",
        name: "Maroon silk kameez",
        category: "tunic",
        kind: "kameez",
        styles: ["desi"],
        traits: {
          tone: "dark",
          occasions: ["eid", "party", "wedding", "barat"],
        },
        attributes: {
          length: "knee",
          sleeve: "long",
          volume: "straight",
          pattern: "embroidered",
          fabric: "silk",
          embellishment: "heavy",
          formality: 5,
        },
        colors: [{ rgb: [115, 30, 45], share: 1 }],
      },
      {
        id: "sample-emerald-dress",
        name: "Emerald satin maxi dress",
        category: "dress",
        kind: "dress",
        styles: ["western"],
        traits: { tone: "dark", occasions: dressy },
        attributes: {
          length: "ankle",
          sleeve: "long",
          volume: "straight",
          pattern: "solid",
          fabric: "satin",
          embellishment: "none",
          formality: 4,
        },
        colors: [{ rgb: [18, 95, 70], share: 1 }],
      },
      {
        id: "sample-gold-salwar",
        name: "Gold silk shalwar",
        category: "bottom",
        kind: "shalwar",
        styles: ["desi"],
        traits: {
          tone: "mid",
          occasions: ["eid", "party", "wedding", "barat"],
        },
        attributes: {
          length: "ankle",
          volume: "voluminous",
          pattern: "solid",
          fabric: "silk",
          embellishment: "none",
          formality: 4,
        },
        colors: [{ rgb: [200, 165, 90], share: 1 }],
      },
      {
        id: "sample-camel-blazer",
        name: "Camel wool blazer",
        category: "layer",
        kind: "blazer",
        styles: ["western"],
        traits: {
          tone: "mid",
          occasions: ["work", "dinner"],
          warmth: "medium",
        },
        attributes: {
          length: "thigh",
          sleeve: "long",
          volume: "straight",
          pattern: "solid",
          fabric: "wool",
          embellishment: "none",
          formality: 3,
        },
        colors: [{ rgb: [176, 136, 92], share: 1 }],
      },
      {
        id: "sample-gold-loafers",
        name: "Gold metallic loafers",
        category: "shoes",
        kind: "loafers",
        styles: both,
        traits: { tone: "mid", occasions: dressy },
        attributes: { formality: 4 },
        colors: [{ rgb: [190, 155, 85], share: 1 }],
      },
      {
        id: "sample-gold-bag",
        name: "Gold evening bag",
        category: "bag",
        kind: "handbag",
        styles: both,
        traits: { tone: "mid", occasions: dressy },
        attributes: { formality: 4 },
        colors: [{ rgb: [196, 160, 90], share: 1 }],
      },
    ] as Piece[]
  ).map((piece) => ({
    ...piece,
    source: "sample" as const,
    photo: `sample:${piece.id.replace("sample-", "")}`,
    createdAt: "2026-10-06T09:00:00.000Z",
    catalog: 4,
  })),
);

export const sampleCatalogVersion = 4;

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

function refreshed(piece: Piece): Piece {
  const fixture = samplePieces.find((item) => item.id === piece.id);
  if (!fixture || piece.source !== "sample") return piece;
  if (fixture.category !== piece.category) return piece;
  return {
    ...piece,
    kind: fixture.kind,
    styles: fixture.styles,
    traits: fixture.traits,
    attributes: fixture.attributes,
    colors: fixture.colors,
  };
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
  const pieces = closet.pieces.map((piece) =>
    refreshed(
      piece.id.startsWith("sample-") || isSamplePhoto(piece.photo)
        ? { ...piece, source: "sample" }
        : piece,
    ),
  );
  const ownsPieces = pieces.some((piece) => piece.source === "owned");
  return {
    ...closet,
    sampleCatalog: sampleCatalogVersion,
    pieces: [...pieces, ...additions],
    styling:
      ownsPieces && closet.styling.wardrobe === "sample"
        ? { ...closet.styling, wardrobe: "owned", today: null }
        : closet.styling,
  };
}

export function withSampleAttributes(closet: Closet): Closet {
  let changed = false;
  const pieces = closet.pieces.map((piece) => {
    const fixture = samplePieces.find((item) => item.id === piece.id);
    if (
      piece.source !== "sample" ||
      !fixture?.attributes ||
      fixture.category !== piece.category ||
      Object.keys(fixture.attributes).every(
        (key) => piece.attributes && key in piece.attributes,
      )
    )
      return piece;
    changed = true;
    return {
      ...piece,
      attributes: { ...fixture.attributes, ...piece.attributes },
    };
  });
  return changed ? { ...closet, pieces } : closet;
}
