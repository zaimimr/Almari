import type { Closet, Piece } from "./closet";
import { filterPieces, lastWorn, noFilter } from "./closetFilters";
import { wearDate } from "./looks";
import { wearCounts } from "./scoring/taste";
import type { Clock } from "./today";

export type ClosetStats = {
  pieces: number;
  mostWorn: { piece: Piece; count: number }[];
  neverWorn: number;
};

const poolOf = (closet: Closet) =>
  closet.pieces.filter(
    (piece) =>
      piece.source === closet.styling.wardrobe && piece.status !== "archived",
  );

function ranked(pieces: Piece[], wear: Record<string, number>) {
  return pieces
    .filter((piece) => wear[piece.id])
    .map((piece) => ({ piece, count: wear[piece.id]! }))
    .sort(
      (a, b) => b.count - a.count || a.piece.name.localeCompare(b.piece.name),
    );
}

export function closetStats(closet: Closet): ClosetStats {
  const pieces = poolOf(closet);
  const worn = ranked(pieces, wearCounts(closet.feedback));
  return {
    pieces: pieces.length,
    mostWorn: worn.slice(0, 3),
    neverWorn: pieces.length - worn.length,
  };
}

export function monthWearStats(
  closet: Closet,
  month: string,
  now: Clock,
): { mostWorn: { piece: Piece; count: number }[]; variety: number | null } {
  const pieces = poolOf(closet);
  const events = closet.feedback.filter(
    (event) =>
      event.scope !== "piece" &&
      wearDate(closet, event.at).startsWith(`${month}-`),
  );
  const mostWorn = ranked(pieces, wearCounts(events))
    .filter((entry) => entry.count >= 2)
    .slice(0, 3);
  if (month !== now.localDate.slice(0, 7) || !pieces.length)
    return { mostWorn, variety: null };
  const notLately = filterPieces(
    pieces,
    { ...noFilter, wear: "not-worn-lately" },
    { lastWorn: lastWorn(closet), today: now.localDate },
  );
  return { mostWorn, variety: 1 - notLately.length / pieces.length };
}
