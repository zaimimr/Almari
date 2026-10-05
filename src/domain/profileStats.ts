import { categories, type Category, type Closet, type Piece } from "./closet";
import { colorName } from "./color";
import { filterPieces, lastWorn, noFilter } from "./closetFilters";
import { needsDetails } from "./facts";
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

export type QuickAdd =
  | "name"
  | "hijab"
  | "hijabStyles"
  | "coverage"
  | "style"
  | "fit"
  | "sparkle"
  | "colours"
  | "location"
  | "body"
  | "never"
  | "wearMore"
  | "details";

export function completeness(closet: Closet): {
  score: number;
  next: QuickAdd[];
} {
  const { name, everyday, place, profile } = closet.styling;
  const owned = closet.pieces.filter(
    (piece) => piece.source === "owned" && piece.status !== "archived",
  );
  const parts: [QuickAdd, boolean | null][] = [
    ["name", !!name],
    ["hijab", !!profile.hijabAnswered || everyday !== null],
    [
      "hijabStyles",
      everyday?.hijab === "not-needed"
        ? null
        : profile.hijabStyles !== undefined,
    ],
    ["coverage", !!profile.coverageAnswered],
    ["style", profile.styleLean !== null],
    ["fit", profile.fit !== null],
    ["sparkle", profile.sparkle != null],
    ["colours", profile.colour !== null],
    ["location", place !== null],
    [
      "body",
      profile.heightCm !== null ||
        profile.weightKg !== null ||
        profile.bodyShape !== null ||
        !!profile.bodyAnswered,
    ],
    ["never", profile.neverWear !== undefined],
    ["wearMore", profile.wearMore !== undefined],
    [
      "details",
      owned.length ? owned.every((piece) => !needsDetails(piece).length) : null,
    ],
  ];
  const applicable = parts.filter(([, answered]) => answered !== null);
  const answered = applicable.filter(([, done]) => done).length;
  return {
    score: Math.round((100 * answered) / applicable.length),
    next: applicable
      .filter(([, done]) => !done)
      .slice(0, 3)
      .map(([key]) => key),
  };
}

export type ClosetBreakdown = {
  pieces: number;
  colours: { name: string; count: number }[];
  categories: { id: Category; count: number }[];
  mostWorn: { piece: Piece; count: number }[];
  leastWorn: { piece: Piece; count: number }[];
  wearsThisMonth: number;
};

export function closetBreakdown(closet: Closet, now: Clock): ClosetBreakdown {
  const pieces = closet.pieces.filter(
    (piece) => piece.source === "owned" && piece.status !== "archived",
  );
  const wear = wearCounts(closet.feedback);
  const colourCounts = new Map<string, number>();
  for (const piece of pieces) {
    const main = piece.colors?.[0];
    if (!main) continue;
    const name = colorName(main.rgb);
    colourCounts.set(name, (colourCounts.get(name) ?? 0) + 1);
  }
  const month = now.localDate.slice(0, 7);
  const owned = new Set(pieces.map((piece) => piece.id));
  const wearsThisMonth = closet.feedback
    .filter(
      (event) =>
        event.kind === "wore" &&
        !event.undone &&
        wearDate(closet, event.at).startsWith(`${month}-`),
    )
    .reduce(
      (total, event) =>
        total + event.pieceIds.filter((id) => owned.has(id)).length,
      0,
    );
  const counted = pieces.map((piece) => ({
    piece,
    count: wear[piece.id] ?? 0,
  }));
  return {
    pieces: pieces.length,
    colours: [...colourCounts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    categories: categories
      .map(({ id }) => ({
        id,
        count: pieces.filter((piece) => piece.category === id).length,
      }))
      .filter((entry) => entry.count > 0),
    mostWorn: ranked(pieces, wear).slice(0, 3),
    leastWorn: counted
      .sort(
        (a, b) =>
          a.count - b.count ||
          Date.parse(a.piece.createdAt) - Date.parse(b.piece.createdAt),
      )
      .slice(0, 3),
    wearsThisMonth,
  };
}
