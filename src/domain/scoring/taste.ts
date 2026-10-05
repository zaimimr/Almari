import type { Closet, FeedbackEvent, Taste } from "../closet";
import type { ScoreContext } from "./types";

export const tasteLimit = 1;
export const learningRate = 0.1;
export const priorStrength = 1;
const pairWeight = 0.8;

export type Features = Record<string, number>;

function clamp(weight: number, base: number) {
  return Math.min(base + tasteLimit, Math.max(base - tasteLimit, weight));
}

export function weightOf(id: string, base: number, taste: Taste) {
  const weight = taste.weights[id];
  return weight === undefined ? base : clamp(weight, base);
}

export function learnPreference(
  taste: Taste,
  bases: Record<string, number>,
  preferred: Features,
  other: Features,
): Taste {
  const ids = [
    ...new Set([
      ...Object.keys(taste.weights),
      ...Object.keys(preferred),
      ...Object.keys(other),
    ]),
  ].filter((id) => bases[id] !== undefined);
  const current = (id: string) => weightOf(id, bases[id]!, taste);
  const difference = (id: string) => (preferred[id] ?? 0) - (other[id] ?? 0);
  const margin = ids.reduce(
    (total, id) => total + current(id) * difference(id),
    0,
  );
  const surprise = 1 - 1 / (1 + Math.exp(-margin));
  const weights = Object.fromEntries(
    ids.map((id) => {
      const weight = current(id);
      const next =
        weight +
        learningRate * surprise * difference(id) -
        learningRate * priorStrength * (weight - bases[id]!);
      return [id, clamp(next, bases[id]!)];
    }),
  );
  return { ...taste, weights };
}

export function pairKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function pairsOf(ids: string[]) {
  return ids.flatMap((a, index) =>
    ids.slice(index + 1).map((b) => pairKey(a, b)),
  );
}

export function countPairs(
  taste: Taste,
  ids: string[],
  field: "worn" | "rejected",
): Taste {
  const pairs = { ...taste.pairs };
  for (const key of pairsOf(ids)) {
    const counts = pairs[key] ?? { worn: 0, rejected: 0 };
    pairs[key] = { ...counts, [field]: counts[field] + 1 };
  }
  return { ...taste, pairs };
}

export function pairAffinity(ids: string[], taste: Taste) {
  let value = 0;
  let best: { key: string; mean: number; worn: number } | null = null;
  for (const key of pairsOf(ids)) {
    const counts = taste.pairs[key];
    if (!counts) continue;
    const mean = (1 + counts.worn) / (2 + counts.worn + counts.rejected);
    value += pairWeight * (mean - 0.5);
    if (counts.worn >= 2 && mean >= 0.7 && (!best || mean > best.mean))
      best = { key, mean, worn: counts.worn };
  }
  return {
    value: value / Math.max(1, ids.length - 1),
    often: best ? (best.key.split("|") as [string, string]) : null,
  };
}

export function wearBoost(ids: string[], wear: Record<string, number>) {
  if (!ids.length || !Object.keys(wear).length) return 0;
  const fresh = ids.reduce((total, id) => total + 1 / (1 + (wear[id] ?? 0)), 0);
  return (0.3 * fresh) / ids.length;
}

export function wearCounts(events: FeedbackEvent[]) {
  const counts: Record<string, number> = {};
  const seen = new Set<string>();
  for (const event of events)
    if (event.kind === "wore" && !event.undone)
      for (const id of event.pieceIds) {
        const day = `${id}:${event.at.slice(0, 10)}`;
        if (seen.has(day)) continue;
        seen.add(day);
        counts[id] = (counts[id] ?? 0) + 1;
      }
  return counts;
}

export function scoreContext(closet: Closet): ScoreContext {
  return {
    profile: closet.styling.profile,
    taste: closet.styling.taste,
    wear: wearCounts(closet.feedback),
  };
}
