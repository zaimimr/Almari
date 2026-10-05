import type { Piece } from "./closet";
import { factsFor } from "./scoring/rules";
import { ruleBook } from "./scoring/rulebook";
import { occasions, type Occasion } from "./taxonomy";

export const dressLevels = ["casual", "smart", "festive"] as const;

export type DressLevel = (typeof dressLevels)[number];

const levelOf = (formality: number): DressLevel =>
  formality >= 4 ? "festive" : formality >= 2 ? "smart" : "casual";

export function dressiness(pieces: Piece[], occasion: Occasion) {
  const target = occasions.find((item) => item.id === occasion)?.formality ?? 1;
  const levels = factsFor(pieces, ruleBook.thresholds)
    .filter((facts) => ["main", "layer", "outer"].includes(facts.role))
    .map((facts) => facts.formality);
  if (target < 2 || !levels.length) return null;
  const level = levelOf(Math.max(...levels));
  const goal = levelOf(target);
  return {
    level,
    goal,
    short: dressLevels.indexOf(level) < dressLevels.indexOf(goal),
  };
}
