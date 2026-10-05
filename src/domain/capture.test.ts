import { test } from "node:test";
import assert from "node:assert/strict";
import type { GarmentRegion } from "./closet";
import {
  boxFrom,
  categoryForRegion,
  minBox,
  proposalsFromRegions,
  resizeBox,
} from "./capture";

const region = (
  kind: GarmentRegion["kind"],
  share = 0.1,
  partial = false,
): GarmentRegion => ({
  kind,
  cutout: `photo-region-${kind}.png`,
  frame: { x: 0.25, y: 0.25, width: 0.5, height: 0.25 },
  share,
  partial,
});

test("a group photo gives proposals for the person in front only and says others were ignored", () => {
  const plan = proposalsFromRegions(
    [
      region("shoes"),
      region("upper", 0.2, true),
      region("pants"),
      region("head"),
    ],
    3,
  );
  assert.deepEqual(
    plan.proposals.map((proposal) => proposal.region.kind),
    ["head", "upper", "pants", "shoes"],
  );
  assert.equal(plan.notice, "others-ignored");
  assert.equal(plan.people, 3);
  assert.equal(plan.proposals[0]!.category, "hijab");
  assert.equal(plan.proposals[1]!.category, null);
  assert.equal(plan.proposals[1]!.region.partial, true);
});

test("one person wearing one garment still uses the parser cutout", () => {
  const plan = proposalsFromRegions([region("dress")], 1);
  assert.equal(plan.proposals.length, 1);
  assert.equal(plan.notice, null);
});

test("a single-garment photo without a person keeps the existing cutout path", () => {
  assert.deepEqual(proposalsFromRegions([region("upper")], 0).proposals, []);
  assert.deepEqual(proposalsFromRegions([], 0).proposals, []);
  assert.deepEqual(proposalsFromRegions([], 1).proposals, []);
});

test("a flat lay with several pieces gives one proposal each, larger first", () => {
  const plan = proposalsFromRegions(
    [region("upper", 0.1), region("shoes", 0.05), region("upper", 0.3)],
    0,
  );
  assert.deepEqual(
    plan.proposals.map((proposal) => [
      proposal.region.kind,
      proposal.region.share,
    ]),
    [
      ["upper", 0.3],
      ["upper", 0.1],
      ["shoes", 0.05],
    ],
  );
  assert.equal(plan.notice, null);
  assert.equal(categoryForRegion("shoes"), "shoes");
  assert.equal(categoryForRegion("bag"), "bag");
  assert.equal(categoryForRegion("pants"), "bottom");
  assert.equal(categoryForRegion("upper"), null);
});

test("a box drawn in any direction stays inside the photo", () => {
  assert.deepEqual(boxFrom({ x: 0.75, y: 0.875 }, { x: 0.25, y: 0.125 }), {
    x: 0.25,
    y: 0.125,
    width: 0.5,
    height: 0.75,
  });
  assert.deepEqual(boxFrom({ x: -0.5, y: 0.5 }, { x: 0.5, y: 1.5 }), {
    x: 0,
    y: 0.5,
    width: 0.5,
    height: 0.5,
  });
  assert.equal(
    boxFrom({ x: 0.5, y: 0.5 }, { x: 0.5 + minBox / 2, y: 0.75 }),
    null,
  );
});

test("a box grows and shrinks around its centre without leaving the photo", () => {
  const box = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
  assert.deepEqual(resizeBox(box, 0.25), {
    x: 0.125,
    y: 0.125,
    width: 0.75,
    height: 0.75,
  });
  assert.deepEqual(resizeBox(box, 1), { x: 0, y: 0, width: 1, height: 1 });
  assert.deepEqual(
    resizeBox({ x: 0.75, y: 0, width: 0.25, height: 0.25 }, 0.25),
    {
      x: 0.5,
      y: 0,
      width: 0.5,
      height: 0.5,
    },
  );
  assert.equal(resizeBox(box, -1).width, minBox);
});
