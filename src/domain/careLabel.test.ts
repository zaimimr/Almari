import { test } from "node:test";
import assert from "node:assert/strict";
import {
  draftFromLabel,
  fabricFromMaterials,
  fibreName,
  isCareLabel,
  labelFromDraft,
  mergeCareLabel,
  parseCareText,
  readCareLabelText,
  withCareLabel,
  type CareLabel,
  type LabelFields,
  type LabelModel,
} from "./careLabel";
import { careLabelFixtures } from "./careLabelEval";
import { formalityFor } from "./attributes";
import type { Piece } from "./closet";

const withoutBrand = (fields: LabelFields): LabelFields => {
  const copy = { ...fields };
  delete copy.brand;
  return copy;
};

test("C01 the parser reads every fixture except its brand", () => {
  assert.ok(careLabelFixtures.length >= 15);
  for (const fixture of careLabelFixtures)
    assert.deepEqual(
      parseCareText(fixture.text),
      withoutBrand(fixture.expected),
      fixture.id,
    );
});

test("C02 English and Norwegian fibre words map to one name", () => {
  const cases: [string, string | null][] = [
    ["Cotton", "cotton"],
    ["BOMULL", "cotton"],
    ["økologisk bomull", "cotton"],
    ["polyester", "polyester"],
    ["resirkulert polyester", "polyester"],
    ["viskose", "viscose"],
    ["Rayon", "viscose"],
    ["elastan", "elastane"],
    ["Spandex", "elastane"],
    ["ull", "wool"],
    ["Merinoull", "wool"],
    ["lammeull", "wool"],
    ["kasjmir", "cashmere"],
    ["silke", "silk"],
    ["lin", "linen"],
    ["Linen", "linen"],
    ["Polyamid", "polyamide"],
    ["nylon", "polyamide"],
    ["akryl", "acrylic"],
    ["Modal", "modal"],
    ["Lyocell", "lyocell"],
    ["Lawn", null],
    ["lining", null],
    ["Baumwolle", null],
    ["", null],
  ];
  for (const [word, fibre] of cases) assert.equal(fibreName(word), fibre, word);
});

test("C03 sizes are letter codes or EU numbers, never other numbers", () => {
  const cases: [string, string | undefined][] = [
    ["Str. M", "M"],
    ["Størrelse: L", "L"],
    ["Str 38", "38"],
    ["EU 38", "38"],
    ["UK 12 EUR 40", "40"],
    ["EUR M  USA M  MEX 28", "M"],
    ["Size: xs", "XS"],
    ["100% cotton\nXXL", "XXL"],
    ["RN 52469 CA 23456", undefined],
    ["90 x 90 cm", undefined],
    ["Vask på 30 °C", undefined],
    ["Size 128", undefined],
    ["Small print", undefined],
  ];
  for (const [text, size] of cases)
    assert.equal(parseCareText(text).size, size, text);
});

test("C04 origin is read after Made in, Laget i or Produsert i", () => {
  const cases: [string, string | undefined][] = [
    ["Made in Bangladesh", "Bangladesh"],
    ["Laget i Kina", "Kina"],
    ["Produsert i Tyrkia\nStr. M", "Tyrkia"],
    ["PRODUCED IN SRI LANKA", "SRI LANKA"],
    ["Made in Turkey\nTillverkad i Turkiet", "Turkey"],
    ["Made in", undefined],
    ["Made in\n100% cotton", undefined],
    ["Made in\nPolyester 100%", undefined],
    ["100% cotton", undefined],
  ];
  for (const [text, origin] of cases)
    assert.equal(parseCareText(text).origin, origin, text);
});

test("C05a a prefix word does not flip the order of a percent-first line", () => {
  for (const text of ["Body: 60% Cotton 40% Silk", "Shell 60% Cotton 40% Silk"])
    assert.deepEqual(
      parseCareText(text).materials,
      [
        { fibre: "cotton", percent: 60 },
        { fibre: "silk", percent: 40 },
      ],
      text,
    );
});

test("C05 nothing readable gives empty fields and odd numbers are skipped", () => {
  assert.deepEqual(parseCareText(""), { materials: [] });
  assert.deepEqual(parseCareText("1¦ ~ .\nIII 0 ;"), { materials: [] });
  assert.deepEqual(parseCareText("250% cotton\n100% kevlar"), {
    materials: [],
  });
  assert.deepEqual(parseCareText("65% polyester 35% viskose").materials, [
    { fibre: "polyester", percent: 65 },
    { fibre: "viscose", percent: 35 },
  ]);
});

const blend = "H&M\n95% Cotton\n5% Elastane\nMade in Bangladesh\nSize S";

test("C06 a perfect model answer fills the brand on every fixture", () => {
  for (const fixture of careLabelFixtures)
    assert.deepEqual(
      mergeCareLabel(
        parseCareText(fixture.text),
        fixture.ideal ? JSON.stringify(fixture.ideal) : null,
        fixture.text,
      ),
      fixture.expected,
      fixture.id,
    );
});

test("C07 the parser's values win over the model's", () => {
  const json = JSON.stringify({
    materials: [{ fibre: "Elastane", percent: 95 }],
    size: "M",
    brand: "H&M",
    origin: "India",
  });
  assert.deepEqual(mergeCareLabel(parseCareText(blend), json, blend), {
    materials: [
      { fibre: "cotton", percent: 95 },
      { fibre: "elastane", percent: 5 },
    ],
    size: "S",
    brand: "H&M",
    origin: "Bangladesh",
  });
});

test("C08 model values that are not printed on the label are dropped", () => {
  const text = "Fabric: Cotton Silk\nSapphire";
  const json = JSON.stringify({
    materials: [
      { fibre: "Cotton", percent: 60 },
      { fibre: "Silk", percent: 40 },
      { fibre: "Kevlar", percent: 100 },
      { fibre: "Wool", percent: 10 },
    ],
    size: "S",
    brand: "Sapphire",
    origin: "Pakistan",
  });
  assert.deepEqual(mergeCareLabel(parseCareText(text), json, text), {
    materials: [
      { fibre: "cotton", percent: null },
      { fibre: "silk", percent: null },
    ],
    brand: "Sapphire",
  });
  const plain = "100% Cotton\nMade in Turkey";
  assert.deepEqual(
    mergeCareLabel(
      parseCareText(plain),
      JSON.stringify({ brand: "Cotton", size: "M" }),
      plain,
    ),
    { materials: [{ fibre: "cotton", percent: 100 }], origin: "Turkey" },
  );
  const brand = "Cotton On\n100% Cotton";
  assert.equal(
    mergeCareLabel(
      parseCareText(brand),
      JSON.stringify({ brand: "Cotton On" }),
      brand,
    ).brand,
    "Cotton On",
  );
});

test("C09 broken or odd model output adds nothing", () => {
  const text = "100% COTTON\nMade in Turkey";
  const parsed = parseCareText(text);
  for (const json of [
    null,
    "",
    "{materials",
    "[1, 2]",
    '"Zara"',
    '{"materials": "cotton"}',
    '{"materials": [{"fibre": 3}], "brand": 42, "size": null}',
  ])
    assert.deepEqual(mergeCareLabel(parsed, json, text), parsed, String(json));
});

test("C10 the printed check ignores case but needs whole words", () => {
  const text = "KAPPAHL\n100% VISKOSE\nPRODUSERT I TYRKIA";
  const parsed = parseCareText(text);
  assert.deepEqual(
    mergeCareLabel(
      parsed,
      JSON.stringify({ brand: "Kappahl", origin: "Turkey" }),
      text,
    ),
    { ...parsed, brand: "Kappahl" },
  );
  assert.deepEqual(
    mergeCareLabel(parsed, JSON.stringify({ brand: "Kappahl AB" }), text),
    parsed,
  );
  assert.deepEqual(
    mergeCareLabel(parsed, JSON.stringify({ brand: "Kapp" }), text),
    parsed,
  );
});

function fakeModel(ready: boolean | Error, answer: string | null | Error) {
  const asked: string[] = [];
  const model: LabelModel = {
    available: async () => {
      if (ready instanceof Error) throw ready;
      return ready;
    },
    extract: async (text) => {
      asked.push(text);
      if (answer instanceof Error) throw answer;
      return answer;
    },
  };
  return { model, asked };
}

test("C11 only the parser runs when the model is off, failing or not needed", async () => {
  const parsed: LabelFields = parseCareText(blend);
  const answer = JSON.stringify({ brand: "H&M" });
  const off = fakeModel(false, answer);
  assert.deepEqual(await readCareLabelText(blend, off.model), parsed);
  assert.deepEqual(off.asked, []);
  const on = fakeModel(true, answer);
  assert.deepEqual(await readCareLabelText(blend, on.model), {
    ...parsed,
    brand: "H&M",
  });
  assert.deepEqual(on.asked, [blend]);
  const throwing = fakeModel(true, new Error("model"));
  assert.deepEqual(await readCareLabelText(blend, throwing.model), parsed);
  const broken = fakeModel(new Error("availability"), answer);
  assert.deepEqual(await readCareLabelText(blend, broken.model), parsed);
  assert.deepEqual(broken.asked, []);
  const empty = fakeModel(true, answer);
  assert.deepEqual(await readCareLabelText(" \n ", empty.model), {
    materials: [],
  });
  assert.deepEqual(empty.asked, []);
});

const piece = (changes: Partial<Piece> = {}): Piece => ({
  id: "piece",
  name: "Sage kurta",
  category: "tunic",
  photo: "piece.png",
  createdAt: "2026-10-01T08:00:00Z",
  source: "owned",
  ...changes,
});

const label = (changes: Partial<CareLabel> = {}): CareLabel => ({
  photo: "piece-label.jpg",
  materials: [
    { fibre: "cotton", percent: 95 },
    { fibre: "elastane", percent: 5 },
  ],
  ...changes,
});

test("C12 a label she types is cleaned and normalised", () => {
  const typed = labelFromDraft("piece-label.jpg", {
    materials: [
      { fibre: " Bomull ", percent: "80 %" },
      { fibre: "Tencel", percent: "20" },
      { fibre: "cotton", percent: "5" },
      { fibre: "  ", percent: "10" },
      { fibre: "silke", percent: "250" },
    ],
    size: " M ",
    brand: "",
    origin: "Norge",
  });
  assert.deepEqual(typed, {
    photo: "piece-label.jpg",
    materials: [
      { fibre: "cotton", percent: 80 },
      { fibre: "tencel", percent: 20 },
      { fibre: "silk", percent: null },
    ],
    size: "M",
    origin: "Norge",
  });
  assert.ok(isCareLabel(typed));
  const draft = draftFromLabel(
    { materials: [{ fibre: "cotton", percent: 95 }], size: "S" },
    (fibre) => (fibre === "cotton" ? "bomull" : fibre),
  );
  assert.deepEqual(draft, {
    materials: [{ fibre: "bomull", percent: "95" }],
    size: "S",
    brand: "",
    origin: "",
  });
  assert.deepEqual(labelFromDraft("a.jpg", draft).materials, [
    { fibre: "cotton", percent: 95 },
  ]);
  assert.deepEqual(draftFromLabel(), {
    materials: [],
    size: "",
    brand: "",
    origin: "",
  });
});

test("C13 a stored label is checked before it is trusted", () => {
  assert.ok(isCareLabel(label({ size: "M", brand: "H&M", origin: "Turkey" })));
  assert.ok(isCareLabel(label({ materials: [] })));
  assert.equal(isCareLabel(label({ photo: "" })), false);
  assert.equal(isCareLabel({ photo: "a.jpg" }), false);
  assert.equal(
    isCareLabel(label({ materials: [{ fibre: "cotton", percent: 120 }] })),
    false,
  );
  assert.equal(
    isCareLabel(label({ materials: [{ fibre: "cotton", percent: 2.5 }] })),
    false,
  );
  assert.equal(isCareLabel(label({ size: "" })), false);
});

test("C14 the main fibre sets the fabric with source label", () => {
  const next = withCareLabel(piece(), label());
  assert.deepEqual(next.label, label());
  assert.equal(next.attributes?.fabric, "cotton");
  assert.equal(next.sources?.fabric, "label");
  const proposed = withCareLabel(
    piece({ attributes: { fabric: "lawn" }, sources: { fabric: "proposed" } }),
    label(),
  );
  assert.equal(proposed.attributes?.fabric, "cotton");
  assert.equal(proposed.sources?.fabric, "label");
  assert.equal(
    fabricFromMaterials([{ fibre: "cashmere", percent: 100 }]),
    "wool",
  );
  assert.equal(
    fabricFromMaterials([
      { fibre: "silk", percent: null },
      { fibre: "polyester", percent: null },
    ]),
    "silk",
  );
  const silk = label({ materials: [{ fibre: "silk", percent: 100 }] });
  const rated = withCareLabel(
    piece({
      attributes: { fabric: "lawn", formality: 2 },
      sources: { fabric: "proposed", formality: "proposed" },
    }),
    silk,
  );
  assert.equal(
    rated.attributes?.formality,
    formalityFor({ category: "tunic", fabric: "silk" }),
  );
  assert.equal(rated.sources?.formality, "proposed");
});

test("C15 a confirmed fabric is never replaced by the label", () => {
  for (const confirmed of [
    piece({ attributes: { fabric: "silk" } }),
    piece({ attributes: { fabric: "silk" }, sources: { fabric: "confirmed" } }),
  ]) {
    const next = withCareLabel(confirmed, label());
    assert.equal(next.attributes?.fabric, "silk");
    assert.equal(next.sources?.fabric, confirmed.sources?.fabric);
    assert.deepEqual(next.label, label());
  }
});

test("C16 synthetic or unknown fibres record materials without inventing a fabric", () => {
  const synthetic = label({
    materials: [
      { fibre: "polyester", percent: 60 },
      { fibre: "cotton", percent: 40 },
    ],
  });
  assert.equal(fabricFromMaterials(synthetic.materials), null);
  assert.equal(fabricFromMaterials([]), null);
  const fresh = withCareLabel(piece(), synthetic);
  assert.equal(fresh.attributes, undefined);
  assert.equal(fresh.sources, undefined);
  const relabelled = withCareLabel(withCareLabel(piece(), label()), synthetic);
  assert.equal(relabelled.attributes?.fabric, undefined);
  assert.equal(relabelled.sources?.fabric, undefined);
  assert.deepEqual(relabelled.label, synthetic);
});

test("C17 removing the label removes only a fabric that came from it", () => {
  const labelled = withCareLabel(
    piece({ attributes: { length: "knee" }, sources: { length: "confirmed" } }),
    label(),
  );
  const removed = withCareLabel(labelled, undefined);
  assert.equal(removed.label, undefined);
  assert.deepEqual(removed.attributes, { length: "knee" });
  assert.deepEqual(removed.sources, { length: "confirmed" });
  const confirmed = withCareLabel(
    piece({ attributes: { fabric: "silk" }, label: label() }),
    undefined,
  );
  assert.equal(confirmed.attributes?.fabric, "silk");
  assert.equal(confirmed.label, undefined);
});
