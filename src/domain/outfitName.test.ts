import { test } from "node:test";
import assert from "node:assert/strict";
import { en } from "../i18n/en";
import { nb } from "../i18n/nb";
import type { Category, GarmentKind, Piece } from "./closet";
import { outfitName } from "./outfitName";
import { tipText } from "./outfitView";

const piece = (
  id: string,
  category: Category,
  kind: GarmentKind,
  rgb: [number, number, number] | null,
): Piece => ({
  id,
  name: id,
  category,
  kind,
  photo: `${id}.jpg`,
  createdAt: "2026-10-01T00:00:00Z",
  source: "owned",
  ...(rgb ? { colors: [{ rgb, share: 1 }] } : {}),
});

const hijab = piece("hijab", "hijab", "hijab", [236, 231, 218]);
const shalwar = piece("shalwar", "bottom", "shalwar", [236, 231, 218]);

test("a name is the main piece's colour, the occasion and the subcategory", () => {
  const kurta = piece("kurta", "tunic", "kurta", [50, 120, 70]);
  assert.equal(
    outfitName([hijab, kurta, shalwar], "eid", "en"),
    "Green Eid kurta",
  );
  assert.equal(
    outfitName([hijab, kurta, shalwar], "eid", "nb"),
    "Kurta i grønt til Eid",
  );
  const sage = piece("sage", "tunic", "kurta", [160, 170, 145]);
  assert.equal(outfitName([sage, shalwar], "party", "en"), "Sage party kurta");
  assert.equal(
    outfitName([sage, shalwar], "party", "nb"),
    "Kurta i salviegrønt til fest",
  );
});

test("everyday adds no occasion word and a piece without colours has no colour word", () => {
  const abaya = {
    ...piece("abaya", "dress", "abaya", [142, 120, 106]),
    traits: { open: false },
  };
  assert.equal(outfitName([hijab, abaya], "everyday", "en"), "Taupe abaya");
  assert.equal(
    outfitName([hijab, abaya], "everyday", "nb"),
    "Abaya i gråbrunt",
  );
  const plain = piece("kurta", "tunic", "kurta", null);
  assert.equal(outfitName([plain, shalwar], "eid", "en"), "Eid kurta");
  assert.equal(outfitName([plain, shalwar], "eid", "nb"), "Kurta til Eid");
  assert.equal(outfitName([], "eid", "en"), "");
});

test("every palette colour has an English and a bokmål word", () => {
  const names = [
    "black",
    "charcoal",
    "grey",
    "light-grey",
    "white",
    "ivory",
    "beige",
    "camel",
    "taupe",
    "brown",
    "chocolate",
    "navy",
    "blue",
    "sky-blue",
    "teal",
    "green",
    "sage",
    "olive",
    "mustard",
    "yellow",
    "orange",
    "rust",
    "red",
    "burgundy",
    "pink",
    "blush",
    "mauve",
    "lavender",
    "purple",
    "plum",
  ];
  const catalogs: Record<string, string>[] = [en, nb];
  for (const catalog of catalogs)
    for (const name of names)
      assert.ok(catalog[`outfitName.colour.${name}`], name);
});

test("bokmål names and tips use the bokmål garment word", () => {
  const tunic = piece("tunic", "tunic", "tunic", [236, 231, 218]);
  assert.equal(
    outfitName([hijab, tunic, shalwar], "work", "nb"),
    "Tunika i elfenben til jobb",
  );
  assert.equal(
    tipText({ kind: "handbag", rgb: [78, 52, 42] }, "nb"),
    "En håndveske i sjokoladebrunt ville fullført antrekket.",
  );
});
