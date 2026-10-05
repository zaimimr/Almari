import { fitAttributes, type Attributes } from "./attributes";
import {
  isAvailable,
  kindsIn,
  savePiece,
  setAway,
  type Closet,
  type Look,
  type OutfitRequest,
  type Category,
  type Piece,
  type Traits,
  type Warmth,
} from "./closet";
import { filterPieces, lastWorn, noFilter } from "./closetFilters";
import type { WearSeason } from "./facts";
import { toLab, toLch } from "./color";
import { hasAnyWear } from "./feedback";
import { wearDate } from "./looks";
import { confirmedWeather } from "./pieceWeather";
import { isNeverWear, wearMoreIds } from "./preferences";
import { evaluateOutfit, roleOf, type Problem } from "./styling";
import { activeSession, type Clock } from "./today";

export function setArchived(
  closet: Closet,
  id: string,
  archived: boolean,
): Closet {
  const piece = closet.pieces.find((item) => item.id === id);
  if (!piece || (piece.status === "archived") === archived) return closet;
  const { status: _status, away: _away, ...rest } = piece;
  const next: Piece = archived ? { ...rest, status: "archived" } : rest;
  return {
    ...closet,
    pieces: closet.pieces.map((item) => (item.id === id ? next : item)),
  };
}

export function shelf(pieces: Piece[], archived: boolean) {
  return pieces.filter((piece) => (piece.status === "archived") === archived);
}

export type Confirmation = {
  attributes?: Partial<Attributes>;
  traits?: Partial<Pick<Traits, "warmth" | "rain" | "snow" | "open">>;
};

export function confirmPiece(
  closet: Closet,
  id: string,
  change: Confirmation,
): Closet {
  const piece = closet.pieces.find((item) => item.id === id);
  if (!piece) return closet;
  const keys = [
    ...Object.keys(change.attributes ?? {}),
    ...Object.keys(change.traits ?? {}),
  ];
  return savePiece(closet, {
    ...piece,
    ...(change.attributes
      ? { attributes: { ...piece.attributes, ...change.attributes } }
      : {}),
    ...(change.traits ? { traits: { ...piece.traits, ...change.traits } } : {}),
    sources: {
      ...piece.sources,
      ...Object.fromEntries(keys.map((key) => [key, "confirmed" as const])),
    },
  });
}

export type HijabOption = {
  piece: Piece;
  ids: string[];
  score: number;
  reason: string | null;
  problems: Problem[];
};

export type HijabComparison = { current: HijabOption; options: HijabOption[] };

function reasonFor(piece: Piece, reasons: string[]) {
  const name = piece.name.toLowerCase();
  return (
    reasons.find((reason) => reason.toLowerCase().includes(name)) ??
    reasons[0] ??
    null
  );
}

export function hijabHue(piece: Piece): number | null {
  const colour = piece.colors?.[0];
  return colour ? toLch(toLab(colour.rgb))[2] : null;
}

const hueDistance = (from: number | null, to: number | null) => {
  if (from === null || to === null) return Number.POSITIVE_INFINITY;
  const gap = Math.abs(from - to) % 360;
  return gap > 180 ? 360 - gap : gap;
};

export function hijabAlternatives(
  closet: Closet,
  request: OutfitRequest,
  currentIds: string[],
  score: (outfit: Piece[]) => { score: number; reasons: string[] },
  options: { all?: boolean } = {},
): HijabComparison | null {
  const pool = closet.pieces.filter(
    (piece) => piece.source === request.wardrobe && isAvailable(piece),
  );
  const outfit = currentIds.flatMap((id) => {
    const piece = pool.find((item) => item.id === id);
    return piece ? [piece] : [];
  });
  if (outfit.length !== currentIds.length) return null;
  const current = outfit.find((piece) => roleOf(piece) === "hijab");
  if (!current) return null;
  const option = (piece: Piece): HijabOption => {
    const pieces = outfit.map((item) =>
      item.id === current.id ? piece : item,
    );
    const result = score(pieces);
    return {
      piece,
      ids: pieces.map((item) => item.id),
      score: result.score,
      reason: options.all ? null : reasonFor(piece, result.reasons),
      problems: evaluateOutfit(pieces, request, pool),
    };
  };
  const { weather } = request;
  const cold =
    weather.source !== "unknown" &&
    (weather.warmth === "cold" || weather.precipitation === "snow");
  const warm = (piece: Piece) =>
    cold && confirmedWeather(piece, "warmth") === "warm" ? 0 : 1;
  const hue = hijabHue(current);
  const found = pool
    .filter(
      (piece) =>
        roleOf(piece) === "hijab" &&
        piece.id !== current.id &&
        !request.excludedIds.includes(piece.id) &&
        !isNeverWear(closet.styling.profile, piece),
    )
    .map(option)
    .filter(
      ({ problems }) =>
        options.all ||
        problems.every((problem) => problem.severity === "review"),
    )
    .sort(
      (a, b) =>
        warm(a.piece) - warm(b.piece) ||
        hueDistance(hue, hijabHue(a.piece)) -
          hueDistance(hue, hijabHue(b.piece)) ||
        a.piece.name.localeCompare(b.piece.name),
    );
  return {
    current: option(current),
    options: options.all ? found : found.slice(0, 3),
  };
}

export type LookMatch = { look: Look; pieces: Piece[]; problems: Problem[] };

export type LookVariant = {
  look: Look;
  pieces: Piece[];
  missing: number;
  unavailable: Piece[];
  repair: OutfitRequest;
};

export function matchingLooks(
  closet: Closet,
  request: OutfitRequest,
): { exact: LookMatch[]; variants: LookVariant[] } {
  const usable = (piece: Piece) =>
    isAvailable(piece) && !request.excludedIds.includes(piece.id);
  const pool = closet.pieces.filter(
    (piece) => piece.source === request.wardrobe && usable(piece),
  );
  const exact: LookMatch[] = [];
  const variants: LookVariant[] = [];
  for (const look of closet.looks) {
    const found = look.pieceIds.flatMap((id) => {
      const piece = closet.pieces.find((item) => item.id === id);
      return piece ? [piece] : [];
    });
    if (found.some((piece) => piece.source !== request.wardrobe)) continue;
    const pieces = found.filter(usable);
    const unavailable = found.filter((piece) => !usable(piece));
    const missing = look.pieceIds.length - found.length;
    if (!pieces.length) continue;
    if (!missing && !unavailable.length) {
      const problems = evaluateOutfit(pieces, request, pool);
      if (
        request.keptIds.every((id) => look.pieceIds.includes(id)) &&
        problems.every((problem) => problem.severity === "review")
      )
        exact.push({ look, pieces, problems });
      continue;
    }
    const kept = pool.filter(
      (piece) =>
        request.keptIds.includes(piece.id) && !look.pieceIds.includes(piece.id),
    );
    if (
      evaluateOutfit([...pieces, ...kept], request, pool).some(
        (problem) => problem.severity === "conflict",
      )
    )
      continue;
    variants.push({
      look,
      pieces,
      missing,
      unavailable,
      repair: {
        ...request,
        keptIds: [
          ...new Set([...request.keptIds, ...pieces.map((piece) => piece.id)]),
        ],
      },
    });
  }
  return { exact, variants };
}

export function rediscover(closet: Closet, clock: Clock, limit = 6): Piece[] {
  if (!hasAnyWear(closet)) return [];
  const today = closet.styling.today;
  const shown = today ? activeSession(today).pieceIds : [];
  const pool = closet.pieces.filter(
    (piece) =>
      piece.source === "owned" &&
      isAvailable(piece) &&
      !shown.includes(piece.id) &&
      !isNeverWear(closet.styling.profile, piece),
  );
  const context = { lastWorn: lastWorn(closet), today: clock.localDate };
  const more = wearMoreIds(closet);
  const group = (
    wear: "never-worn" | "not-worn-lately",
    key: (piece: Piece) => string,
  ) =>
    filterPieces(pool, { ...noFilter, wear }, context).sort(
      (a, b) =>
        Number(more.includes(b.id)) - Number(more.includes(a.id)) ||
        key(a).localeCompare(key(b)),
    );
  return [
    ...group("never-worn", (piece) => piece.createdAt),
    ...group(
      "not-worn-lately",
      (piece) => context.lastWorn[piece.id] ?? "",
    ).filter((piece) => context.lastWorn[piece.id]),
  ].slice(0, limit);
}

export function laundryLoad(closet: Closet, day: string): Piece[] {
  const worn = new Set(
    closet.feedback.flatMap((event) =>
      event.kind === "wore" &&
      !event.undone &&
      wearDate(closet, event.at) === day
        ? event.pieceIds
        : [],
    ),
  );
  return closet.pieces.filter(
    (piece) =>
      piece.source === "owned" && isAvailable(piece) && worn.has(piece.id),
  );
}

export const inWash = (closet: Closet): Piece[] =>
  closet.pieces.filter((piece) => piece.away === "wash");

export const intoWash = (closet: Closet, ids: string[]): Closet =>
  ids.reduce((next, id) => setAway(next, id, "wash"), closet);

export const laundryDone = (closet: Closet, ids: string[]): Closet =>
  ids.reduce(
    (next, id) =>
      next.pieces.find((piece) => piece.id === id)?.away === "wash"
        ? setAway(next, id, null)
        : next,
    closet,
  );

export function costPerWear(piece: Piece, wears: number): number | null {
  return piece.price ? piece.price.amount / Math.max(wears, 1) : null;
}

const seasonWarmth: Record<WearSeason, Warmth> = {
  summer: "light",
  "all-year": "medium",
  winter: "warm",
};

function eachPiece(
  closet: Closet,
  ids: string[],
  change: (piece: Piece) => Piece | null,
): Closet {
  return ids.reduce((next, id) => {
    const piece = next.pieces.find((item) => item.id === id);
    const changed = piece && change(piece);
    return changed ? savePiece(next, changed) : next;
  }, closet);
}

export const setSeason = (closet: Closet, ids: string[], season: WearSeason) =>
  eachPiece(closet, ids, (piece) => ({
    ...piece,
    traits: { ...piece.traits, warmth: seasonWarmth[season] },
    sources: { ...piece.sources, warmth: "confirmed" },
  }));

export const setCategory = (
  closet: Closet,
  ids: string[],
  category: Category,
) =>
  eachPiece(closet, ids, (piece) => {
    if (piece.category === category) return null;
    const { kind, traits: _traits, ...rest } = piece;
    const keeps = kind && kindsIn(category).some((item) => item.id === kind);
    return fitAttributes({ ...rest, category, ...(keeps ? { kind } : {}) });
  });
