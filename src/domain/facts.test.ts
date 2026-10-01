import { test } from "node:test";
import assert from "node:assert/strict";
import { en } from "../i18n/en";
import { attributeKeys, optionsFor } from "./attributes";
import { emptyCloset, savePiece, type Piece } from "./closet";
import {
  attributeLabelKey,
  attributeValueKey,
  confirmFact,
  factChoice,
  pieceFacts,
  type Fact,
} from "./facts";

const bare: Piece = {
  id: "kurta",
  name: "Sage kurta",
  category: "tunic",
  photo: "kurta.png",
  createdAt: "2026-10-01T08:00:00.000Z",
  source: "owned",
};

const kurta: Piece = {
  ...bare,
  kind: "kurta",
  styles: ["desi"],
  colors: [
    { rgb: [167, 174, 152], share: 0.7 },
    { rgb: [238, 235, 230], share: 0.2 },
  ],
  attributes: {
    length: "ankle",
    sleeve: "long",
    volume: "straight",
    pattern: "embroidered",
    scale: "small",
    fabric: "lawn",
    embellishment: "light",
    formality: 3,
  },
  sources: {
    kind: "proposed",
    sleeve: "proposed",
    volume: "proposed",
    pattern: "proposed",
    scale: "proposed",
    fabric: "label",
    embellishment: "proposed",
    formality: "proposed",
  },
};

const shown = (fact: Fact) => ({
  key: fact.key,
  label: en[fact.label],
  value: en[fact.value],
  source: fact.source,
});
const facts = (piece: Piece) => pieceFacts(piece).map(shown);
const seasonOf = (piece: Piece) =>
  facts(piece).find((fact) => fact.key === "season");

test("the item page facts follow the spec order with their sources", () => {
  assert.deepEqual(facts(kurta), [
    { key: "colour", label: "Colour", value: "Sage", source: "confirmed" },
    { key: "kind", label: "Subcategory", value: "Kurta", source: "proposed" },
    { key: "fabric", label: "Fabric", value: "Lawn", source: "label" },
    {
      key: "pattern",
      label: "Pattern",
      value: "Embroidered",
      source: "proposed",
    },
    { key: "volume", label: "Fit", value: "Straight", source: "proposed" },
    { key: "length", label: "Length", value: "Ankle", source: "confirmed" },
    { key: "sleeve", label: "Sleeves", value: "Long", source: "proposed" },
    {
      key: "formality",
      label: "Formality",
      value: "Dressy",
      source: "proposed",
    },
    { key: "season", label: "Season", value: "Summer", source: "label" },
  ]);
});

test("unknown values give no fact", () => {
  assert.deepEqual(pieceFacts(bare), []);
  assert.deepEqual(pieceFacts({ ...bare, colors: [], attributes: {} }), []);
  assert.deepEqual(
    pieceFacts({ ...bare, attributes: { fabric: "cotton" } }).map(
      (fact) => fact.key,
    ),
    ["fabric"],
  );
});

test("each fact keeps its source, and a value without a source counts as confirmed", () => {
  assert.deepEqual(
    pieceFacts({ ...bare, kind: "kurta", attributes: { length: "ankle" } }).map(
      (fact) => [fact.key, fact.source],
    ),
    [
      ["kind", "confirmed"],
      ["length", "confirmed"],
    ],
  );
  assert.deepEqual(facts({ ...bare, attributes: { sheer: true } }), [
    { key: "sheer", label: "See-through", value: "Yes", source: "confirmed" },
  ]);
  assert.equal(
    facts({ ...bare, attributes: { sheer: false } })[0]!.value,
    "No",
  );
});

test("season comes from warmth first, then from a clear fabric", () => {
  assert.deepEqual(
    seasonOf({
      ...bare,
      traits: { warmth: "warm" },
      attributes: { fabric: "lawn" },
      sources: { fabric: "proposed" },
    }),
    { key: "season", label: "Season", value: "Winter", source: "confirmed" },
  );
  assert.equal(
    seasonOf({ ...bare, traits: { warmth: "medium" } })!.value,
    "All year",
  );
  assert.equal(
    seasonOf({ ...bare, traits: { warmth: "light" } })!.value,
    "Summer",
  );
  assert.deepEqual(
    seasonOf({
      ...bare,
      attributes: { fabric: "wool" },
      sources: { fabric: "proposed" },
    }),
    { key: "season", label: "Season", value: "Winter", source: "proposed" },
  );
  assert.equal(
    seasonOf({ ...bare, attributes: { fabric: "cotton" } }),
    undefined,
  );
  assert.equal(seasonOf(bare), undefined);
});

test("every attribute, value and colour has a name in the catalog", () => {
  assert.deepEqual(
    attributeKeys.map((key) => en[attributeLabelKey(key)]),
    [
      "Length",
      "Sleeves",
      "Fit",
      "Pattern",
      "Pattern size",
      "Fabric",
      "Embellishment",
      "Formality",
    ],
  );
  for (const key of attributeKeys)
    for (const option of optionsFor(key))
      assert.equal(
        en[attributeValueKey(key, option.id)],
        option.label,
        `${key} ${option.id}`,
      );
  const colour = (rgb: [number, number, number]) =>
    facts({ ...bare, colors: [{ rgb, share: 1 }] })[0]!.value;
  assert.equal(colour([36, 45, 71]), "Navy");
  assert.equal(colour([195, 195, 195]), "Light grey");
});

test("tapping a guess confirms it or changes it", () => {
  const closet = savePiece(emptyCloset, kurta);
  const pattern = factChoice(kurta, "pattern")!;
  assert.equal(en[pattern.label], "Pattern");
  assert.equal(pattern.current, "embroidered");
  assert.deepEqual(
    pattern.options.map((option) => en[option.label]),
    ["Solid", "Print", "Stripe", "Check", "Embroidered"],
  );
  let next = confirmFact(closet, "kurta", "pattern", "embroidered");
  assert.equal(next.pieces[0]!.attributes?.pattern, "embroidered");
  assert.equal(next.pieces[0]!.sources?.pattern, "confirmed");
  next = confirmFact(next, "kurta", "volume", "voluminous");
  assert.equal(next.pieces[0]!.attributes?.volume, "voluminous");
  assert.equal(next.pieces[0]!.sources?.volume, "confirmed");
  next = confirmFact(next, "kurta", "formality", "5");
  assert.equal(next.pieces[0]!.attributes?.formality, 5);
  assert.equal(
    pieceFacts(next.pieces[0]!).find((fact) => fact.key === "formality")!
      .source,
    "confirmed",
  );
  assert.throws(() => confirmFact(next, "kurta", "length", "floor"));
  assert.equal(confirmFact(next, "gone", "length", "knee"), next);
  assert.equal(factChoice(kurta, "colour"), null);
  assert.equal(factChoice(kurta, "sheer"), null);
});

test("the season guess asks about the fabric", () => {
  const wool: Piece = {
    ...bare,
    kind: "tunic",
    attributes: { fabric: "wool" },
    sources: { fabric: "proposed" },
  };
  assert.equal(en[factChoice(wool, "season")!.label], "Fabric");
  assert.equal(factChoice(wool, "season")!.current, "wool");
  const piece = confirmFact(
    savePiece(emptyCloset, wool),
    "kurta",
    "season",
    "lawn",
  ).pieces[0]!;
  assert.equal(piece.attributes?.fabric, "lawn");
  assert.equal(piece.sources?.fabric, "confirmed");
  assert.deepEqual(seasonOf(piece), {
    key: "season",
    label: "Season",
    value: "Summer",
    source: "confirmed",
  });
});

test("confirming a subcategory guess also fixes its style and refits the details", () => {
  const tunic: Piece = {
    ...kurta,
    kind: "tunic",
    styles: ["western"],
    sources: { ...kurta.sources, kind: "proposed", styles: "proposed" },
  };
  const closet = savePiece(emptyCloset, tunic);
  const choice = factChoice(tunic, "kind")!;
  assert.equal(en[choice.label], "Subcategory");
  assert.equal(choice.current, "tunic");
  assert.ok(
    choice.options.some(
      (option) => option.id === "kurta" && en[option.label] === "Kurta",
    ),
  );
  assert.equal(
    choice.options.some((option) => option.id === "jeans"),
    false,
  );
  const desi = confirmFact(closet, "kurta", "kind", "kurta").pieces[0]!;
  assert.equal(desi.kind, "kurta");
  assert.deepEqual(desi.styles, ["desi"]);
  assert.equal(desi.sources?.kind, "confirmed");
  assert.equal(desi.sources?.styles, "confirmed");
  assert.equal(desi.attributes?.formality, 3);
  const same = confirmFact(closet, "kurta", "kind", "tunic").pieces[0]!;
  assert.equal(same.sources?.kind, "confirmed");
  assert.deepEqual(same.styles, ["western"]);
  assert.equal(same.sources?.styles, "proposed");
  assert.equal(same.attributes?.formality, 2);
  assert.throws(() => confirmFact(closet, "kurta", "kind", "jeans"));
});
