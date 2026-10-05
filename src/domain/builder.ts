import {
  isAvailable,
  type Closet,
  type Occasion,
  type OutfitRequest,
  type Piece,
  type Style,
} from "./closet";
import { allowedPieces } from "./preferences";
import { rulesScorer } from "./scoring/rulesScorer";
import { scoreContext } from "./scoring/taste";
import { evaluateOutfit, roleOf, type Problem } from "./styling";
import { activeSession, everydayRequest, resultFor } from "./today";

export function baseRequest(closet: Closet): OutfitRequest {
  const { today, everyday, wardrobe, profile } = closet.styling;
  if (today) return activeSession(today).request;
  if (everyday)
    return everydayRequest(everyday, wardrobe, profile.coverageLevel, {
      source: "unknown",
    });
  return {
    occasion: "everyday",
    style: "western",
    garmentType: null,
    keptIds: [],
    excludedIds: [],
    weather: { source: "unknown" },
    hijab: null,
    wardrobe,
  };
}

export function builderRequest(
  closet: Closet,
  pieceIds: string[],
  occasion?: Occasion,
): OutfitRequest {
  const base = baseRequest(closet);
  const picked = pieceIds.flatMap((id) =>
    closet.pieces.filter((piece) => piece.id === id),
  );
  const other: Style = base.style === "desi" ? "western" : "desi";
  const switches =
    picked.some(
      (piece) => piece.styles && !piece.styles.includes(base.style),
    ) && picked.every((piece) => !piece.styles || piece.styles.includes(other));
  return {
    ...base,
    occasion: occasion ?? base.occasion,
    style: switches ? other : base.style,
    garmentType: null,
    keptIds: pieceIds,
    excludedIds: [],
    wardrobe: picked[0]?.source ?? base.wardrobe,
  };
}

export function fillOutfit(
  closet: Closet,
  request: OutfitRequest,
  localDate: string,
): { ids: string[] } | { problems: Problem[] } {
  const result = resultFor(closet, request, localDate);
  const first = result.outfits[0];
  return first ? { ids: first.ids } : { problems: result.problems };
}

function judge(closet: Closet, request: OutfitRequest, localDate: string) {
  const pool = closet.pieces.filter(
    (piece) => piece.source === request.wardrobe && isAvailable(piece),
  );
  const scorer = rulesScorer;
  const context = scoreContext(closet);
  return (outfit: Piece[]) => {
    const problems = evaluateOutfit(outfit, request, pool);
    return {
      broken:
        outfit.some((piece) => !pool.includes(piece)) ||
        problems.some((problem) => problem.severity === "conflict"),
      coverage: problems.filter((problem) => problem.code === "coverage")
        .length,
      score: scorer.score(outfit, request, context).score,
    };
  };
}

type Fit = { piece: Piece; broken: boolean; coverage: number; score: number };

const byFit = (a: Fit, b: Fit) =>
  Number(a.broken) - Number(b.broken) ||
  a.coverage - b.coverage ||
  b.score - a.score ||
  a.piece.name.localeCompare(b.piece.name);

export function rankPieces(
  closet: Closet,
  request: OutfitRequest,
  pieceIds: string[],
  candidates: Piece[],
  localDate: string,
): Piece[] {
  if (!pieceIds.length) return candidates;
  const fit = judge(closet, request, localDate);
  const picked = pieceIds.flatMap((id) =>
    candidates.filter((piece) => piece.id === id),
  );
  const outfit = pieceIds.flatMap((id) =>
    closet.pieces.filter((piece) => piece.id === id),
  );
  const ranked = candidates
    .filter((piece) => !pieceIds.includes(piece.id))
    .map((piece) => ({ piece, ...fit([...outfit, piece]) }))
    .sort(byFit)
    .map(({ piece }) => piece);
  return [...picked, ...ranked];
}

export function swapOptions(
  closet: Closet,
  request: OutfitRequest,
  pieceIds: string[],
  targetId: string,
  localDate: string,
): Piece[] {
  const outfit = pieceIds.flatMap((id) =>
    closet.pieces.filter((piece) => piece.id === id),
  );
  const target = outfit.find((piece) => piece.id === targetId);
  if (!target) return [];
  const fit = judge(closet, request, localDate);
  const current = fit(outfit).coverage;
  return allowedPieces(closet, closet.pieces)
    .filter(
      (piece) =>
        roleOf(piece) === roleOf(target) && !pieceIds.includes(piece.id),
    )
    .map((piece) => ({
      piece,
      ...fit(outfit.map((item) => (item.id === targetId ? piece : item))),
    }))
    .filter((option) => !option.broken && option.coverage <= current)
    .sort(byFit)
    .slice(0, 3)
    .map(({ piece }) => piece);
}

export function followName(current: string, previous: string, next: string) {
  return current === previous ? next : current;
}
