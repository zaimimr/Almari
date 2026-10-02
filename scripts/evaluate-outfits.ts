import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { decodeCloset, emptyCloset, type Piece } from "../src/domain/closet";
import { evaluateScorer, parseRatedSet } from "../src/domain/evaluation";
import { samplePieces, sampleTraits } from "../src/domain/samples";
import { rulesScorer } from "../src/domain/scoring/rulesScorer";
import { scoreContext } from "../src/domain/scoring/taste";

const file = process.argv[2] ?? "planning/eval/outfits.json";
const set = parseRatedSet(JSON.parse(readFileSync(file, "utf8")));
const closet = set.closet
  ? decodeCloset(
      readFileSync(join(dirname(file), set.closet), "utf8"),
      sampleTraits,
    )
  : emptyCloset;
const pieces: Piece[] = [
  ...closet.pieces,
  ...samplePieces.filter(
    (sample) => !closet.pieces.some((piece) => piece.id === sample.id),
  ),
];
const result = evaluateScorer(
  set,
  pieces,
  rulesScorer,
  scoreContext(emptyCloset),
);
console.log(`Rated by: ${set.rater}`);
console.log(`Outfits: ${set.outfits.length} in ${result.groups} requests`);
console.log(
  `Pairwise ordering accuracy: ${(result.accuracy * 100).toFixed(1)}% (${result.correct} of ${result.pairs} pairs)`,
);
console.log(
  `Requests with a bad outfit in the top three: ${result.badInTopThree.length}${result.badInTopThree.length ? ` (${result.badInTopThree.join(", ")})` : ""}`,
);
