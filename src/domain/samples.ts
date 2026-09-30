import type { Closet, Piece } from "./closet";

export const samplePieces: Piece[] = [
  {
    id: "sample-mauve-hijab",
    name: "Mauve chiffon hijab",
    category: "hijab",
    photo: "sample:mauve-hijab",
    createdAt: "2026-09-30T18:00:00.000Z",
  },
  {
    id: "sample-ivory-hijab",
    name: "Ivory modal hijab",
    category: "hijab",
    photo: "sample:ivory-hijab",
    createdAt: "2026-09-30T18:00:00.000Z",
  },
  {
    id: "sample-chocolate-hijab",
    name: "Chocolate jersey hijab",
    category: "hijab",
    photo: "sample:chocolate-hijab",
    createdAt: "2026-09-30T18:00:00.000Z",
  },
  {
    id: "sample-ivory-tunic",
    name: "Ivory longline tunic",
    category: "tunic",
    photo: "sample:ivory-tunic",
    createdAt: "2026-09-30T18:00:00.000Z",
  },
  {
    id: "sample-sage-kurta",
    name: "Sage embroidered kurta",
    category: "tunic",
    photo: "sample:sage-kurta",
    createdAt: "2026-09-30T18:00:00.000Z",
  },
  {
    id: "sample-navy-blazer",
    name: "Navy longline blazer",
    category: "layer",
    photo: "sample:navy-blazer",
    createdAt: "2026-09-30T18:00:00.000Z",
  },
  {
    id: "sample-taupe-abaya",
    name: "Taupe flowing abaya",
    category: "dress",
    photo: "sample:taupe-abaya",
    createdAt: "2026-09-30T18:00:00.000Z",
  },
  {
    id: "sample-ivory-trousers",
    name: "Ivory wide-leg trousers",
    category: "bottom",
    photo: "sample:ivory-trousers",
    createdAt: "2026-09-30T18:00:00.000Z",
  },
  {
    id: "sample-charcoal-trousers",
    name: "Charcoal wide-leg trousers",
    category: "bottom",
    photo: "sample:charcoal-trousers",
    createdAt: "2026-09-30T18:00:00.000Z",
  },
  {
    id: "sample-ivory-salwar",
    name: "Ivory cotton shalwar",
    category: "bottom",
    photo: "sample:ivory-salwar",
    createdAt: "2026-09-30T18:00:00.000Z",
  },
  {
    id: "sample-chocolate-loafers",
    name: "Chocolate leather loafers",
    category: "shoes",
    photo: "sample:chocolate-loafers",
    createdAt: "2026-09-30T18:00:00.000Z",
  },
  {
    id: "sample-taupe-bag",
    name: "Taupe everyday bag",
    category: "bag",
    photo: "sample:taupe-bag",
    createdAt: "2026-09-30T18:00:00.000Z",
  },
];

export function isSamplePhoto(photo: string) {
  return photo.startsWith("sample:");
}

export function addSampleWardrobe(closet: Closet): Closet {
  if (closet.sampleWardrobeAdded) return closet;
  const existingIds = new Set(closet.pieces.map((piece) => piece.id));
  return {
    ...closet,
    sampleWardrobeAdded: true,
    pieces: [
      ...closet.pieces,
      ...samplePieces.filter((piece) => !existingIds.has(piece.id)),
    ],
  };
}
