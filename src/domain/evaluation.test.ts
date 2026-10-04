import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { emptyCloset, type Piece } from "./closet";
import { evaluateScorer, parseRatedSet, type RatedSet } from "./evaluation";
import { samplePieces } from "./samples";
import { rulesScorer } from "./scoring/rulesScorer";
import { scoreContext } from "./scoring/taste";
import type { Scorer } from "./scoring/types";

const context = scoreContext(emptyCloset);
const piece = (id: string): Piece => ({
  id,
  name: id,
  category: "tunic",
  photo: `${id}.jpg`,
  createdAt: "2026-10-01T00:00:00Z",
  source: "owned",
});
const byLength: Scorer = {
  score: (outfit) => ({ score: outfit[0]!.id.length, reasons: [] }),
};
const set: RatedSet = {
  version: 1,
  rater: "test",
  closet: null,
  outfits: [
    {
      id: "1",
      occasion: "work",
      style: "western",
      pieceIds: ["aaaa"],
      rating: "would-wear",
    },
    {
      id: "2",
      occasion: "work",
      style: "western",
      pieceIds: ["aaa"],
      rating: "ok",
    },
    {
      id: "3",
      occasion: "work",
      style: "western",
      pieceIds: ["aaaaa"],
      rating: "no",
    },
    {
      id: "4",
      occasion: "work",
      style: "western",
      pieceIds: ["a"],
      rating: "no",
    },
    {
      id: "5",
      occasion: "eid",
      style: "desi",
      pieceIds: ["bb"],
      rating: "would-wear",
    },
    { id: "6", occasion: "eid", style: "desi", pieceIds: ["b"], rating: "no" },
  ],
};
const pieces = ["aaaa", "aaa", "aaaaa", "a", "bb", "b"].map(piece);

test("pairwise accuracy counts correctly ordered better and worse outfits per request", () => {
  const result = evaluateScorer(set, pieces, byLength, context);
  assert.equal(result.groups, 2);
  assert.equal(result.pairs, 6);
  assert.equal(result.correct, 4);
  assert.equal(result.accuracy, 4 / 6);
  assert.deepEqual(result.badInTopThree, ["work western"]);
});

test("a rated set with an unknown rating, occasion or piece is rejected", () => {
  assert.throws(
    () =>
      parseRatedSet({
        ...set,
        outfits: [{ ...set.outfits[0]!, rating: "maybe" }],
      }),
    /unknown rating/,
  );
  assert.throws(
    () =>
      parseRatedSet({
        ...set,
        outfits: [{ ...set.outfits[0]!, occasion: "celebration" }],
      }),
    /unknown occasion/,
  );
  assert.throws(
    () => evaluateScorer(set, pieces.slice(1), byLength, context),
    /not in the closet: aaaa/,
  );
});

test("the starter rated set uses the sample closet and has no bad outfit in a top three", () => {
  const starter = parseRatedSet(
    JSON.parse(readFileSync("planning/eval/outfits.json", "utf8")),
  );
  const result = evaluateScorer(starter, samplePieces, rulesScorer, context);
  assert.ok(result.pairs > 0);
  assert.ok(result.accuracy >= 0.75, String(result.accuracy));
  assert.deepEqual(result.badInTopThree, []);
});
