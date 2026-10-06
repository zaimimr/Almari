import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyCloset,
  type GarmentKind,
  type OutfitRequest,
  type Piece,
  type Weather,
} from "./closet";
import { rulesScorer } from "./scoring/rulesScorer";
import { scoreContext } from "./scoring/taste";
import { evaluateOutfit, roleOf, styleOutfits } from "./styling";
import { piece } from "./test-helpers";
import { neededWarmth } from "./weather";

const context = scoreContext(emptyCloset);
const categoryFor: Partial<Record<GarmentKind, Piece["category"]>> = {
  shirt: "top",
  "t-shirt": "top",
  blouse: "top",
  sweater: "top",
  kameez: "tunic",
  dress: "dress",
  skirt: "bottom",
  lehenga: "bottom",
  trousers: "bottom",
  jeans: "bottom",
  leggings: "bottom",
  tights: "bottom",
  churidar: "bottom",
  cardigan: "layer",
  coat: "layer",
  sneakers: "shoes",
};
const make = (kind: GarmentKind, id: string = kind) =>
  piece(id, categoryFor[kind]!, { kind, styles: ["western", "desi"] });

const request = (changes: Partial<OutfitRequest> = {}): OutfitRequest => ({
  occasion: "everyday",
  style: "western",
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather: { source: "unknown" },
  hijab: "not-needed",
  wardrobe: "owned",
  ...changes,
});

const conflicts = (...kinds: GarmentKind[]) => {
  const outfit = kinds.map((kind, at) => make(kind, `${kind}-${at}`));
  return evaluateOutfit(outfit, request(), outfit).filter(
    (problem) => problem.severity === "conflict",
  ).length;
};

const forecast = (
  feelsLike: number,
  exposure: "mostly-indoors" | "time-outside" | null = "time-outside",
): Weather => ({
  source: "forecast",
  warmth: feelsLike >= 18 ? "warm" : feelsLike < 8 ? "cold" : "mild",
  precipitation: "dry",
  exposure,
  at: "2026-10-06",
  feelsLike,
});

const style = (pieces: Piece[], changes: Partial<OutfitRequest> = {}) =>
  styleOutfits(pieces, request(changes), "seed", rulesScorer, context);

test("leggings and tights go under a skirt and churidar stays a bottom under a kameez", () => {
  const skirt = make("skirt");
  const leggings = make("leggings");
  assert.equal(roleOf(leggings), "bottom");
  assert.equal(roleOf(leggings, [skirt, leggings]), "under");
  assert.equal(roleOf(make("tights")), "under");
  assert.equal(roleOf(make("churidar"), [make("kameez")]), "bottom");
  assert.equal(conflicts("blouse", "skirt", "leggings", "sneakers"), 0);
  assert.equal(conflicts("blouse", "skirt", "tights", "sneakers"), 0);
  assert.equal(conflicts("kameez", "churidar", "sneakers"), 0);
});

test("a sweater is a mid layer over a shirt and the main piece on its own", () => {
  const sweater = make("sweater");
  assert.equal(roleOf(sweater), "main");
  assert.equal(roleOf(sweater, [make("shirt"), sweater]), "layer");
  assert.equal(conflicts("shirt", "sweater", "trousers", "sneakers"), 0);
});

test("a dress can go over leggings or trousers", () => {
  assert.equal(conflicts("dress", "leggings", "sneakers"), 0);
  assert.equal(conflicts("dress", "trousers", "sneakers"), 0);
  assert.equal(conflicts("dress", "tights", "sneakers"), 0);
});

test("impossible stacks stay impossible", () => {
  assert.ok(conflicts("blouse", "skirt", "trousers", "sneakers") > 0);
  assert.ok(conflicts("blouse", "jeans", "trousers", "sneakers") > 0);
  assert.ok(conflicts("sweater", "sweater", "trousers", "sneakers") > 0);
  assert.ok(conflicts("shirt", "sweater", "sweater", "jeans", "sneakers") > 0);
  assert.ok(conflicts("shirt", "sweater", "cardigan", "jeans", "sneakers") > 0);
  assert.ok(conflicts("dress", "skirt", "sneakers") > 0);
  assert.ok(conflicts("dress", "lehenga", "sneakers") > 0);
  assert.ok(conflicts("blouse", "skirt", "leggings", "tights", "sneakers") > 0);
});

test("the stylist puts leggings under a skirt and a sweater over a shirt", () => {
  const pieces = [
    make("shirt"),
    make("skirt"),
    make("leggings"),
    make("sweater"),
    make("sneakers"),
  ];
  const ids = style(pieces).outfits.map((outfit) => [...outfit.ids].sort());
  assert.ok(
    ids.some(
      (outfit) => outfit.includes("skirt") && outfit.includes("leggings"),
    ),
  );
  assert.ok(
    ids.some(
      (outfit) => outfit.includes("shirt") && outfit.includes("sweater"),
    ),
  );
  assert.ok(
    !ids.some((outfit) => outfit.includes("skirt") && outfit.length < 3),
  );
});

test("needed warmth follows the feels-like temperature and falls back to the bucket", () => {
  assert.equal(neededWarmth({ source: "unknown" }), null);
  assert.equal(neededWarmth(forecast(22)), 0);
  assert.equal(neededWarmth(forecast(18)), 0);
  assert.equal(neededWarmth(forecast(14)), 1);
  assert.equal(neededWarmth(forecast(7)), 2);
  assert.equal(neededWarmth(forecast(-2)), 3);
  assert.equal(
    neededWarmth({
      source: "manual",
      warmth: "cold",
      precipitation: "dry",
      exposure: null,
    }),
    3,
  );
});

const layered = [
  make("t-shirt"),
  make("jeans"),
  make("cardigan"),
  make("coat"),
  make("sneakers"),
];

test("a warm day adds no layers unless one is asked for", () => {
  const warm = style(layered, { weather: forecast(24) });
  assert.ok(warm.outfits.length > 0);
  assert.ok(
    warm.outfits.every(
      (outfit) =>
        !outfit.ids.includes("cardigan") && !outfit.ids.includes("coat"),
    ),
  );
  const asked = style(layered, {
    weather: forecast(24),
    garmentType: "cardigan",
  });
  assert.ok(asked.outfits[0]!.ids.includes("cardigan"));
});

test("a mild day adds a light layer until the warmth target is met", () => {
  const mild = style(layered, { weather: forecast(14) });
  assert.ok(mild.outfits.length > 0);
  for (const outfit of mild.outfits) {
    assert.ok(outfit.ids.includes("cardigan"));
    assert.ok(!outfit.ids.includes("coat"));
  }
});

test("a cold day outside adds the coat and marks it for outside", () => {
  const cold = style(layered, { weather: forecast(1) });
  assert.ok(cold.outfits.length > 0);
  for (const outfit of cold.outfits) {
    assert.ok(outfit.ids.includes("coat"));
    assert.deepEqual(outfit.outdoor, ["coat"]);
  }
});

test("a cold day mostly indoors keeps the coat optional", () => {
  const indoors = style(layered, {
    weather: forecast(1, "mostly-indoors"),
  });
  assert.ok(indoors.outfits.length > 0);
  assert.ok(indoors.outfits.some((outfit) => !outfit.ids.includes("coat")));
  assert.ok(indoors.outfits.every((outfit) => outfit.ids.includes("cardigan")));
});
