import type { Category, Piece } from "../domain/closet";

type Placement = {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
};

export function arrangePieces(pieces: Piece[]) {
  const hasDress = pieces.some((piece) => piece.category === "dress");
  const hasLayer = pieces.some((piece) => piece.category === "layer");
  const hasOuter = hasDress || hasLayer;
  const hasClothing = pieces.some((piece) =>
    ["dress", "layer", "top", "tunic", "bottom"].includes(piece.category),
  );
  const placements: Record<Category, Placement> = {
    dress: { x: 0.01, y: 0.01, width: 0.57, height: 0.97, depth: 0 },
    layer: {
      x: hasDress ? 0.17 : 0.02,
      y: 0.03,
      width: 0.53,
      height: 0.65,
      depth: 1,
    },
    top: {
      x: hasOuter ? 0.4 : 0.12,
      y: 0.03,
      width: 0.48,
      height: 0.5,
      depth: 3,
    },
    tunic: {
      x: hasOuter ? 0.37 : 0.08,
      y: 0.02,
      width: 0.5,
      height: 0.59,
      depth: 3,
    },
    bottom: {
      x: hasOuter ? 0.4 : 0.17,
      y: 0.44,
      width: 0.44,
      height: 0.55,
      depth: 2,
    },
    hijab: {
      x: hasOuter ? 0.73 : 0.59,
      y: 0.22,
      width: 0.27,
      height: 0.43,
      depth: 5,
    },
    shoes: { x: 0.75, y: 0.77, width: 0.24, height: 0.22, depth: 6 },
    bag: { x: 0.72, y: 0.58, width: 0.28, height: 0.23, depth: 4 },
    accessory: { x: 0.75, y: 0.06, width: 0.2, height: 0.17, depth: 7 },
  };

  return pieces.map((piece, itemIndex) => {
    if (pieces.length === 1) {
      return { piece, x: 0.15, y: 0.05, width: 0.7, height: 0.9, depth: 0 };
    }
    const group = hasClothing
      ? pieces.filter((item) => item.category === piece.category)
      : pieces;
    const index = hasClothing
      ? group.findIndex((item) => item.id === piece.id)
      : itemIndex;
    const base = hasClothing
      ? placements[piece.category]
      : { x: 0.1, y: 0.08, width: 0.64, height: 0.8, depth: 0 };
    const spread = group.length > 1 ? index / (group.length - 1) : 0;
    const scale = group.length > 1 ? 0.86 : 1;
    const width = base.width * scale;
    const height = base.height * scale;
    return {
      piece,
      x: Math.min(1 - width, base.x + spread * 0.13),
      y: Math.min(1 - height, base.y + spread * 0.07),
      width,
      height,
      depth: base.depth * 10 + index,
    };
  });
}
