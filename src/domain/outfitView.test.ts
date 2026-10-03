import { test } from "node:test";
import assert from "node:assert/strict";
import {
  neutralProfile,
  type Category,
  type GarmentKind,
  type OutfitRequest,
  type Piece,
  type StyleProfile,
} from "./closet";
import type { Attributes } from "./attributes";
import {
  coverageChecks,
  coverageNote,
  flatLay,
  outfitTip,
  tipText,
} from "./outfitView";
import { piece as plainPiece } from "./test-helpers";

const request = (changes: Partial<OutfitRequest> = {}): OutfitRequest => ({
  occasion: "work",
  style: "western",
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather: { source: "unknown" },
  hijab: "always",
  wardrobe: "owned",
  ...changes,
});

const piece = (
  id: string,
  category: Category,
  kind: GarmentKind,
  rgb: [number, number, number],
  attributes: Attributes = {},
  extra: Partial<Piece> = {},
): Piece => ({
  id,
  name: id,
  category,
  kind,
  photo: `${id}.jpg`,
  createdAt: "2026-10-01T00:00:00Z",
  source: "owned",
  attributes,
  colors: [{ rgb, share: 1 }],
  ...extra,
});

const tunic = piece("tunic", "tunic", "tunic", [236, 231, 218], {
  sleeve: "long",
  length: "thigh",
  pattern: "solid",
});
const trousers = piece("trousers", "bottom", "trousers", [62, 62, 64], {
  length: "ankle",
  pattern: "solid",
});
const hijab = piece("hijab", "hijab", "hijab", [78, 52, 42], {
  pattern: "solid",
});
const loafers = piece("loafers", "shoes", "loafers", [78, 52, 42]);
const blazer = piece("blazer", "layer", "blazer", [35, 45, 75], {
  sleeve: "long",
});
const full: StyleProfile = { ...neutralProfile, coverageLevel: "full" };
const texts = (pieces: Piece[], profile: StyleProfile = full) =>
  coverageChecks(pieces, request(), profile).map((check) => [
    check.state,
    check.text,
  ]);

test("the flat lay shows the main garment large and accessories in a column", () => {
  assert.deepEqual(flatLay([loafers, hijab, blazer, trousers, tunic]), {
    large: tunic,
    garments: [trousers, blazer],
    column: [hijab, loafers],
  });
});

test("confirmed long sleeves and ankle length pass full coverage", () => {
  assert.deepEqual(texts([tunic, trousers, hijab, loafers]), [
    ["ok", "Long sleeves."],
    ["ok", "Covers to the ankle."],
    ["ok", "Hijab included."],
    ["unknown", "Neckline is not checked."],
  ]);
});

test("a gap is listed only when every value behind it is confirmed", () => {
  const elbow = {
    ...tunic,
    attributes: { ...tunic.attributes, sleeve: "elbow" as const },
  };
  assert.deepEqual(texts([elbow, trousers])[0], [
    "gap",
    "Sleeves are shorter than your coverage choice.",
  ]);
  const guessed = { ...elbow, sources: { sleeve: "proposed" as const } };
  assert.deepEqual(texts([guessed, trousers])[0], [
    "unknown",
    "Sleeve length is not confirmed yet.",
  ]);
  const unknownBlazer = { ...blazer, attributes: {} };
  assert.deepEqual(texts([elbow, unknownBlazer, trousers])[0], [
    "unknown",
    "Sleeve length is not confirmed yet.",
  ]);
  assert.deepEqual(texts([elbow, blazer, trousers])[0], [
    "ok",
    "Long sleeves.",
  ]);
  const sheer = {
    ...blazer,
    attributes: { sleeve: "long" as const, sheer: true },
  };
  assert.deepEqual(texts([elbow, sheer, trousers])[0], [
    "gap",
    "Sleeves are shorter than your coverage choice.",
  ]);
});

test("without a coverage choice nothing is ever a gap", () => {
  const short = {
    ...tunic,
    attributes: { ...tunic.attributes, sleeve: "short" as const },
  };
  const cropped = {
    ...trousers,
    attributes: { ...trousers.attributes, length: "calf" as const },
  };
  assert.deepEqual(texts([short, cropped], neutralProfile).slice(0, 2), [
    ["ok", "Short sleeves."],
    ["ok", "Covers to the calf."],
  ]);
  assert.deepEqual(
    texts([short, cropped], { ...neutralProfile, coverageLevel: "moderate" })
      .slice(0, 2)
      .map(([state]) => state),
    ["gap", "ok"],
  );
});

test("a hijab tip appears only when her preference is unset and she owns none", () => {
  const outfit = [tunic, trousers, loafers];
  const tip = outfitTip(
    outfit,
    outfit,
    request({ hijab: null }),
    neutralProfile,
  )!;
  assert.equal(tip.kind, "hijab");
  assert.match(tipText(tip, "en"), /^A hijab in [a-z ]+ would finish this\.$/);
  assert.match(
    tipText(tip, "nb"),
    /^En hijab i [a-zæøå ]+ ville fullført antrekket\.$/,
  );
  assert.equal(outfit.length, 3);
  assert.notEqual(
    outfitTip(
      outfit,
      [...outfit, hijab],
      request({ hijab: null }),
      neutralProfile,
    )?.kind,
    "hijab",
  );
  assert.notEqual(
    outfitTip(outfit, outfit, request({ hijab: "not-needed" }), neutralProfile)
      ?.kind,
    "hijab",
  );
});

test("a bag tip appears at work, where a bag helps, and not on an everyday outfit", () => {
  const outfit = [tunic, trousers, hijab, loafers];
  assert.equal(
    outfitTip(outfit, outfit, request(), neutralProfile)?.kind,
    "handbag",
  );
  assert.equal(
    outfitTip(
      outfit,
      outfit,
      request({ occasion: "everyday" }),
      neutralProfile,
    ),
    null,
  );
  const bag = piece("bag", "bag", "handbag", [142, 120, 106]);
  assert.equal(
    outfitTip(outfit, [...outfit, bag], request(), neutralProfile),
    null,
  );
});

test("a coat tip appears on a cold day only when she owns no layer", () => {
  const cold = request({
    occasion: "everyday",
    weather: {
      source: "manual",
      warmth: "cold",
      precipitation: "dry",
      exposure: null,
    },
  });
  const outfit = [tunic, trousers, hijab, loafers];
  assert.equal(outfitTip(outfit, outfit, cold, neutralProfile)?.kind, "coat");
  assert.equal(
    outfitTip(outfit, [...outfit, blazer], cold, neutralProfile),
    null,
  );
});

test("a bag that is away still counts as hers, so no bag tip is shown", () => {
  const outfit = [tunic, trousers, hijab, loafers];
  const bag = piece(
    "bag",
    "bag",
    "handbag",
    [142, 120, 106],
    {},
    { status: "away", away: "wash" },
  );
  assert.equal(
    outfitTip(outfit, [...outfit, bag], request(), neutralProfile),
    null,
  );
});

test("the coverage line names the layer or bottom that does the work", () => {
  const need = { sleeve: "long" as const, hem: "ankle" as const };
  const abaya = plainPiece("a", "dress", {
    kind: "abaya",
    attributes: { sleeve: "long", length: "ankle" },
    sources: { sleeve: "confirmed", length: "confirmed" },
  });
  const top = plainPiece("t", "top", {
    kind: "top",
    attributes: { sleeve: "short" },
    sources: { sleeve: "confirmed" },
  });
  const blazer = plainPiece("b", "layer", {
    kind: "blazer",
    attributes: { sleeve: "long" },
    sources: { sleeve: "confirmed" },
  });
  const kameez = plainPiece("k", "tunic", {
    kind: "kameez",
    attributes: { sleeve: "long", length: "thigh" },
    sources: { sleeve: "confirmed", length: "confirmed" },
  });
  const trousers = plainPiece("tr", "bottom", {
    kind: "trousers",
    attributes: { length: "ankle" },
    sources: { length: "confirmed" },
  });
  assert.equal(coverageNote([abaya], need, "en"), null);
  assert.equal(
    coverageNote([top, blazer, trousers], need, "en"),
    "Blazer covers the arms.",
  );
  assert.equal(
    coverageNote([kameez, trousers], need, "en"),
    "Trousers reach the ankle.",
  );
  assert.equal(coverageNote([kameez, trousers], undefined, "en"), null);
  assert.equal(
    coverageNote([kameez, trousers], need, "nb"),
    "Buksen når til ankelen.",
  );
});
