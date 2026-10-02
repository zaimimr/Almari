import { test } from "node:test";
import assert from "node:assert/strict";
import { en } from "../i18n/en";
import { nb } from "../i18n/nb";

const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

const nynorsk =
  /(?<!\p{L})(ikkje|kva|korleis|kvifor|berre|frå|eg|ein|eit|noko|nokon|mykje|heile|framleis|vere|sjølv|dykkar|kvar)(?!\p{L})/iu;

const earlierScreens = [
  "Today",
  "Closet",
  "Looks",
  "Cancel",
  "Discard your changes?",
  "Remove this look?",
  "Look name",
  "Start with a piece you love.",
  "Add shoes to complete an outfit.",
];

test("every English text has a bokmål text, and nothing else", () => {
  assert.deepEqual(Object.keys(nb).sort(), Object.keys(en).sort());
});

test("bokmål texts are filled in and keep every placeholder", () => {
  for (const [key, english] of Object.entries(en)) {
    const bokmal = nb[key as keyof typeof nb];
    assert.ok(bokmal.trim(), key);
    assert.deepEqual(placeholders(bokmal), placeholders(english), key);
  }
});

test("no text uses the em dash, and bokmål never uses nynorsk words", () => {
  for (const [key, text] of [...Object.entries(en), ...Object.entries(nb)])
    assert.equal(text.includes("\u2014"), false, key);
  for (const [key, text] of Object.entries(nb))
    assert.equal(nynorsk.test(text), false, `${key}: ${text}`);
});

test("the screens that existed before these parts have their texts in the catalogs", () => {
  const texts = Object.values(en);
  for (const text of earlierScreens) assert.ok(texts.includes(text), text);
});
