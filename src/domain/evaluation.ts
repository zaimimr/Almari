import {
  occasions,
  styleOptions,
  type Occasion,
  type OutfitRequest,
  type Piece,
  type Style,
} from "./closet";
import type { ScoreContext, Scorer } from "./scoring/types";

export type Rating = "no" | "ok" | "would-wear";

export type RatedOutfit = {
  id: string;
  occasion: Occasion;
  style: Style;
  pieceIds: string[];
  rating: Rating;
  note?: string;
};

export type RatedSet = {
  version: 1;
  rater: string;
  closet: string | null;
  outfits: RatedOutfit[];
};

export type Evaluation = {
  pairs: number;
  correct: number;
  accuracy: number;
  groups: number;
  badInTopThree: string[];
};

const ratings: Rating[] = ["no", "ok", "would-wear"];

function fail(problem: string): never {
  throw new Error(`Rated outfits: ${problem}`);
}

export function parseRatedSet(value: unknown): RatedSet {
  if (typeof value !== "object" || value === null) fail("not an object");
  const set = value as Record<string, unknown>;
  if (set.version !== 1) fail("version must be 1");
  if (typeof set.rater !== "string" || !set.rater) fail("rater is missing");
  if (set.closet !== null && typeof set.closet !== "string")
    fail("closet must be a file name or null");
  if (!Array.isArray(set.outfits) || !set.outfits.length)
    fail("outfits are missing");
  const ids = new Set<string>();
  for (const item of set.outfits as Record<string, unknown>[]) {
    if (typeof item.id !== "string" || ids.has(item.id))
      fail(`outfit id ${String(item.id)} is missing or repeated`);
    ids.add(item.id);
    if (!occasions.some((occasion) => occasion.id === item.occasion))
      fail(`${item.id} has an unknown occasion`);
    if (!styleOptions.some((style) => style.id === item.style))
      fail(`${item.id} has an unknown style`);
    if (!ratings.includes(item.rating as Rating))
      fail(`${item.id} has an unknown rating`);
    if (
      !Array.isArray(item.pieceIds) ||
      !item.pieceIds.length ||
      !item.pieceIds.every((id) => typeof id === "string")
    )
      fail(`${item.id} has no pieces`);
  }
  return value as RatedSet;
}

function requestFor(outfit: RatedOutfit): OutfitRequest {
  return {
    occasion: outfit.occasion,
    style: outfit.style,
    garmentType: null,
    keptIds: [],
    excludedIds: [],
    weather: { source: "unknown" },
    hijab: null,
    wardrobe: "owned",
  };
}

export function evaluateScorer(
  set: RatedSet,
  pieces: Piece[],
  scorer: Scorer,
  context: ScoreContext,
): Evaluation {
  const groups = new Map<string, { outfit: RatedOutfit; score: number }[]>();
  for (const outfit of set.outfits) {
    const outfitPieces = outfit.pieceIds.map((id) => {
      const piece = pieces.find((item) => item.id === id);
      if (!piece)
        fail(`${outfit.id} uses a piece that is not in the closet: ${id}`);
      return piece;
    });
    const key = `${outfit.occasion} ${outfit.style}`;
    const score = scorer.score(outfitPieces, requestFor(outfit), context).score;
    groups.set(key, [...(groups.get(key) ?? []), { outfit, score }]);
  }
  let pairs = 0;
  let correct = 0;
  const badInTopThree: string[] = [];
  for (const [key, scored] of groups) {
    for (const a of scored)
      for (const b of scored) {
        const better =
          ratings.indexOf(a.outfit.rating) > ratings.indexOf(b.outfit.rating);
        if (!better) continue;
        pairs += 1;
        correct += a.score > b.score ? 1 : a.score === b.score ? 0.5 : 0;
      }
    const places = Math.min(
      3,
      scored.filter((item) => item.outfit.rating !== "no").length,
    );
    const top = [...scored]
      .sort(
        (a, b) => b.score - a.score || a.outfit.id.localeCompare(b.outfit.id),
      )
      .slice(0, places);
    if (top.some((item) => item.outfit.rating === "no"))
      badInTopThree.push(key);
  }
  return {
    pairs,
    correct,
    accuracy: pairs ? correct / pairs : 0,
    groups: groups.size,
    badInTopThree,
  };
}
