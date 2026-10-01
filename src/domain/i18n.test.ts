import { test } from "node:test";
import assert from "node:assert/strict";
import { en, type Key } from "../i18n/en";
import { nb } from "../i18n/nb";
import { localeFor, translate } from "../i18n/translate";

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
    assert.equal(/—/.test(en[key] + nb[key]), false, key);
  }
});
