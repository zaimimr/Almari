import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyCloset,
  type Closet,
  type ImportJob,
  type Piece,
  type Prepared,
} from "./closet";
import {
  decodeEmbedding,
  duplicateAbove,
  findDuplicate,
  similarity,
} from "./duplicates";

const vector = (...values: number[]) =>
  btoa(String.fromCharCode(...values.map((value) => value & 255)));

const piece = (
  id: string,
  embedding?: string,
  source: Piece["source"] = "owned",
): Piece => ({
  id,
  name: `Black hijab ${id}`,
  category: "hijab",
  kind: "hijab",
  photo: `${id}.png`,
  createdAt: "2026-10-01T08:00:00Z",
  source,
  ...(embedding ? { embedding } : {}),
});

const job = (id: string, embedding?: string): ImportJob => ({
  id,
  source: `${id}-original.jpg`,
  createdAt: "2026-10-01T08:00:00Z",
  state: "queued",
  attempts: 0,
  ...(embedding ? { prepared: { embedding } as unknown as Prepared } : {}),
});

test("int8 embeddings decode with their signs", () => {
  assert.deepEqual(
    [...decodeEmbedding(vector(127, -127, 0, -1, 5))],
    [127, -127, 0, -1, 5],
  );
});

test("cosine similarity of int8 embeddings", () => {
  assert.equal(similarity(vector(100, 0), vector(50, 0)), 1);
  assert.equal(similarity(vector(100, 0), vector(0, 100)), 0);
  assert.ok(similarity(vector(100, 0), vector(100, 38)) > duplicateAbove);
  assert.ok(similarity(vector(100, 0), vector(100, 40)) < duplicateAbove);
  assert.equal(similarity(vector(100, 0), vector(100, 0, 0)), 0);
  assert.equal(similarity(vector(0, 0), vector(100, 0)), 0);
});

test("the closest owned piece above the threshold is the duplicate", () => {
  const closet: Closet = {
    ...emptyCloset,
    pieces: [
      piece("a", vector(100, 0)),
      piece("b", vector(100, 20)),
      piece("sample", vector(100, 18), "sample"),
      piece("c"),
    ],
  };
  assert.equal(findDuplicate(closet, "job", vector(100, 18)), "b");
  assert.equal(findDuplicate(closet, "job", vector(100, 1)), "a");
  assert.equal(findDuplicate(closet, "job", vector(0, 100)), null);
  assert.equal(findDuplicate(closet, "job", null), null);
  assert.equal(findDuplicate(closet, "job", undefined), null);
});

test("an earlier photo in the same batch counts and a later one does not", () => {
  const closet: Closet = {
    ...emptyCloset,
    imports: [
      job("first", vector(100, 0)),
      job("job"),
      job("later", vector(100, 0)),
    ],
  };
  assert.equal(findDuplicate(closet, "job", vector(100, 1)), "first");
  assert.equal(findDuplicate(closet, "first", vector(100, 1)), null);
});

test("pieces from the same photo are not duplicates of each other", () => {
  const closet: Closet = {
    ...emptyCloset,
    pieces: [{ ...piece("kurta", vector(100, 0)), captureId: "photo" }],
    imports: [
      { ...job("trousers", vector(100, 0)), captureId: "photo" },
      { ...job("job"), captureId: "photo" },
    ],
  };
  assert.equal(findDuplicate(closet, "job", vector(100, 1)), null);
  const other: Closet = {
    ...closet,
    imports: closet.imports.map((item) => ({ ...item, captureId: "other" })),
  };
  assert.equal(findDuplicate(other, "job", vector(100, 1)), "kurta");
});
