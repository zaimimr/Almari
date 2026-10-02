import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyTaste } from "../closet";
import {
  countPairs,
  learnPreference,
  pairAffinity,
  tasteLimit,
  wearBoost,
  weightOf,
} from "./taste";

const bases = { tonal: 0.5, echo: 0.8, clash: -1 };

test("a preference moves weights toward the preferred outfit's rules", () => {
  const taste = learnPreference(emptyTaste, bases, { tonal: 1 }, { clash: 1 });
  assert.ok(weightOf("tonal", 0.5, taste) > 0.5);
  assert.ok(weightOf("clash", -1, taste) < -1);
  assert.equal(weightOf("echo", 0.8, taste), 0.8);
});

test("a hundred identical preferences never move a weight past its limit", () => {
  let taste = emptyTaste;
  for (let index = 0; index < 100; index++)
    taste = learnPreference(taste, bases, { clash: 1 }, { tonal: 1 });
  for (const [id, base] of Object.entries(bases)) {
    const weight = weightOf(id, base, taste);
    assert.ok(Math.abs(weight - base) <= tasteLimit + 1e-9, id);
  }
  assert.ok(weightOf("tonal", 0.5, taste) >= -0.5);
});

test("a stored weight outside the limit is clamped when read", () => {
  assert.equal(
    weightOf("tonal", 0.5, { weights: { tonal: 9 }, pairs: {} }),
    1.5,
  );
});

test("rejected pairs give a bounded penalty and worn pairs a reason", () => {
  let taste = emptyTaste;
  for (let index = 0; index < 20; index++)
    taste = countPairs(taste, ["a", "b"], "rejected");
  const rejected = pairAffinity(["a", "b", "c"], taste);
  assert.ok(rejected.value < 0 && rejected.value > -0.4);
  assert.equal(rejected.often, null);
  taste = countPairs(
    countPairs(emptyTaste, ["a", "c"], "worn"),
    ["c", "a"],
    "worn",
  );
  assert.deepEqual(pairAffinity(["a", "c"], taste).often, ["a", "c"]);
});

test("the wear boost favours less-worn pieces gently and never punishes favourites", () => {
  assert.equal(wearBoost(["a", "b"], {}), 0);
  const fresh = wearBoost(["a", "b"], { c: 4 });
  const favourite = wearBoost(["c", "b"], { c: 4 });
  assert.ok(fresh > favourite);
  assert.ok(favourite > 0);
  assert.ok(fresh <= 0.3);
});
