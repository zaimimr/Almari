import type { Closet, Piece } from "./closet";
import { wearCounts } from "./scoring/taste";

export type ClosetStats = {
  pieces: number;
  mostWorn: { piece: Piece; count: number }[];
  neverWorn: number;
};

export function closetStats(closet: Closet): ClosetStats {
  const pieces = closet.pieces.filter(
    (piece) =>
      piece.source === closet.styling.wardrobe && piece.status !== "archived",
  );
  const wear = wearCounts(closet.feedback);
  const worn = pieces
    .filter((piece) => wear[piece.id])
    .map((piece) => ({ piece, count: wear[piece.id]! }))
    .sort(
      (a, b) => b.count - a.count || a.piece.name.localeCompare(b.piece.name),
    );
  return {
    pieces: pieces.length,
    mostWorn: worn.slice(0, 3),
    neverWorn: pieces.length - worn.length,
  };
}
