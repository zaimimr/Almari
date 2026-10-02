import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyCloset,
  neutralProfile,
  savePiece,
  type Category,
  type ColourProfile,
  type GarmentKind,
  type OutfitRequest,
  type Piece,
  type StyleProfile,
} from "../closet";
import { toRgb } from "../color";
import { bestColours } from "../colourAnalysis";
import { styleOutfits } from "../styling";
import { ruleBook } from "./rulebook";
import { reasonFor, ruleHits } from "./rules";
import { rulesScorer } from "./rulesScorer";
import { scoreContext } from "./taste";

const request: OutfitRequest = {
  occasion: "everyday",
  style: "western",
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather: { source: "unknown" },
  hijab: "always",
  wardrobe: "owned",
};

const warm: ColourProfile = {
  skin: null,
  hair: null,
  eyes: null,
  undertone: "warm",
  depth: "medium",
  contrast: "medium",
  season: "warm-autumn",
  source: "confirmed",
};

const piece = (
  id: string,
  category: Category,
  kind: GarmentKind,
  rgb: [number, number, number],
): Piece => ({
  id,
  name: id,
  category,
  kind,
  photo: `${id}.jpg`,
  createdAt: "2026-10-01T00:00:00Z",
  source: "owned",
  attributes: { pattern: "solid" },
  colors: [{ rgb, share: 1 }],
});

const top = piece("ivory tunic", "tunic", "tunic", [236, 231, 218]);
const bestHijab = piece(
  "best hijab",
  "hijab",
  "hijab",
  toRgb(bestColours(warm)[0]!),
);
const icyHijab = piece("icy hijab", "hijab", "hijab", [140, 180, 220]);
const trousers = piece("charcoal trousers", "bottom", "trousers", [62, 62, 64]);
const loafers = piece("brown loafers", "shoes", "loafers", [78, 52, 42]);

const profile = (colour: ColourProfile | null): StyleProfile => ({
  ...neutralProfile,
  colour,
});

const faceHits = (pieces: Piece[], colour: ColourProfile | null) =>
  ruleHits(ruleBook, pieces, request, profile(colour)).filter((hit) =>
    hit.rule.id.startsWith("face-"),
  );

test("without a colour analysis the face rules never fire", () => {
  assert.deepEqual(faceHits([top, bestHijab], null), []);
  assert.deepEqual(faceHits([top, icyHijab], null), []);
});

test("a hijab in one of her best colours earns a true reason", () => {
  const hit = faceHits([top, bestHijab], warm).find(
    (item) => item.rule.id === "face-best-colour-hijab",
  )!;
  assert.ok(hit);
  assert.equal(hit.certain, true);
  assert.equal(
    reasonFor(hit, request),
    "The best hijab is one of your best colours near your face.",
  );
});

test("an analysis she has not confirmed may score but never explains", () => {
  const measured = { ...warm, source: "measured" as const };
  const hit = faceHits([top, bestHijab], measured).find(
    (item) => item.rule.id === "face-best-colour-hijab",
  )!;
  assert.equal(hit.certain, false);
  const result = rulesScorer.score(
    [top, bestHijab, trousers, loafers],
    request,
    {
      ...scoreContext(emptyCloset),
      profile: profile(measured),
    },
  );
  assert.ok(!result.reasons.some((reason) => reason.includes("best colours")));
});

test("a vivid cool hijab next to a warm undertone costs a little, a neutral undertone never", () => {
  assert.ok(
    faceHits([top, icyHijab], warm).some(
      (hit) => hit.rule.id === "face-undertone-clash",
    ),
  );
  assert.ok(
    !faceHits([top, icyHijab], { ...warm, undertone: "neutral" }).some(
      (hit) => hit.rule.id === "face-undertone-clash",
    ),
  );
});

test("the colour layer reorders outfits and never removes one", () => {
  const closet = [top, bestHijab, icyHijab, trousers, loafers].reduce(
    savePiece,
    emptyCloset,
  );
  const run = (colour: ColourProfile | null) =>
    styleOutfits(closet.pieces, request, "2026-10-01:owned", rulesScorer, {
      ...scoreContext(closet),
      profile: profile(colour),
    });
  const sets = (colour: ColourProfile | null) =>
    run(colour)
      .outfits.map((outfit) => [...outfit.ids].sort().join())
      .sort();
  assert.deepEqual(sets(warm), sets(null));
  assert.equal(run(warm).outfits.length, 2);
  assert.ok(run(warm).outfits[0]!.ids.includes("best hijab"));
});
