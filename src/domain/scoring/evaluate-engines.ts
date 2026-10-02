import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { decodeCloset, emptyCloset, type Piece } from "../closet";
import { evaluateScorer, parseRatedSet, type RatedSet } from "../evaluation";
import { samplePieces, sampleTraits } from "../samples";
import { embeddingOf, embeddingVector, modelScorer } from "./modelScorer";
import { rulesScorer } from "./rulesScorer";
import { scoreContext } from "./taste";

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
const context = scoreContext(emptyCloset);

const unread = (outfit: RatedSet["outfits"][number]) =>
  outfit.pieceIds.some(
    (id) =>
      embeddingVector(
        embeddingOf(pieces.find((piece) => piece.id === id)!) ?? "",
      ) === null,
  );

console.log(
  "| Style | Engine | Outfits | Pairwise accuracy | Requests with a bad outfit in the top three | Model fallbacks |",
);
console.log("| --- | --- | --- | --- | --- | --- |");
for (const style of ["all", "western", "desi"] as const) {
  const subset: RatedSet = {
    ...set,
    outfits: set.outfits.filter(
      (outfit) => style === "all" || outfit.style === style,
    ),
  };
  for (const [name, scorer] of [
    ["Rules", rulesScorer],
    ["Model", modelScorer],
  ] as const) {
    const result = evaluateScorer(subset, pieces, scorer, context);
    const accuracy = result.pairs ? result.accuracy.toFixed(3) : "n/a";
    const fallbacks =
      name === "Model" ? subset.outfits.filter(unread).length : 0;
    console.log(
      `| ${style} | ${name} | ${subset.outfits.length} | ${accuracy} | ${result.badInTopThree.length} | ${fallbacks} |`,
    );
  }
}
