import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applicableAttributes,
  confirmAttribute,
  fitAttributes,
  formalityFor,
  isAttributes,
  mergeProposal,
  withDetails,
  type Attributes,
  type Described,
} from "./attributes";

const kurtaProposal: Attributes = {
  length: "knee",
  sleeve: "long",
  volume: "straight",
  pattern: "embroidered",
  scale: "small",
  fabric: "lawn",
  embellishment: "light",
  formality: 3,
};

test("formality follows subcategory, fabric and embellishment within 1 to 6", () => {
  assert.equal(formalityFor({ category: "top", kind: "t-shirt" }), 1);
  assert.equal(
    formalityFor({ category: "top", kind: "t-shirt", fabric: "jersey" }),
    1,
  );
  assert.equal(
    formalityFor({
      category: "tunic",
      kind: "kurta",
      fabric: "lawn",
      embellishment: "none",
    }),
    2,
  );
  assert.equal(
    formalityFor({
      category: "tunic",
      kind: "kurta",
      fabric: "chiffon",
      embellishment: "light",
    }),
    4,
  );
  assert.equal(
    formalityFor({
      category: "bottom",
      kind: "lehenga",
      fabric: "silk",
      embellishment: "heavy",
    }),
    6,
  );
  assert.equal(
    formalityFor({ category: "layer", kind: "blazer", fabric: "wool" }),
    3,
  );
  assert.equal(formalityFor({ category: "layer" }), 2);
  assert.equal(
    formalityFor({ category: "bottom", kind: "jeans", fabric: "denim" }),
    1,
  );
});

test("attributes only apply where they mean something", () => {
  assert.deepEqual(applicableAttributes("shoes", "heels"), ["formality"]);
  assert.deepEqual(applicableAttributes("bottom", "trousers"), [
    "volume",
    "pattern",
    "scale",
    "fabric",
    "embellishment",
    "formality",
  ]);
  assert.deepEqual(applicableAttributes("accessory", "dupatta"), [
    "pattern",
    "scale",
    "fabric",
    "embellishment",
    "formality",
  ]);
  assert.deepEqual(applicableAttributes("tunic", "kurta"), [
    "length",
    "sleeve",
    "volume",
    "pattern",
    "scale",
    "fabric",
    "embellishment",
    "formality",
  ]);
});

test("stored attributes are validated", () => {
  assert.ok(isAttributes({ length: "knee", formality: 3, sheer: true }));
  assert.ok(isAttributes({}));
  assert.equal(isAttributes({ length: "floor" }), false);
  assert.equal(isAttributes({ formality: 7 }), false);
  assert.equal(isAttributes({ formality: 2.5 }), false);
  assert.equal(isAttributes({ colour: "red" }), false);
  assert.equal(isAttributes([]), false);
});

const kurta: Described = { category: "tunic", kind: "kurta" };

test("confirming an attribute marks it confirmed and re-derives a proposed formality", () => {
  let piece = mergeProposal(kurta, kurtaProposal);
  assert.equal(piece.sources?.length, "proposed");
  assert.equal(piece.attributes?.formality, 3);
  piece = confirmAttribute(piece, "fabric", "silk");
  assert.equal(piece.sources?.fabric, "confirmed");
  assert.equal(piece.attributes?.formality, 4);
  assert.equal(piece.sources?.formality, "proposed");
  piece = confirmAttribute(piece, "formality", 2);
  piece = confirmAttribute(piece, "embellishment", "heavy");
  assert.equal(piece.attributes?.formality, 2);
  piece = confirmAttribute(piece, "pattern", "solid");
  assert.equal(piece.attributes?.scale, undefined);
  assert.equal(piece.sources?.scale, undefined);
  assert.throws(() => confirmAttribute(piece, "length", "floor" as never));
});

test("a later proposal never replaces a confirmed, label or legacy value", () => {
  const piece: Described = {
    ...kurta,
    attributes: {
      length: "ankle",
      fabric: "cotton",
      sleeve: "short",
      formality: 5,
    },
    sources: { length: "confirmed", fabric: "label", kind: "confirmed" },
  };
  const next = mergeProposal(piece, kurtaProposal);
  assert.equal(next.attributes?.length, "ankle");
  assert.equal(next.attributes?.fabric, "cotton");
  assert.equal(next.sources?.fabric, "label");
  assert.equal(next.attributes?.sleeve, "short");
  assert.equal(next.sources?.sleeve, undefined);
  assert.equal(next.attributes?.formality, 5);
  assert.equal(next.attributes?.volume, "straight");
  assert.equal(next.sources?.volume, "proposed");
  assert.equal(next.sources?.kind, "confirmed");
});

test("changing the category drops attributes that no longer apply", () => {
  const piece = mergeProposal(kurta, kurtaProposal);
  const shoes = fitAttributes({
    ...piece,
    category: "shoes",
    kind: "khussa",
  });
  assert.deepEqual(shoes.attributes, { formality: 2 });
  assert.deepEqual(shoes.sources, { formality: "proposed" });
});

test("saving the editor keeps her other sources and drops details that no longer fit", () => {
  const before = confirmAttribute(
    mergeProposal(kurta, kurtaProposal),
    "sleeve",
    "elbow",
  );
  const jeans: Described = {
    category: "bottom",
    kind: "jeans",
    sources: { kind: "confirmed", length: "confirmed" },
  };
  const saved = withDetails(jeans, {
    attributes: before.attributes,
    sources: before.sources,
  });
  assert.deepEqual(saved.attributes, {
    volume: "straight",
    pattern: "embroidered",
    scale: "small",
    fabric: "lawn",
    embellishment: "light",
    formality: 2,
  });
  assert.equal(saved.sources?.kind, "confirmed");
  assert.equal(saved.sources?.length, undefined);
  assert.equal(saved.sources?.sleeve, undefined);
  assert.equal(saved.sources?.formality, "proposed");
  assert.deepEqual(withDetails(kurta, {}).attributes, { formality: 2 });
});
