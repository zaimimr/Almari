import {
  emptyCloset,
  type Occasion,
  type OutfitRequest,
  type Style,
} from "../src/domain/closet";
import { realisticPieces } from "../src/domain/realistic-closet.fixture";
import { samplePieces } from "../src/domain/samples";
import { ruleBook } from "../src/domain/scoring/rulebook";
import { baseWeight, ruleHits } from "../src/domain/scoring/rules";
import { rulesScorer } from "../src/domain/scoring/rulesScorer";
import { scoreContext } from "../src/domain/scoring/taste";

const [occasion, style, ...ids] = process.argv.slice(2);
const all = [...realisticPieces, ...samplePieces];
const outfit = ids.map((id) => all.find((piece) => piece.id === id)!);
const request: OutfitRequest = {
  occasion: occasion as Occasion,
  style: style as Style,
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather: { source: "unknown" },
  hijab: "always",
  wardrobe: outfit[0]!.source,
};
const context = scoreContext(emptyCloset);
for (const hit of ruleHits(ruleBook, outfit, request, context.profile))
  console.log(
    `${baseWeight(hit.rule, context.profile).toFixed(2).padStart(6)} ${hit.rule.id}`,
  );
console.log("total", rulesScorer.score(outfit, request, context).score);
