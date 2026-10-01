import { test } from "node:test";
import assert from "node:assert/strict";
import type { LabelScore } from "./taxonomy";
import { attributeCheck, proposeAttributes } from "./recognition";

const scores = (
  entries: [LabelScore["group"], string, number][],
): LabelScore[] =>
  entries.map(([group, value, score]) => ({ group, value, score }));

const kurtaLabels = scores([
  ["length", "knee", 0.12],
  ["length", "calf", 0.09],
  ["sleeve", "long", 0.11],
  ["sleeve", "elbow", 0.08],
  ["volume", "straight", 0.1],
  ["volume", "fitted", 0.07],
  ["pattern", "embroidered", 0.13],
  ["pattern", "solid", 0.1],
  ["scale", "small", 0.09],
  ["scale", "large", 0.05],
  ["fabric", "lawn", 0.1],
  ["fabric", "cotton", 0.095],
  ["embellishment", "light", 0.1],
  ["embellishment", "none", 0.06],
  ["kind", "kurta", 0.2],
]);

test("the classifier proposes every attribute the piece can have", () => {
  const proposal = proposeAttributes(kurtaLabels, {
    category: "tunic",
    kind: "kurta",
  });
  assert.deepEqual(proposal.attributes, {
    length: "knee",
    sleeve: "long",
    volume: "straight",
    pattern: "embroidered",
    scale: "small",
    fabric: "lawn",
    embellishment: "light",
    formality: 3,
  });
  assert.deepEqual(proposal.uncertain, ["fabric"]);
  assert.equal(attributeCheck(proposal, false), null);
});

test("shoes get no garment attributes and see-through or open front are never proposed", () => {
  const proposal = proposeAttributes(kurtaLabels, {
    category: "shoes",
    kind: "heels",
  });
  assert.deepEqual(proposal.attributes, { formality: 3 });
  assert.equal(
    "sheer" in
      proposeAttributes(kurtaLabels, { category: "dress", kind: "abaya" })
        .attributes,
    false,
  );
});

test("solid pieces get no pattern size and missing groups stay unknown", () => {
  const proposal = proposeAttributes(
    scores([
      ["pattern", "solid", 0.2],
      ["pattern", "print", 0.1],
      ["scale", "large", 0.3],
    ]),
    { category: "hijab", kind: "hijab" },
  );
  assert.deepEqual(proposal.attributes, { pattern: "solid", formality: 1 });
});

test("one quick check at most, only for an uncertain attribute the stylist needs", () => {
  const unsure = scores([
    ["length", "knee", 0.12],
    ["length", "calf", 0.115],
    ["sleeve", "long", 0.11],
    ["sleeve", "elbow", 0.105],
    ["fabric", "silk", 0.1],
    ["fabric", "satin", 0.099],
  ]);
  const proposal = proposeAttributes(unsure, {
    category: "dress",
    kind: "dress",
  });
  assert.deepEqual(proposal.uncertain, ["length", "sleeve", "fabric"]);
  assert.equal(attributeCheck(proposal, false), "length");
  assert.equal(attributeCheck(proposal, true), null);
  const sleeveOnly = proposeAttributes(unsure.slice(2), {
    category: "dress",
    kind: "dress",
  });
  assert.equal(attributeCheck(sleeveOnly, false), "sleeve");
  const fabricOnly = proposeAttributes(unsure.slice(4), {
    category: "dress",
    kind: "dress",
  });
  assert.equal(attributeCheck(fabricOnly, false), null);
});
