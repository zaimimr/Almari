import { test } from "node:test";
import assert from "node:assert/strict";
import { en, type Key } from "../i18n/en";
import { nb } from "../i18n/nb";
import { localeFor, translate } from "../i18n/translate";
import { draftFromLabel, knownFibres, labelFromDraft } from "./careLabel";
import { categories, garmentKinds, occasions, styleOptions } from "./taxonomy";

const catalogs = { en, nb };

test("the app speaks bokmål on Norwegian phones and English everywhere else", () => {
  for (const code of ["nb", "no", "nn", "NB", "No"])
    assert.equal(localeFor(code), "nb", code);
  for (const code of ["en", "sv", "da", "ur", "", null, undefined])
    assert.equal(localeFor(code), "en", String(code));
});

test("a key reads from the chosen catalog and fills its placeholders", () => {
  assert.equal(translate(catalogs, "en", "piece.style"), "Style");
  assert.equal(translate(catalogs, "nb", "piece.style"), "Stil");
  assert.equal(
    translate(catalogs, "en", "capture.askCategory", {
      first: "Tops",
      second: "Layers",
    }),
    "Is this in Tops or Layers?",
  );
  assert.equal(
    translate(catalogs, "nb", "piece.styleFixed", { styles: "Desi" }),
    "Desi, bestemt av underkategorien",
  );
  assert.equal(
    translate(catalogs, "en", "piece.styleFixed"),
    "{styles}, set by the subcategory",
  );
  assert.equal(
    translate(
      { en: { count: "{n} of {n}" }, nb: { count: "{n} av {n}" } },
      "nb",
      "count",
      { n: 3 },
    ),
    "3 av 3",
  );
});

test("both catalogs have the same keys and the same placeholders", () => {
  const holes = (text: string) =>
    [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  assert.deepEqual(Object.keys(nb).sort(), Object.keys(en).sort());
  for (const key of Object.keys(en) as Key[]) {
    assert.ok(nb[key].trim(), key);
    assert.deepEqual(holes(nb[key]), holes(en[key]), key);
    assert.equal(/\u2014/.test(en[key] + nb[key]), false, key);
  }
});

test("English names match the taxonomy and Desi names stay the same in bokmål", () => {
  for (const category of categories)
    assert.equal(en[`category.${category.id}`], category.label);
  for (const kind of garmentKinds)
    assert.equal(en[`kind.${kind.id}`], kind.label);
  for (const style of styleOptions)
    assert.equal(en[`style.${style.id}`], style.label);
  for (const occasion of occasions) assert.ok(en[`occasion.${occasion.id}`]);
  const desi = [
    "kurta",
    "kurti",
    "kameez",
    "shalwar",
    "churidar",
    "sharara",
    "gharara",
    "lehenga",
    "anarkali",
    "abaya",
    "khussa",
    "dupatta",
  ] as const;
  for (const id of desi) assert.equal(nb[`kind.${id}`], en[`kind.${id}`], id);
});

test("every known fibre has a name in both catalogs that reads back as the same fibre", () => {
  for (const fibre of knownFibres) {
    const key = `fibre.${fibre}` as Key;
    assert.equal(en[key], fibre, fibre);
    for (const catalog of [en, nb]) {
      const shown = draftFromLabel(
        { materials: [{ fibre, percent: 40 }] },
        (id) => catalog[`fibre.${id}` as Key],
      );
      assert.deepEqual(labelFromDraft("label.jpg", shown).materials, [
        { fibre, percent: 40 },
      ]);
    }
  }
});
