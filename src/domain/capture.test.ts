import { test } from "node:test";
import assert from "node:assert/strict";
import type { GarmentRegion } from "./closet";
import {
  boxAround,
  holds,
  boxFrom,
  categoryForRegion,
  coveredFrame,
  matchingPiece,
  minBox,
  minPick,
  overlap,
  pickedBox,
  proposalsFromRegions,
  resizeBox,
  toggled,
  toggledAll,
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

test("a product photo without a person uses the found item, not the misread garment", () => {
  const plan = proposalsFromRegions(
    [region("upper", 0.19), region("item", 0.25)],
    0,
  );
  assert.deepEqual(plan.proposals, []);
  assert.equal(plan.checkWhole, false);
});

test("several items without a person give one proposal each with no forced category", () => {
  const plan = proposalsFromRegions(
    [
      region("pants", 0.04),
      region("pants", 0.03),
      region("item", 0.03),
      region("item", 0.04),
    ],
    0,
  );
  assert.deepEqual(
    plan.proposals.map((proposal) => [
      proposal.region.kind,
      proposal.region.share,
      proposal.category,
    ]),
    [
      ["item", 0.04, null],
      ["item", 0.03, null],
    ],
  );
});

test("a flat lay the parser splits keeps its pieces over one found item", () => {
  const plan = proposalsFromRegions(
    [region("upper", 0.3), region("pants", 0.2), region("item", 0.6)],
    0,
  );
  assert.deepEqual(
    plan.proposals.map((proposal) => proposal.region.kind),
    ["upper", "pants"],
  );
});

test("found items are ignored when a person is in the photo", () => {
  const plan = proposalsFromRegions(
    [region("upper"), region("pants"), region("item", 0.4)],
    1,
  );
  assert.deepEqual(
    plan.proposals.map((proposal) => proposal.region.kind),
    ["upper", "pants"],
  );
});

test("a found piece is placed where it shows on a cropped thumbnail", () => {
  const wide = coveredFrame(
    { x: 0.5, y: 0.2, width: 0.25, height: 0.5 },
    1,
    0.8,
  );
  assert.ok(Math.abs(wide.x - 0.5) < 1e-9);
  assert.ok(Math.abs(wide.width - 0.3125) < 1e-9);
  assert.equal(wide.y, 0.2);
  const tall = coveredFrame({ x: 0, y: 0, width: 1, height: 0.2 }, 0.5, 0.8);
  assert.equal(tall.y, 0);
  assert.ok(Math.abs(tall.height - 0.02) < 1e-9);
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

test("pieces can be left out one by one or all at once", () => {
  assert.deepEqual(toggled([], "a"), ["a"]);
  assert.deepEqual(toggled(["a", "b"], "a"), ["b"]);
  assert.deepEqual(toggledAll(["a", "b", "c"], []), ["a", "b", "c"]);
  assert.deepEqual(toggledAll(["a", "b", "c"], ["b"]), []);
});

test("a picked piece that covers one already found is matched instead of added twice", () => {
  const found = [
    { x: 0.3, y: 0, width: 0.4, height: 0.2 },
    null,
    { x: 0.2, y: 0.25, width: 0.6, height: 0.35 },
  ];
  assert.equal(
    matchingPiece(found, { x: 0.22, y: 0.27, width: 0.56, height: 0.33 }),
    2,
  );
  assert.equal(
    matchingPiece(found, { x: 0.3, y: 0.62, width: 0.4, height: 0.36 }),
    -1,
  );
  assert.ok(Math.abs(overlap(found[0]!, found[0]!) - 1) < 1e-9);
  assert.equal(
    overlap(found[0]!, { x: 0, y: 0.8, width: 0.1, height: 0.1 }),
    0,
  );
});

test("a picked piece gets a little room and never shrinks below a usable box", () => {
  const box = pickedBox({ x: 0.4, y: 0.4, width: 0.2, height: 0.3 });
  assert.ok(Math.abs(box.x - 0.38) < 1e-9 && Math.abs(box.width - 0.24) < 1e-9);
  const tiny = pickedBox({ x: 0.97, y: 0.5, width: 0.02, height: 0.01 });
  assert.ok(tiny.width >= minPick && tiny.height >= minPick);
  assert.ok(tiny.x + tiny.width <= 1 && tiny.x >= 0);
  const around = boxAround({ x: 0, y: 1 });
  assert.deepEqual(around, { x: 0, y: 0.7, width: 0.3, height: 0.3 });
});

test("a pick that lands away from the tap is not the tapped piece", () => {
  const box = pickedBox({ x: 0.3, y: 0.4, width: 0.4, height: 0.4 });
  assert.equal(holds(box, { x: 0.5, y: 0.5 }), true);
  assert.equal(holds(box, { x: 0.5, y: 0.9 }), false);
});
