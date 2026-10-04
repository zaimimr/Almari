import {
  sparkles,
  type OutfitRequest,
  type Piece,
  type StyleProfile,
} from "../closet";
import { t } from "../../i18n";
import { ruleBook, type RuleBook } from "./rulebook";
import { baseWeight, factsFor, reasonFor, ruleHits } from "./rules";
import { pairAffinity, wearBoost, weightOf, type Features } from "./taste";
import type { Scorer } from "./types";

export function baseWeights(profile: StyleProfile, book: RuleBook = ruleBook) {
  return Object.fromEntries(
    book.rules.map((rule) => [rule.id, baseWeight(rule, profile)]),
  );
}

export function features(
  pieces: Piece[],
  request: OutfitRequest,
  profile: StyleProfile,
  book: RuleBook = ruleBook,
): Features {
  return Object.fromEntries(
    ruleHits(book, pieces, request, profile).map((hit) => [hit.rule.id, 1]),
  );
}

const sparkleOccasions = ["eid", "party", "wedding", "barat"];

function sparklePenalty(
  book: RuleBook,
  outfit: Piece[],
  request: OutfitRequest,
  profile: StyleProfile,
) {
  const level = profile.sparkle;
  if (!level || !sparkleOccasions.includes(request.occasion)) return 0;
  const wanted = sparkles.indexOf(level);
  const floor = wanted >= sparkles.indexOf("heavy") ? 1 : 0;
  return factsFor(outfit, book.thresholds).reduce((total, facts) => {
    if (!facts.sparkle || !facts.piece.styles?.includes("desi")) return total;
    const rank = sparkles.indexOf(facts.sparkle);
    if (rank > wanted) return total - 0.6;
    if (rank < floor) return total - 0.3;
    return total;
  }, 0);
}

function lower(piece: Piece) {
  return piece.name.charAt(0).toLowerCase() + piece.name.slice(1);
}

export function rulesScorerFor(book: RuleBook): Scorer {
  return {
    score(outfit, request, context) {
      const reasons: { text: string; weight: number }[] = [];
      let score = 0;
      for (const hit of ruleHits(book, outfit, request, context.profile)) {
        const weight = weightOf(
          hit.rule.id,
          baseWeight(hit.rule, context.profile),
          context.taste,
        );
        score += weight;
        const text = weight > 0 && hit.certain ? reasonFor(hit, request) : null;
        if (text) reasons.push({ text, weight });
      }
      const ids = outfit.map((piece) => piece.id);
      const affinity = pairAffinity(ids, context.taste);
      score +=
        affinity.value +
        wearBoost(ids, context.wear) +
        sparklePenalty(book, outfit, request, context.profile);
      const often = outfit.filter((piece) =>
        affinity.often?.includes(piece.id),
      );
      if (often.length === 2)
        reasons.push({
          text: t("stylist.often", {
            a: lower(often[0]!),
            b: lower(often[1]!),
          }),
          weight: 1,
        });
      const ordered = reasons
        .map((reason, index) => ({ ...reason, index }))
        .sort((a, b) => b.weight - a.weight || a.index - b.index)
        .map((reason) => reason.text);
      return { score, reasons: [...new Set(ordered)].slice(0, 2) };
    },
  };
}

export const rulesScorer = rulesScorerFor(ruleBook);
