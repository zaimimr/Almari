import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyCloset,
  emptyStyling,
  type OutfitRequest,
  type Piece,
} from "./closet";
import { addSampleWardrobe } from "./samples";
import { evaluateOutfit, styleOutfits } from "./styling";
import compatHead from "./scoring/compat-head.json";
import {
  compatibilityOf,
  createModelScorer,
  embeddingVector,
  embeddingOf,
  modelScorer,
  type CompatHead,
} from "./scoring/modelScorer";
import { rulesScorer } from "./scoring/rulesScorer";
import type { ScoreContext } from "./scoring/types";

const context: ScoreContext = {
  profile: emptyStyling.profile,
  taste: emptyStyling.taste,
  wear: {},
};
const samples = addSampleWardrobe(emptyCloset).pieces;

const request = (changes: Partial<OutfitRequest> = {}): OutfitRequest => ({
  occasion: "work",
  style: "western",
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather: { source: "unknown" },
  hijab: "always",
  wardrobe: "owned",
  ...changes,
});

function encode(values: number[]) {
  const bytes = Array.from({ length: 768 }, (_, index) => values[index] ?? 0);
  return btoa(
    String.fromCharCode(...bytes.map((value) => (value + 256) % 256)),
  );
}

const types = ["main", "bottom", "outer", "shoes", "bag", "scarf", "accessory"];
const row = (index: number) =>
  Array.from({ length: 768 }, (_, column) => (column === index ? 1 : 0));
const tiny: CompatHead = {
  version: 1,
  dim: 2,
  types,
  projection: [row(0), row(1)],
  masks: Object.fromEntries(
    types.flatMap((first, index) =>
      types.slice(index).map((second) => [`${first}|${second}`, [1, 1]]),
    ),
  ),
};

const piece = (
  id: string,
  category: Piece["category"],
  embedding?: string,
): Piece => ({
  id,
  name: id,
  category,
  photo: `${id}.jpg`,
  createdAt: "2026-10-01T08:00:00.000Z",
  source: "owned",
  styles: ["western"],
  ...(embedding ? { embedding } : {}),
});

const top = piece("top", "top", encode([127, 0]));
const trousers = piece("trousers", "bottom", encode([90, 90]));
const loafers = piece("loafers", "shoes", encode([0, 127]));

test("an embedding decodes to a unit vector and bad input is rejected", () => {
  const vector = embeddingVector(encode([127, 127]))!;
  assert.equal(vector.length, 768);
  assert.ok(Math.abs(vector[0]! - Math.SQRT1_2) < 1e-9);
  assert.ok(Math.abs(vector[1]! - Math.SQRT1_2) < 1e-9);
  assert.equal(embeddingVector(encode([])), null);
  assert.equal(embeddingVector("AAAA"), null);
  assert.equal(embeddingVector("not base64!"), null);
  assert.equal(embeddingVector(""), null);
});

test("the model score is the mean type-masked cosine and is deterministic", () => {
  const scorer = createModelScorer(tiny, {});
  const first = scorer.score([top, trousers, loafers], request(), context);
  assert.ok(Math.abs(first.score - (2 * Math.SQRT1_2) / 3) < 1e-9);
  assert.deepEqual(
    scorer.score([top, trousers, loafers], request(), context),
    first,
  );
  const again = createModelScorer(tiny, {}).score(
    [loafers, top, trousers],
    request(),
    context,
  );
  assert.ok(Math.abs(again.score - first.score) < 1e-12);
  const matching = piece("matching", "shoes", encode([127, 0]));
  assert.ok(
    scorer.score([top, trousers, matching], request(), context).score >
      first.score,
  );
  assert.equal(first.fallback, undefined);
});

test("model reasons reuse the rules layer's reason text", () => {
  const scorer = createModelScorer(tiny, {});
  assert.deepEqual(
    scorer.score([top, trousers, loafers], request(), context).reasons,
    rulesScorer.score([top, trousers, loafers], request(), context).reasons,
  );
});

test("a piece without an embedding falls back to the rules score with a reason", () => {
  const scorer = createModelScorer(tiny, {});
  const plain = piece("plain-shoes", "shoes");
  assert.deepEqual(scorer.score([top, trousers, plain], request(), context), {
    ...rulesScorer.score([top, trousers, plain], request(), context),
    fallback: "missing-embedding",
  });
});

test("unreadable embeddings fall back instead of producing NaN", () => {
  const scorer = createModelScorer(tiny, {});
  for (const embedding of ["AAAA", encode([]), "%%%"]) {
    const broken = piece("broken", "shoes", embedding);
    const result = scorer.score([top, trousers, broken], request(), context);
    assert.equal(result.fallback, "missing-embedding");
    assert.equal(Number.isNaN(result.score), false);
  }
  assert.equal(
    compatibilityOf(tiny, [{ embedding: encode([127]), type: "main" }]),
    0,
  );
});

test("every sample piece has a fixture embedding", () => {
  for (const sample of samples)
    assert.notEqual(
      embeddingVector(embeddingOf(sample) ?? ""),
      null,
      sample.id,
    );
  assert.equal(embeddingOf(top), top.embedding);
  assert.equal(embeddingOf(piece("no-reading", "top")), undefined);
});

const exported = compatHead as CompatHead & {
  checks: { embeddings: string[]; types: string[]; score: number }[];
};

test("the exported head has one mask per type pair", () => {
  assert.equal(exported.projection.length, exported.dim);
  assert.equal(Object.keys(exported.masks).length, 28);
  for (const weights of exported.projection) assert.equal(weights.length, 768);
});

test(
  "the exported weights reproduce the training scores",
  {
    skip: exported.checks.length === 0 && "placeholder head without checks",
  },
  () => {
    const head = exported;
    assert.equal(head.checks.length, 3);
    for (const check of head.checks) {
      const score = compatibilityOf(
        head,
        check.embeddings.map((embedding, index) => ({
          embedding,
          type: check.types[index]!,
        })),
      );
      assert.ok(Math.abs(score! - check.score) < 1e-6);
    }
  },
);

test("the model engine keeps every hard constraint and a fixed top three", () => {
  const sampleRequest = request({ wardrobe: "sample" });
  const result = styleOutfits(
    samples,
    sampleRequest,
    "2026-10-01:sample",
    modelScorer,
    context,
  );
  assert.equal(result.status, "ready");
  for (const outfit of result.outfits) {
    const pieces = outfit.ids.map((id) =>
      samples.find((item) => item.id === id)!,
    );
    assert.equal(
      evaluateOutfit(pieces, sampleRequest, samples).every(
        (problem) => problem.severity === "review",
      ),
      true,
    );
  }
  const again = styleOutfits(
    samples,
    sampleRequest,
    "2026-10-01:sample",
    modelScorer,
    context,
  );
  assert.deepEqual(
    again.outfits.slice(0, 3).map((outfit) => outfit.ids),
    result.outfits.slice(0, 3).map((outfit) => outfit.ids),
  );
});

test("sparse closet: the model engine explains what is missing like rules", () => {
  const sparse = [piece("only-hijab", "hijab", encode([127]))];
  const model = styleOutfits(sparse, request(), "seed", modelScorer, context);
  const rules = styleOutfits(sparse, request(), "seed", rulesScorer, context);
  assert.equal(model.status, "missing");
  assert.deepEqual(model.problems, rules.problems);
  const noShoes = [...sparse, top, trousers];
  assert.deepEqual(
    styleOutfits(noShoes, request(), "seed", modelScorer, context).problems,
    styleOutfits(noShoes, request(), "seed", rulesScorer, context).problems,
  );
});
