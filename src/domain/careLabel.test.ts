import { test } from "node:test";
import assert from "node:assert/strict";
import { fibreName, parseCareText, type LabelFields } from "./careLabel";
import { careLabelFixtures } from "./careLabelEval";

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
    ["100% cotton", undefined],
  ];
  for (const [text, origin] of cases)
    assert.equal(parseCareText(text).origin, origin, text);
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
