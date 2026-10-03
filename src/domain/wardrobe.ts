import type { Attributes } from "./attributes";
import {
  isAvailable,
  savePiece,
  type Closet,
  type Look,
  type OutfitRequest,
  type Piece,
  type Traits,
} from "./closet";
import { isNeverWear } from "./preferences";
import { evaluateOutfit, roleOf, type Problem } from "./styling";

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

export function hijabAlternatives(
  closet: Closet,
  request: OutfitRequest,
  currentIds: string[],
  score: (outfit: Piece[]) => { score: number; reasons: string[] },
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
      reason: reasonFor(piece, result.reasons),
      problems: evaluateOutfit(pieces, request, pool),
    };
  };
  const options = pool
    .filter(
      (piece) =>
        roleOf(piece) === "hijab" &&
        piece.id !== current.id &&
        !request.excludedIds.includes(piece.id) &&
        !isNeverWear(closet.styling.profile, piece),
    )
    .map(option)
    .filter(({ problems }) =>
      problems.every((problem) => problem.severity === "review"),
    )
    .sort(
      (a, b) => b.score - a.score || a.piece.name.localeCompare(b.piece.name),
    )
    .slice(0, 3);
  return { current: option(current), options };
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
