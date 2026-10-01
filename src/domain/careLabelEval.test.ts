import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCareText } from "./careLabel";
import {
  careLabelFixtures,
  hasRecordedModel,
  readers,
  recordedModel,
  scoreLabels,
} from "./careLabelEval";

test("C21 the parser reads every fixture fact except brands and adds nothing wrong", () => {
  const brands = careLabelFixtures.filter(
    (fixture) => fixture.expected.brand,
  ).length;
  const score = scoreLabels(readers.parser);
  assert.equal(score.wrong, 0);
  assert.equal(score.missed, brands);
  assert.equal(score.correct, score.expected - brands);
});

test("C22 the recorded model only fills what the parser left empty", () => {
  if (hasRecordedModel)
    for (const fixture of careLabelFixtures)
      assert.ok(fixture.id in recordedModel, fixture.id);
  for (const fixture of careLabelFixtures) {
    const parsed = parseCareText(fixture.text);
    const merged = readers.merged(fixture);
    if (parsed.materials.length)
      assert.deepEqual(merged.materials, parsed.materials, fixture.id);
    for (const key of ["size", "origin"] as const)
      if (parsed[key]) assert.equal(merged[key], parsed[key], fixture.id);
  }
  const parser = scoreLabels(readers.parser);
  const merged = scoreLabels(readers.merged);
  assert.ok(merged.correct >= parser.correct);
  assert.ok(merged.missed <= parser.missed);
});

test("C23 without a recording the model reads nothing and the merge equals the parser", () => {
  if (hasRecordedModel) return;
  assert.deepEqual(scoreLabels(readers.merged), scoreLabels(readers.parser));
  assert.equal(scoreLabels(readers.model).correct, 0);
});
